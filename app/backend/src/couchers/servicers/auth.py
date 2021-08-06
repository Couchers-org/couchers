import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.crypto import cookiesafe_secure_token, hash_password, verify_password
from couchers.db import session_scope
from couchers.models import ContributorForm, LoginToken, PasswordResetToken, SignupFlow, User, UserSession
from couchers.servicers.account import abort_on_invalid_password, contributeoption2sql
from couchers.servicers.api import hostingstatus2sql
from couchers.sql import couchers_select as select
from couchers.tasks import (
    enforce_community_memberships_for_user,
    maybe_send_contributor_form_email,
    send_login_email,
    send_onboarding_email,
    send_password_reset_email,
    send_signup_email,
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
)
from proto import auth_pb2, auth_pb2_grpc

logger = logging.getLogger(__name__)


def _auth_res(user):
    return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)


def create_session(context, session, user, long_lived, is_api_key=False, duration=None):
    """
    Creates a session for the given user and returns the token and expiry.

    You need to give an active DB session as nested sessions don't really
    work here due to the active User object.

    Will abort the API calling context if the user is banned from logging in.

    You can set the cookie on the client (if `is_api_key=False`) with

    ```py3
    token, expiry = create_session(...)
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
        is_api_key=is_api_key,
    )
    if duration:
        user_session.expiry = func.now() + duration

    session.add(user_session)
    session.commit()

    logger.debug(f"Handing out {token=} to {user=}")
    return token, user_session.expiry


def delete_session(token):
    """
    Deletes the given session (practically logging the user out)

    Returns True if the session was found, False otherwise.
    """
    with session_scope() as session:
        user_session = session.execute(
            select(UserSession).where(UserSession.token == token).where(UserSession.is_valid)
        ).scalar_one_or_none()
        if user_session:
            user_session.deleted = func.now()
            session.commit()
            return True
        else:
            return False


class Auth(auth_pb2_grpc.AuthServicer):
    """
    The Auth servicer.

    This class services the Auth service/API.
    """

    def _username_available(self, username):
        """
        Checks if the given username adheres to our rules and isn't taken already.
        """
        logger.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope() as session:
            # check for existing user with that username
            user_exists = (
                session.execute(select(User).where(User.username == username)).scalar_one_or_none() is not None
            )
            # check for started signup with that username
            signup_exists = (
                session.execute(select(SignupFlow).where(SignupFlow.username == username)).scalar_one_or_none()
                is not None
            )
            # return False if user exists, True otherwise
            return not user_exists and not signup_exists

    def SignupFlow(self, request, context):
        with session_scope() as session:
            if request.email_token:
                # the email token can either be for verification or just to find an existing signup
                flow = session.execute(
                    select(SignupFlow)
                    .where(SignupFlow.email_verified == False)
                    .where(SignupFlow.email_token == request.email_token)
                    .where(SignupFlow.token_is_valid)
                ).scalar_one_or_none()
                if flow:
                    # find flow by email verification token and mark it as verified
                    flow.email_verified = True
                    flow.email_token = None
                    flow.email_token_expiry = None

                    session.flush()
                else:
                    # just try to find the flow by flow token, no verification is done
                    flow = session.execute(
                        select(SignupFlow).where(SignupFlow.flow_token == request.email_token)
                    ).scalar_one_or_none()
                    if not flow:
                        context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
            else:
                if not request.flow_token:
                    # fresh signup
                    if not request.HasField("basic"):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.SIGNUP_FLOW_BASIC_NEEDED)
                    # TODO: unique across both tables
                    existing_user = session.execute(
                        select(User).where(User.email == request.basic.email)
                    ).scalar_one_or_none()
                    if existing_user:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_EMAIL_TAKEN)
                    existing_flow = session.execute(
                        select(SignupFlow).where(SignupFlow.email == request.basic.email)
                    ).scalar_one_or_none()
                    if existing_flow:
                        send_signup_email(existing_flow)
                        session.commit()
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP)

                    if not is_valid_email(request.basic.email):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)
                    if not is_valid_name(request.basic.name):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)

                    flow_token = cookiesafe_secure_token()

                    flow = SignupFlow(
                        flow_token=flow_token,
                        name=request.basic.name,
                        email=request.basic.email,
                    )
                    session.add(flow)
                    session.flush()
                else:
                    # not fresh signup
                    flow = session.execute(
                        select(SignupFlow).where(SignupFlow.flow_token == request.flow_token)
                    ).scalar_one_or_none()
                    if not flow:
                        context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
                    if request.HasField("basic"):
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_BASIC_FILLED)

                # we've found and/or created a new flow, now sort out other parts
                if request.HasField("account"):
                    if flow.account_is_filled:
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

                    if not request.account.accept_tos:
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MUST_ACCEPT_TOS)

                    flow.username = request.account.username
                    flow.hashed_password = hashed_password
                    flow.birthdate = birthdate
                    flow.gender = request.account.gender
                    flow.hosting_status = hostingstatus2sql[request.account.hosting_status]
                    flow.city = request.account.city
                    flow.geom = create_coordinate(request.account.lat, request.account.lng)
                    flow.geom_radius = request.account.radius
                    flow.accepted_tos = TOS_VERSION
                    session.flush()

                if request.HasField("feedback"):
                    if flow.filled_feedback:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_FEEDBACK_FILLED)
                    form = request.feedback

                    flow.filled_feedback = True
                    flow.ideas = form.ideas
                    flow.features = form.features
                    flow.experience = form.experience
                    flow.contribute = contributeoption2sql[form.contribute]
                    flow.contribute_ways = form.contribute_ways
                    flow.expertise = form.expertise
                    session.flush()

                if request.HasField("accept_community_guidelines"):
                    if not request.accept_community_guidelines.value:
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MUST_ACCEPT_COMMUNITY_GUIDELINES)
                    flow.accepted_community_guidelines = GUIDELINES_VERSION
                    session.flush()

                # send verification email if needed
                if not flow.email_sent:
                    send_signup_email(flow)

                session.flush()

            # finish the signup if done
            if flow.is_completed:
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
                    accepted_community_guidelines=flow.accepted_community_guidelines,
                    onboarding_emails_sent=1,
                    last_onboarding_email_sent=func.now(),
                )

                session.add(user)

                form = ContributorForm(
                    user=user,
                    ideas=flow.ideas or None,
                    features=flow.features or None,
                    experience=flow.experience or None,
                    contribute=flow.contribute or None,
                    contribute_ways=flow.contribute_ways,
                    expertise=flow.expertise or None,
                )

                session.add(form)

                user.filled_contributor_form = form.is_filled

                session.delete(flow)
                session.commit()

                enforce_community_memberships_for_user(session, user)

                if form.is_filled:
                    user.filled_contributor_form = True

                maybe_send_contributor_form_email(form)

                send_onboarding_email(user, email_number=1)

                token, expiry = create_session(context, session, user, False)
                context.send_initial_metadata(
                    [
                        ("set-cookie", create_session_cookie(token, expiry)),
                    ]
                )
                return auth_pb2.SignupFlowRes(
                    auth_res=_auth_res(user),
                )
            else:
                return auth_pb2.SignupFlowRes(
                    flow_token=flow.flow_token,
                    need_account=not flow.account_is_filled,
                    need_feedback=not flow.filled_feedback,
                    need_verify_email=not flow.email_verified,
                    need_accept_community_guidelines=flow.accepted_community_guidelines < GUIDELINES_VERSION,
                )

    def UsernameValid(self, request, context):
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=self._username_available(request.username.lower()))

    def Login(self, request, context):
        """
        Does the first step of the Login flow.

        The user is searched for using their id, username, or email.

        If the user does not exist or has been deleted, throws a NOT_FOUND rpc error.

        If the user has a password, returns NEED_PASSWORD.

        If the user exists but does not have a password, generates a login token, send it in the email and returns SENT_LOGIN_EMAIL.
        """
        logger.debug(f"Attempting login for {request.user=}")
        with session_scope() as session:
            # if the user is banned, they can get past this but get an error later in login flow
            user = session.execute(
                select(User).where_username_or_email(request.user).where(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                if user.has_password:
                    logger.debug(f"Found user with password")
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.NEED_PASSWORD)
                else:
                    logger.debug(f"Found user without password, sending login email")
                    send_login_email(session, user)
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL)
            else:  # user not found
                logger.debug(f"Didn't find user")
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

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
                .where(LoginToken.token == request.login_token)
                .where(LoginToken.is_valid)
            ).one_or_none()
            if res:
                login_token, user = res

                # delete the login token so it can't be reused
                session.delete(login_token)
                session.commit()

                # create a session
                token, expiry = create_session(context, session, user, False)
                context.send_initial_metadata(
                    [
                        ("set-cookie", create_session_cookie(token, expiry)),
                    ]
                )
                return _auth_res(user)
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
                select(User).where_username_or_email(request.user).where(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                logger.debug(f"Found user")
                if not user.has_password:
                    logger.debug(f"User doesn't have a password!")
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PASSWORD)
                if verify_password(user.hashed_password, request.password):
                    logger.debug(f"Right password")
                    # correct password
                    token, expiry = create_session(context, session, user, request.remember_device)
                    context.send_initial_metadata(
                        [
                            ("set-cookie", create_session_cookie(token, expiry)),
                        ]
                    )
                    return _auth_res(user)
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
        Removes an active cookie session.
        """
        token = parse_session_cookie(dict(context.invocation_metadata()))
        logger.info(f"Deauthenticate(token={token})")

        # if we had a token, try to remove the session
        if token:
            delete_session(token)

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
                select(User).where_username_or_email(request.user).where(~User.is_deleted)
            ).scalar_one_or_none()
            if user:
                send_password_reset_email(session, user)

                notify(
                    content=easy_notification_formatter(
                        "Password reset requested", "Someone requested a password reset for your account."
                    ),
                    user_id=user.id,
                    topic="password",
                    action="reset_request",
                )

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
                .where(PasswordResetToken.token == request.password_reset_token)
                .where(PasswordResetToken.is_valid)
            ).one_or_none()
            if res:
                password_reset_token, user = res
                session.delete(password_reset_token)
                user.hashed_password = None
                session.commit()

                notify(
                    content=easy_notification_formatter("Password reset completed", "Your password was reset."),
                    user_id=user.id,
                    topic="password",
                    action="reset",
                )

                return empty_pb2.Empty()
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

    def ConfirmChangeEmail(self, request, context):
        with session_scope() as session:
            user_with_valid_token_from_old_email = session.execute(
                select(User)
                .where(User.old_email_token == request.change_email_token)
                .where(User.old_email_token_created <= now())
                .where(User.old_email_token_expiry >= now())
            ).scalar_one_or_none()
            user_with_valid_token_from_new_email = session.execute(
                select(User)
                .where(User.new_email_token == request.change_email_token)
                .where(User.new_email_token_created <= now())
                .where(User.new_email_token_expiry >= now())
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

                notify(
                    content=easy_notification_formatter(
                        "Email change complete", "Your email was was succesfully changed to {user.new_email}."
                    ),
                    user_id=user.id,
                    topic="email",
                    action="change",
                )

                return auth_pb2.ConfirmChangeEmailRes(state=auth_pb2.EMAIL_CONFIRMATION_STATE_SUCCESS)
            elif user.need_to_confirm_via_old_email:
                return auth_pb2.ConfirmChangeEmailRes(
                    state=auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL
                )
            else:
                return auth_pb2.ConfirmChangeEmailRes(
                    state=auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL
                )
