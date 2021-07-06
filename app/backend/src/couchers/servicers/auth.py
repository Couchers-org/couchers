import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.constants import TOS_VERSION
from couchers.sql import couchers_select as select
from couchers.crypto import cookiesafe_secure_token, hash_password, verify_password
from couchers.db import new_login_token, new_password_reset_token, new_signup_token, session_scope
from couchers.models import LoginToken, PasswordResetToken, SignupToken, User, UserSession
from couchers.servicers.api import hostingstatus2sql
from couchers.tasks import send_login_email, send_onboarding_email, send_password_reset_email, send_signup_email
from couchers.utils import (
    create_coordinate,
    create_session_cookie,
    is_valid_email,
    is_valid_name,
    is_valid_username,
    minimum_allowed_birthdate,
    now,
    parse_date,
    parse_session_cookie,
)
from proto import auth_pb2, auth_pb2_grpc

logger = logging.getLogger(__name__)


class Auth(auth_pb2_grpc.AuthServicer):
    """
    The Auth servicer.

    This class services the Auth service/API.
    """

    def _create_session(self, context, session, user, long_lived):
        """
        Creates a session for the given user and returns the token and expiry.

        You need to give an active DB session as nested sessions don't really
        work here due to the active User object.

        Will abort the API calling context if the user is banned from logging in.

        You can set the cookie on the client with

        ```py3
        token, expiry = self._create_session(...)
        context.send_initial_metadata([("set-cookie", create_session_cookie(token, expiry)),])
        ```
        """
        if user.is_banned:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ACCOUNT_SUSPENDED)

        # just double check
        assert not user.is_deleted

        token = cookiesafe_secure_token()

        headers = dict(context.invocation_metadata())

        user_session = UserSession(
            token=token,
            user=user,
            long_lived=long_lived,
            ip_address=headers.get("x-forwarded-for"),
            user_agent=headers.get("user-agent"),
        )

        session.add(user_session)
        session.commit()

        logger.debug(f"Handing out {token=} to {user=}")
        return token, user_session.expiry

    def _delete_session(self, token):
        """
        Deletes the given session (practically logging the user out)

        Returns True if the session was found, False otherwise.
        """
        with session_scope() as session:
            user_session = session.execute(
                select(UserSession).filter(UserSession.token == token).filter(UserSession.is_valid)
            ).scalar_one_or_none()
            if user_session:
                user_session.deleted = func.now()
                session.commit()
                return True
            else:
                return False

    def Signup(self, request, context):
        """
        First step of Signup flow.

        If the email is not a valid email (by regexp), returns INVALID_EMAIL

        If the email already exists, returns EMAIL_EXISTS.

        Otherwise, creates a signup token and sends an email, then returns SENT_SIGNUP_EMAIL.
        """
        logger.debug(f"Signup with {request.email=}")
        if not is_valid_email(request.email):
            return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.INVALID_EMAIL)
        with session_scope() as session:
            user = session.execute(select(User).filter(User.email == request.email)).scalar_one_or_none()
            if not user:
                token, expiry_text = new_signup_token(session, request.email)
                send_signup_email(request.email, token, expiry_text)
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.EMAIL_EXISTS)

    def _username_available(self, username):
        """
        Checks if the given username adheres to our rules and isn't taken already.
        """
        logger.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope() as session:
            user = session.execute(select(User).filter(User.username == username)).scalar_one_or_none()
            # return False if user exists, True otherwise
            return user is None

    def UsernameValid(self, request, context):
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=self._username_available(request.username.lower()))

    def SignupTokenInfo(self, request, context):
        """
        Returns the email for a given SignupToken (which will be shown on the UI on the singup form).
        """
        logger.debug(f"Signup token info for {request.signup_token=}")
        with session_scope() as session:
            signup_token = session.execute(
                select(SignupToken).filter(SignupToken.token == request.signup_token).filter(SignupToken.is_valid)
            ).scalar_one_or_none()
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
            else:
                return auth_pb2.SignupTokenInfoRes(email=signup_token.email)

    def CompleteSignup(self, request, context):
        """
        Completes user sign up by creating the user in question, then logs them in.

        TODO: nice error handling for dupe username/email?
        """
        with session_scope() as session:
            signup_token = session.execute(
                select(SignupToken).filter(SignupToken.token == request.signup_token).filter(SignupToken.is_valid)
            ).scalar_one_or_none()
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

            birthdate = parse_date(request.birthdate)

            if not birthdate or birthdate >= minimum_allowed_birthdate():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_BIRTHDATE)

            # check email again
            if not is_valid_email(signup_token.email):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

            # check username validity
            if not is_valid_username(request.username):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME)

            # check name validity
            if not is_valid_name(request.name):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)

            if not request.hosting_status:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOSTING_STATUS_REQUIRED)

            if not self._username_available(request.username):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USERNAME_NOT_AVAILABLE)

            if request.lat == 0 and request.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)

            user = User(
                email=signup_token.email,
                username=request.username,
                name=request.name,
                gender=request.gender,
                birthdate=birthdate,
                hosting_status=hostingstatus2sql[request.hosting_status],
                city=request.city,
                geom=create_coordinate(request.lat, request.lng),
                geom_radius=request.radius,
                accepted_tos=TOS_VERSION if request.accept_tos else 0,
                onboarding_emails_sent=1,
                last_onboarding_email_sent=func.now(),
            )

            # happens in same transaction
            session.delete(signup_token)

            # enforces email/username uniqueness
            session.add(user)
            session.commit()

            send_onboarding_email(user, email_number=1)

            token, expiry = self._create_session(context, session, user, False)
            context.send_initial_metadata(
                [
                    ("set-cookie", create_session_cookie(token, expiry)),
                ]
            )
            return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)

    def Login(self, request, context):
        """
        Does the first step of the Login flow.

        The user is searched for using their id, username, or email.

        If the user does not exist or has been deleted, returns a LOGIN_NO_SUCH_USER.

        If the user has a password, returns NEED_PASSWORD.

        If the user exists but does not have a password, generates a login token, send it in the email and returns SENT_LOGIN_EMAIL.
        """
        logger.debug(f"Attempting login for {request.user=}")
        with session_scope() as session:
            # if the user is banned, they can get past this but get an error later in login flow
            user = session.execute(
                select(User).filter_by_username_or_email(request.user).filter(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                if user.has_password:
                    logger.debug(f"Found user with password")
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.NEED_PASSWORD)
                else:
                    logger.debug(f"Found user without password, sending login email")
                    login_token, expiry_text = new_login_token(session, user)
                    send_login_email(user, login_token, expiry_text)
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL)
            else:  # user not found
                logger.debug(f"Didn't find user")
                return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.INVALID_USER)

    def CompleteTokenLogin(self, request, context):
        """
        Second step of email-based login.

        Validates the given LoginToken (sent in email), creates a new session and returns bearer token.

        Or fails with grpc.NOT_FOUND if LoginToken is invalid.
        """
        with session_scope() as session:
            res = session.execute(
                select(LoginToken, User)
                .join(User, User.id == LoginToken.user_id)
                .filter(LoginToken.token == request.login_token)
                .filter(LoginToken.is_valid)
            ).one_or_none()
            if res:
                login_token, user = res

                # delete the login token so it can't be reused
                session.delete(login_token)
                session.commit()

                # create a session
                token, expiry = self._create_session(context, session, user, False)
                context.send_initial_metadata(
                    [
                        ("set-cookie", create_session_cookie(token, expiry)),
                    ]
                )
                return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

    def Authenticate(self, request, context):
        """
        Authenticates a classic password based login request.

        request.user can be any of id/username/email
        """
        logger.debug(f"Logging in with {request.user=}, password=*******")
        with session_scope() as session:
            user = session.execute(
                select(User).filter_by_username_or_email(request.user).filter(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                logger.debug(f"Found user")
                if not user.has_password:
                    logger.debug(f"User doesn't have a password!")
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PASSWORD)
                if verify_password(user.hashed_password, request.password):
                    logger.debug(f"Right password")
                    # correct password
                    token, expiry = self._create_session(context, session, user, request.remember_device)
                    context.send_initial_metadata(
                        [
                            ("set-cookie", create_session_cookie(token, expiry)),
                        ]
                    )
                    return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)
                else:
                    logger.debug(f"Wrong password")
                    # wrong password
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_USERNAME_OR_PASSWORD)
            else:  # user not found
                logger.debug(f"Didn't find user")
                # do about as much work as if the user was found, reduces timing based username enumeration attacks
                hash_password(request.password)
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_USERNAME_OR_PASSWORD)

    def Deauthenticate(self, request, context):
        """
        Removes an active session.
        """
        token = parse_session_cookie(dict(context.invocation_metadata()))
        logger.info(f"Deauthenticate(token={token})")

        # if we had a token, try to remove the session
        if token:
            self._delete_session(token)

        # set the cookie to an empty string and expire immediately, should remove it from the browser
        context.send_initial_metadata(
            [
                ("set-cookie", create_session_cookie("", now())),
            ]
        )

        return empty_pb2.Empty()

    def ResetPassword(self, request, context):
        """
        If the user does not exist, do nothing.

        If the user exists, we send them an email. If they have a password, clicking that email will remove the password.
        If they don't have a password, it sends them an email saying someone tried to reset the password but there was none.

        Note that as long as emails are send synchronously, this is far from constant time regardless of output.
        """
        with session_scope() as session:
            user = session.execute(
                select(User).filter_by_username_or_email(request.user).filter(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                password_reset_token, expiry_text = new_password_reset_token(session, user)
                send_password_reset_email(user, password_reset_token, expiry_text)
            else:  # user not found
                logger.debug(f"Didn't find user")

        return empty_pb2.Empty()

    def CompletePasswordReset(self, request, context):
        """
        Completes the password reset: just clears the user's password
        """
        with session_scope() as session:
            res = session.execute(
                select(PasswordResetToken, User)
                .join(User, User.id == PasswordResetToken.user_id)
                .filter(PasswordResetToken.token == request.password_reset_token)
                .filter(PasswordResetToken.is_valid)
            ).one_or_none()
            if res:
                password_reset_token, user = res
                session.delete(password_reset_token)
                user.hashed_password = None
                session.commit()
                return empty_pb2.Empty()
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

    def ConfirmChangeEmail(self, request, context):
        with session_scope() as session:
            user_with_valid_token_from_old_email = session.execute(
                select(User)
                .filter(User.old_email_token == request.change_email_token)
                .filter(User.old_email_token_created <= now())
                .filter(User.old_email_token_expiry >= now())
            ).scalar_one_or_none()
            user_with_valid_token_from_new_email = session.execute(
                select(User)
                .filter(User.new_email_token == request.change_email_token)
                .filter(User.new_email_token_created <= now())
                .filter(User.new_email_token_expiry >= now())
            ).scalar_one_or_none()

            if user_with_valid_token_from_old_email:
                user = user_with_valid_token_from_old_email
                user.old_email_token = None
                user.old_email_token_created = None
                user.old_email_token_expiry = None
                user.need_to_confirm_via_old_email = False
            elif user_with_valid_token_from_new_email:
                user = user_with_valid_token_from_new_email
                user.new_email_token = None
                user.new_email_token_created = None
                user.new_email_token_expiry = None
                user.need_to_confirm_via_new_email = False
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

            # Using "___ is False" instead of "not ___" so that "None" doesn't pass
            if user.need_to_confirm_via_old_email is False and user.need_to_confirm_via_new_email is False:
                user.email = user.new_email
                user.new_email = None
                user.need_to_confirm_via_old_email = None
                user.need_to_confirm_via_new_email = None
                return auth_pb2.ConfirmChangeEmailRes(state=auth_pb2.EMAIL_CONFIRMATION_STATE_SUCCESS)
            elif user.need_to_confirm_via_old_email:
                return auth_pb2.ConfirmChangeEmailRes(
                    state=auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL
                )
            else:
                return auth_pb2.ConfirmChangeEmailRes(
                    state=auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL
                )
