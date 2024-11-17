import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import delete, func

from couchers import errors
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION, UNDELETE_DAYS
from couchers.crypto import cookiesafe_secure_token, hash_password, urlsafe_secure_token, verify_password
from couchers.metrics import (
    account_deletion_completions_counter,
    account_recoveries_counter,
    logins_counter,
    password_reset_completions_counter,
    password_reset_initiations_counter,
    signup_completions_counter,
    signup_initiations_counter,
    signup_time_histogram,
)
from couchers.models import AccountDeletionToken, ContributorForm, PasswordResetToken, SignupFlow, User, UserSession
from couchers.notifications.notify import notify
from couchers.notifications.unsubscribe import unsubscribe
from couchers.servicers.account import abort_on_invalid_password, contributeoption2sql
from couchers.servicers.api import hostingstatus2sql
from couchers.sql import couchers_select as select
from couchers.tasks import (
    enforce_community_memberships_for_user,
    maybe_send_contributor_form_email,
    send_signup_email,
)
from couchers.utils import (
    create_coordinate,
    create_session_cookies,
    is_valid_email,
    is_valid_name,
    is_valid_username,
    minimum_allowed_birthdate,
    now,
    parse_date,
    parse_session_cookie,
)
from proto import auth_pb2, auth_pb2_grpc, notification_data_pb2

logger = logging.getLogger(__name__)


def _auth_res(user):
    return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)


def create_session(context, session, user, long_lived, is_api_key=False, duration=None, set_cookie=True):
    """
    Creates a session for the given user and returns the token and expiry.

    You need to give an active DB session as nested sessions don't really
    work here due to the active User object.

    Will abort the API calling context if the user is banned from logging in.

    You can set the cookie on the client (if `is_api_key=False`) with

    ```py3
    token, expiry = create_session(...)
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
        ip_address=headers.get("x-couchers-real-ip"),
        user_agent=headers.get("user-agent"),
        is_api_key=is_api_key,
    )
    if duration:
        user_session.expiry = func.now() + duration

    session.add(user_session)
    session.commit()

    logger.debug(f"Handing out {token=} to {user=}")

    if set_cookie:
        context.send_initial_metadata(
            [("set-cookie", cookie) for cookie in create_session_cookies(token, user.id, user_session.expiry)]
        )

    logins_counter.labels(user.gender).inc()

    return token, user_session.expiry


def delete_session(session, token):
    """
    Deletes the given session (practically logging the user out)

    Returns True if the session was found, False otherwise.
    """
    user_session = session.execute(
        select(UserSession).where(UserSession.token == token).where(UserSession.is_valid)
    ).scalar_one_or_none()
    if user_session:
        user_session.deleted = func.now()
        session.commit()
        return True
    else:
        return False


def _username_available(session, username):
    """
    Checks if the given username adheres to our rules and isn't taken already.
    """
    logger.debug(f"Checking if {username=} is valid")
    if not is_valid_username(username):
        return False
    # check for existing user with that username
    user_exists = session.execute(select(User).where(User.username == username)).scalar_one_or_none() is not None
    # check for started signup with that username
    signup_exists = (
        session.execute(select(SignupFlow).where(SignupFlow.username == username)).scalar_one_or_none() is not None
    )
    # return False if user exists, True otherwise
    return not user_exists and not signup_exists


class Auth(auth_pb2_grpc.AuthServicer):
    """
    The Auth servicer.

    This class services the Auth service/API.
    """

    def SignupFlow(self, request, context, session):
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
                    send_signup_email(session, existing_flow)
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
                signup_initiations_counter.inc()
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

                if not _username_available(session, request.account.username):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USERNAME_NOT_AVAILABLE)

                abort_on_invalid_password(request.account.password, context)
                hashed_password = hash_password(request.account.password)

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
                flow.opt_out_of_newsletter = request.account.opt_out_of_newsletter
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
            if not flow.email_sent or request.resend_verification_email:
                send_signup_email(session, flow)

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
                opt_out_of_newsletter=flow.opt_out_of_newsletter,
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

            signup_duration_s = (now() - flow.created).total_seconds()

            session.delete(flow)
            session.commit()

            enforce_community_memberships_for_user(session, user)

            if form.is_filled:
                user.filled_contributor_form = True

            maybe_send_contributor_form_email(session, form)

            # sends onboarding email
            notify(
                session,
                user_id=user.id,
                topic_action="onboarding:reminder",
                key="1",
            )

            signup_completions_counter.labels(flow.gender).inc()
            signup_time_histogram.labels(flow.gender).observe(signup_duration_s)

            create_session(context, session, user, False)
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

    def UsernameValid(self, request, context, session):
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=_username_available(session, request.username.lower()))

    def Authenticate(self, request, context, session):
        """
        Authenticates a classic password based login request.

        request.user can be any of id/username/email
        """
        logger.debug(f"Logging in with {request.user=}, password=*******")
        user = session.execute(
            select(User).where_username_or_email(request.user).where(~User.is_deleted)
        ).scalar_one_or_none()
        if user:
            logger.debug("Found user")
            if verify_password(user.hashed_password, request.password):
                logger.debug("Right password")
                # correct password
                create_session(context, session, user, request.remember_device)
                return _auth_res(user)
            else:
                logger.debug("Wrong password")
                # wrong password
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_PASSWORD)
        else:  # user not found
            # check if this is an email and they tried to sign up but didn't complete
            signup_flow = session.execute(
                select(SignupFlow).where_username_or_email(request.user, table=SignupFlow)
            ).scalar_one_or_none()
            if signup_flow:
                send_signup_email(session, signup_flow)
                session.commit()
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP)
            logger.debug("Didn't find user")
            context.abort(grpc.StatusCode.NOT_FOUND, errors.ACCOUNT_NOT_FOUND)

    def GetAuthState(self, request, context, session):
        if not context.user_id:
            return auth_pb2.GetAuthStateRes(logged_in=False)
        else:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return auth_pb2.GetAuthStateRes(logged_in=True, auth_res=_auth_res(user))

    def Deauthenticate(self, request, context, session):
        """
        Removes an active cookie session.
        """
        token = parse_session_cookie(dict(context.invocation_metadata()))
        logger.info(f"Deauthenticate(token={token})")

        # if we had a token, try to remove the session
        if token:
            delete_session(session, token)

        # set the cookie to an empty string and expire immediately, should remove it from the browser
        context.send_initial_metadata([("set-cookie", cookie) for cookie in create_session_cookies("", "", now())])

        return empty_pb2.Empty()

    def ResetPassword(self, request, context, session):
        """
        If the user does not exist, do nothing.

        If the user exists, we send them an email. If they have a password, clicking that email will remove the password.
        If they don't have a password, it sends them an email saying someone tried to reset the password but there was none.

        Note that as long as emails are send synchronously, this is far from constant time regardless of output.
        """
        user = session.execute(
            select(User).where_username_or_email(request.user).where(~User.is_deleted)
        ).scalar_one_or_none()
        if user:
            password_reset_token = PasswordResetToken(
                token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2)
            )
            session.add(password_reset_token)
            session.flush()

            notify(
                session,
                user_id=user.id,
                topic_action="password_reset:start",
                data=notification_data_pb2.PasswordResetStart(
                    password_reset_token=password_reset_token.token,
                ),
            )

            password_reset_initiations_counter.inc()
        else:  # user not found
            logger.debug("Didn't find user")

        return empty_pb2.Empty()

    def CompletePasswordResetV2(self, request, context, session):
        """
        Completes the password reset: just clears the user's password
        """
        res = session.execute(
            select(PasswordResetToken, User)
            .join(User, User.id == PasswordResetToken.user_id)
            .where(PasswordResetToken.token == request.password_reset_token)
            .where(PasswordResetToken.is_valid)
        ).one_or_none()
        if res:
            password_reset_token, user = res
            abort_on_invalid_password(request.new_password, context)
            user.hashed_password = hash_password(request.new_password)
            session.delete(password_reset_token)

            session.flush()

            notify(
                session,
                user_id=user.id,
                topic_action="password_reset:complete",
            )

            create_session(context, session, user, False)
            password_reset_completions_counter.inc()
            return _auth_res(user)
        else:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

    def ConfirmChangeEmailV2(self, request, context, session):
        user = session.execute(
            select(User)
            .where(User.new_email_token == request.change_email_token)
            .where(User.new_email_token_created <= now())
            .where(User.new_email_token_expiry >= now())
        ).scalar_one_or_none()

        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

        user.email = user.new_email
        user.new_email = None
        user.new_email_token = None
        user.new_email_token_created = None
        user.new_email_token_expiry = None

        notify(
            session,
            user_id=user.id,
            topic_action="email_address:verify",
        )

        return empty_pb2.Empty()

    def ConfirmDeleteAccount(self, request, context, session):
        """
        Confirm account deletion using account delete token
        """
        res = session.execute(
            select(User, AccountDeletionToken)
            .join(AccountDeletionToken, AccountDeletionToken.user_id == User.id)
            .where(AccountDeletionToken.token == request.token)
            .where(AccountDeletionToken.is_valid)
        ).one_or_none()

        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

        user, account_deletion_token = res

        session.execute(delete(AccountDeletionToken).where(AccountDeletionToken.user_id == user.id))

        user.is_deleted = True
        user.undelete_until = now() + timedelta(days=UNDELETE_DAYS)
        user.undelete_token = urlsafe_secure_token()

        session.flush()

        notify(
            session,
            user_id=user.id,
            topic_action="account_deletion:complete",
            data=notification_data_pb2.AccountDeletionComplete(
                undelete_token=user.undelete_token,
                undelete_days=UNDELETE_DAYS,
            ),
        )

        account_deletion_completions_counter.labels(user.gender).inc()

        return empty_pb2.Empty()

    def RecoverAccount(self, request, context, session):
        """
        Recovers a recently deleted account
        """
        user = session.execute(
            select(User).where(User.undelete_token == request.token).where(User.undelete_until > now())
        ).scalar_one_or_none()

        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

        user.is_deleted = False
        user.undelete_token = None
        user.undelete_until = None

        notify(
            session,
            user_id=user.id,
            topic_action="account_deletion:recovered",
        )

        account_recoveries_counter.labels(user.gender).inc()

        return empty_pb2.Empty()

    def Unsubscribe(self, request, context, session):
        return auth_pb2.UnsubscribeRes(response=unsubscribe(request, context))
