import logging
from datetime import datetime

import grpc
import pytz
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.config import config
from couchers.constants import TOS_VERSION
from couchers.crypto import cookiesafe_secure_token, hash_password, urlsafe_secure_token, verify_password
from couchers.db import new_login_token, new_password_reset_token, session_scope, set_flow_email_verification_token
from couchers.interceptors import AuthValidatorInterceptor
from couchers.models import ContributeOption, LoginToken, PasswordResetToken, SignupFlow, User, UserSession
from couchers.servicers.account import abort_on_invalid_password
from couchers.servicers.api import hostingstatus2sql
from couchers.tasks import (
    send_flow_email_verification_email,
    send_login_email,
    send_onboarding_email,
    send_password_reset_email,
)
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
    today,
)
from pb import auth_pb2, auth_pb2_grpc

logger = logging.getLogger(__name__)


contributeoption2sql = {
    auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED: None,
    auth_pb2.CONTRIBUTE_OPTION_YES: ContributeOption.yes,
    auth_pb2.CONTRIBUTE_OPTION_MAYBE: ContributeOption.maybe,
    auth_pb2.CONTRIBUTE_OPTION_NO: ContributeOption.no,
}

contributeoption2api = {
    None: auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED,
    ContributeOption.yes: auth_pb2.CONTRIBUTE_OPTION_YES,
    ContributeOption.maybe: auth_pb2.CONTRIBUTE_OPTION_MAYBE,
    ContributeOption.no: auth_pb2.CONTRIBUTE_OPTION_NO,
}


class Auth(auth_pb2_grpc.AuthServicer):
    """
    The Auth servicer.

    This class services the Auth service/API.
    """

    def get_auth_interceptor(self, allow_jailed):
        """
        Returns an auth interceptor.

        By adding this interceptor to a service, all requests to that service will require a bearer authorization with a valid session from the Auth service.

        The user_id will be available in the RPC context through context.user_id.
        """
        return AuthValidatorInterceptor(self.get_session_for_token, allow_jailed)

    def get_session_for_token(self, token):
        """
        Returns None if the session token is not valid, and (user_id, jailed) corresponding to the session token otherwise.

        Also updates the user last active time, token last active time, and increments API call count.
        """
        with session_scope() as session:
            result = (
                session.query(User, UserSession)
                .join(User, User.id == UserSession.user_id)
                .filter(UserSession.token == token)
                .filter(UserSession.is_valid)
                .one_or_none()
            )

            if not result:
                return None
            else:
                user, user_session = result

                # update user last active time
                user.last_active = func.now()

                # let's update the token
                user_session.last_seen = func.now()
                user_session.api_calls += 1
                session.flush()

                return user.id, user.is_jailed

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
            user_session = (
                session.query(UserSession).filter(UserSession.token == token).filter(UserSession.is_valid).one_or_none()
            )
            if user_session:
                user_session.deleted = func.now()
                session.commit()
                return True
            else:
                return False

    def _username_available(self, username):
        """
        Checks if the given username adheres to our rules and isn't taken already.
        """
        logger.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope() as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            # return False if user exists, True otherwise
            return user is None

    def SignupFlow(self, request, context):
        # TODO: extract errors
        with session_scope() as session:
            if request.email_verification_token:
                flow = (
                    session.query(SignupFlow)
                    .filter(SignupFlow.email_verified == False)
                    .filter(SignupFlow.email_token == request.email_verification_token)
                    .one_or_none()
                )
                if not flow:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
                flow.email_verified = True
                flow.email_token = None
                flow.email_token_created = None
                flow.email_token_expiry = None

                session.flush()
            else:
                if not request.flow_token:
                    # fresh signup
                    if not request.HasField("basic"):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.SIGNUP_FLOW_BASIC_NEEDED)
                    # TODO: unique across both tables
                    existing_user = session.query(User).filter(User.email == request.basic.email).one_or_none()
                    if existing_user:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_EMAIL_TAKEN)
                    existing_flow = (
                        session.query(SignupFlow).filter(SignupFlow.email == request.basic.email).one_or_none()
                    )
                    if existing_flow:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP)

                    if not is_valid_email(request.basic.email):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)
                    if not is_valid_name(request.basic.name):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)

                    flow_token = urlsafe_secure_token()

                    flow = SignupFlow(
                        flow_token=flow_token,
                        name=request.basic.name,
                        email=request.basic.email,
                    )
                    session.add(flow)
                    session.flush()
                else:
                    # not fresh signup
                    flow = session.query(SignupFlow).filter(SignupFlow.flow_token == request.flow_token).one_or_none()
                    if not flow:
                        context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
                    if request.HasField("basic"):
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_BASIC_FILLED)

                # we've found and/or created a new flow, now sort out other parts
                if request.HasField("account"):
                    if flow.filled_account:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_ACCOUNT_FILLED)

                    # check username validity
                    if not is_valid_username(request.account.username):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME)

                    if not self._username_available(request.account.username):
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USERNAME_NOT_AVAILABLE)

                    if request.account.password:
                        abort_on_invalid_password(request.account.password, context)
                        hashed_password = hash_password(request.account.password)
                    else:
                        hashed_password = None

                    birthdate = parse_date(request.account.birthdate)
                    if not birthdate or birthdate >= minimum_allowed_birthdate():
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.INVALID_BIRTHDATE)

                    if not request.account.hosting_status:
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOSTING_STATUS_REQUIRED)

                    if request.account.lat == 0 and request.account.lng == 0:
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)

                    flow.filled_account = True
                    flow.username = request.account.username
                    flow.hashed_password = hashed_password
                    flow.birthdate = birthdate
                    flow.gender = request.account.gender
                    flow.hosting_status = hostingstatus2sql[request.account.hosting_status]
                    flow.city = request.account.city
                    flow.geom = create_coordinate(request.account.lat, request.account.lng)
                    flow.geom_radius = request.account.radius
                    flow.accepted_tos = TOS_VERSION if request.account.accept_tos else 0
                    session.flush()

                if request.HasField("feedback"):
                    if flow.filled_feedback:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_FEEDBACK_FILLED)

                    flow.filled_feedback = True
                    ideas = request.feedback.ideas
                    features = request.feedback.features
                    experience = request.feedback.experience
                    contribute = contributeoption2sql[request.feedback.contribute]
                    contribute_ways = request.feedback.contribute_ways
                    expertise = request.feedback.expertise
                    session.flush()

                # send verification email if needed
                if not flow.email_sent:
                    verification_token, expiry_text = set_flow_email_verification_token(session, flow)
                    send_flow_email_verification_email(flow.email, verification_token, expiry_text)
                    flow.email_sent = True

                session.flush()

            # finish the signup if done
            if flow.is_completed:
                # TODO: storing feedback forms

                user = User(
                    name=flow.name,
                    email=flow.email,
                    username=flow.username,
                    hashed_password=flow.hashed_password,
                    birthdate=flow.birthdate,
                    gender=flow.gender,
                    hosting_status=flow.hosting_status,
                    city=flow.city,
                    geom=flow.geom,
                    geom_radius=flow.geom_radius,
                    accepted_tos=flow.accepted_tos,
                    onboarding_emails_sent=1,
                    last_onboarding_email_sent=func.now(),
                )

                session.delete(flow)

                session.add(user)
                session.commit()

                send_onboarding_email(user, email_number=1)

                token, expiry = self._create_session(context, session, user, False)
                context.send_initial_metadata(
                    [
                        ("set-cookie", create_session_cookie(token, expiry)),
                    ]
                )
                return auth_pb2.SignupFlowRes(
                    success=True,
                    user_id=user.id,
                )
            else:
                return auth_pb2.SignupFlowRes(
                    flow_token=flow.flow_token,
                    need_account=not flow.filled_account,
                    need_feedback=not flow.filled_feedback,
                    need_verify_email=not flow.email_verified,
                )

    def VerifyEmail(self, request, context):
        if not is_valid_email(request.email):
            return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.INVALID_EMAIL)
        with session_scope() as session:
            user = session.query(User).filter(User.email == request.email).one_or_none()
            if not user:
                token, expiry_text = new_signup_token(session, request.email)
                send_signup_email(request.email, token, expiry_text)
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.EMAIL_EXISTS)

    def UsernameValid(self, request, context):
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=self._username_available(request.username.lower()))

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
            user = session.query(User).filter_by_username_or_email(request.user).filter(~User.is_deleted).one_or_none()
            if user:
                if user.hashed_password is not None:
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
            res = (
                session.query(LoginToken, User)
                .join(User, User.id == LoginToken.user_id)
                .filter(LoginToken.token == request.login_token)
                .filter(LoginToken.is_valid)
                .one_or_none()
            )
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
            user = session.query(User).filter_by_username_or_email(request.user).filter(~User.is_deleted).one_or_none()
            if user:
                logger.debug(f"Found user")
                if not user.hashed_password:
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
            user = session.query(User).filter_by_username_or_email(request.user).filter(~User.is_deleted).one_or_none()
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
            res = (
                session.query(PasswordResetToken, User)
                .join(User, User.id == PasswordResetToken.user_id)
                .filter(PasswordResetToken.token == request.password_reset_token)
                .filter(PasswordResetToken.is_valid)
                .one_or_none()
            )
            if res:
                password_reset_token, user = res
                session.delete(password_reset_token)
                user.hashed_password = None
                session.commit()
                return empty_pb2.Empty()
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

    def CompleteChangeEmail(self, request, context):
        """
        Completes an email change request.

        Removes the old email and replaces with the new
        """
        with session_scope() as session:
            user = (
                session.query(User)
                .filter(User.new_email_token == request.change_email_token)
                .filter(User.new_email_token_created <= func.now())
                .filter(User.new_email_token_expiry >= func.now())
                .one_or_none()
            )
            if user:
                user.email = user.new_email
                user.new_email = None
                user.new_email_token = None
                user.new_email_token_created = None
                user.new_email_token_expiry = None
                session.commit()
                return empty_pb2.Empty()
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
