import logging
from datetime import datetime, timedelta
from typing import cast

import grpc
import requests
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import delete, func, or_

from couchers import urls
from couchers.config import config
from couchers.constants import ANTIBOT_FREQ, BANNED_USERNAME_PHRASES, GUIDELINES_VERSION, TOS_VERSION, UNDELETE_DAYS
from couchers.context import CouchersContext
from couchers.crypto import cookiesafe_secure_token, hash_password, urlsafe_secure_token, verify_password
from couchers.event_log import log_event
from couchers.metrics import (
    account_deletion_completions_counter,
    account_recoveries_counter,
    logins_counter,
    password_reset_completions_counter,
    password_reset_initiations_counter,
    recaptcha_score_histogram,
    recaptchas_assessed_counter,
    signup_completions_counter,
    signup_initiations_counter,
    signup_time_histogram,
)
from couchers.models import (
    AccountDeletionToken,
    AntiBotLog,
    ContributorForm,
    InviteCode,
    PasswordResetToken,
    PhotoGallery,
    SignupFlow,
    User,
    UserSession,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.models.uploads import get_avatar_upload
from couchers.notifications.notify import notify
from couchers.notifications.quick_links import respond_quick_link
from couchers.proto import auth_pb2, auth_pb2_grpc, notification_data_pb2
from couchers.servicers.account import abort_on_invalid_password, contributeoption2sql
from couchers.servicers.api import hostingstatus2sql
from couchers.sql import username_or_email
from couchers.tasks import (
    enforce_community_memberships_for_user,
    maybe_send_contributor_form_email,
    send_signup_email,
)
from couchers.utils import (
    create_coordinate,
    create_session_cookies,
    is_geom,
    is_valid_email,
    is_valid_name,
    is_valid_username,
    minimum_allowed_birthdate,
    not_none,
    now,
    parse_date,
    parse_session_cookie,
)

logger = logging.getLogger(__name__)


def _auth_res(user: User) -> auth_pb2.AuthRes:
    return auth_pb2.AuthRes(jailed=user.is_jailed, user_id=user.id)


def create_session(
    context: CouchersContext,
    session: Session,
    user: User,
    long_lived: bool,
    is_api_key: bool = False,
    duration: timedelta | None = None,
    set_cookie: bool = True,
) -> tuple[str, datetime]:
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
    if user.banned_at is not None:
        context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "account_suspended")

    # just double-check
    assert user.deleted_at is None

    token = cookiesafe_secure_token()

    user_session = UserSession(
        token=token,
        user_id=user.id,
        long_lived=long_lived,
        ip_address=cast(str | None, context.headers.get("x-couchers-real-ip")),
        user_agent=cast(str | None, context.headers.get("user-agent")),
        is_api_key=is_api_key,
    )
    if duration:
        user_session.expiry = func.now() + duration

    session.add(user_session)
    session.commit()

    logger.debug(f"Handing out {token=} to {user=}")

    if set_cookie:
        context.set_cookies(create_session_cookies(token, user.id, user_session.expiry))

    logins_counter.labels(user.gender).inc()

    return token, user_session.expiry


def delete_session(session: Session, token: str) -> bool:
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


def _username_available(session: Session, username: str) -> bool:
    """
    Checks if the given username adheres to our rules and isn't taken already.
    """
    logger.debug(f"Checking if {username=} is valid")
    if not is_valid_username(username):
        return False
    for phrase in BANNED_USERNAME_PHRASES:
        if phrase.lower() in username.lower():
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

    def SignupFlow(
        self, request: auth_pb2.SignupFlowReq, context: CouchersContext, session: Session
    ) -> auth_pb2.SignupFlowRes:
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
                    context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")
        else:
            if not request.flow_token:
                # fresh signup
                if not request.HasField("basic"):
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "signup_flow_basic_needed")
                # TODO: unique across both tables
                existing_user = session.execute(
                    select(User).where(User.email == request.basic.email)
                ).scalar_one_or_none()
                if existing_user:
                    if not existing_user.is_visible:
                        context.abort_with_error_code(
                            grpc.StatusCode.FAILED_PRECONDITION, "signup_email_cannot_be_used"
                        )
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_email_taken")
                existing_flow = session.execute(
                    select(SignupFlow).where(SignupFlow.email == request.basic.email)
                ).scalar_one_or_none()
                if existing_flow:
                    send_signup_email(context, session, existing_flow)
                    session.commit()
                    context.abort_with_error_code(
                        grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_email_started_signup"
                    )

                if not is_valid_email(request.basic.email):
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_email")
                if not is_valid_name(request.basic.name):
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_name")

                flow_token = cookiesafe_secure_token()

                invite_id = None
                if request.basic.invite_code:
                    invite_id = session.execute(
                        select(InviteCode.id).where(
                            InviteCode.id == request.basic.invite_code,
                            or_(InviteCode.disabled == None, InviteCode.disabled > func.now()),
                        )
                    ).scalar_one_or_none()
                    if not invite_id:
                        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_invite_code")

                flow = SignupFlow(
                    flow_token=flow_token,
                    name=request.basic.name,
                    email=request.basic.email,
                    invite_code_id=invite_id,
                )
                session.add(flow)
                session.flush()
                signup_initiations_counter.inc()
                log_event(context, session, "account.signup_initiated", {"has_invite_code": invite_id is not None})
            else:
                # not fresh signup
                flow = session.execute(
                    select(SignupFlow).where(SignupFlow.flow_token == request.flow_token)
                ).scalar_one_or_none()
                if not flow:
                    context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")
                if request.HasField("basic"):
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_basic_filled")

            # we've found and/or created a new flow, now sort out other parts
            if request.HasField("account"):
                if flow.account_is_filled:
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_account_filled")

                # check username validity
                if not is_valid_username(request.account.username):
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_username")

                if not _username_available(session, request.account.username):
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "username_not_available")

                abort_on_invalid_password(request.account.password, context)
                hashed_password = hash_password(request.account.password)

                birthdate = parse_date(request.account.birthdate)
                if not birthdate or birthdate >= minimum_allowed_birthdate():
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "invalid_birthdate")

                if not request.account.hosting_status:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "hosting_status_required")

                if request.account.lat == 0 and request.account.lng == 0:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")

                if not request.account.accept_tos:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "must_accept_tos")

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
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_feedback_filled")
                form = request.feedback

                flow.filled_feedback = True
                flow.ideas = form.ideas
                flow.features = form.features
                flow.experience = form.experience
                flow.contribute = contributeoption2sql[form.contribute]
                flow.contribute_ways = form.contribute_ways  # type: ignore[assignment]
                flow.expertise = form.expertise
                session.flush()

            if request.HasField("motivations"):
                if flow.filled_motivations:
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_motivations_filled")

                flow.filled_motivations = True
                flow.heard_about_couchers = request.motivations.heard_about_couchers or None
                flow.signup_motivations = list(request.motivations.motivations)
                session.flush()

            if request.HasField("accept_community_guidelines"):
                if not request.accept_community_guidelines.value:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "must_accept_community_guidelines")
                flow.accepted_community_guidelines = GUIDELINES_VERSION
                session.flush()

            # send verification email if needed
            if not flow.email_sent or request.resend_verification_email:
                send_signup_email(context, session, flow)

            session.flush()

        # finish the signup if done
        if flow.is_completed:
            user = User(
                name=flow.name,
                email=flow.email,
                username=not_none(flow.username),
                hashed_password=not_none(flow.hashed_password),
                birthdate=not_none(flow.birthdate),
                gender=not_none(flow.gender),
                hosting_status=not_none(flow.hosting_status),
                city=not_none(flow.city),
                geom=is_geom(flow.geom),
                geom_radius=not_none(flow.geom_radius),
                accepted_tos=not_none(flow.accepted_tos),
                last_onboarding_email_sent=func.now(),
                invite_code_id=flow.invite_code_id,
                heard_about_couchers=flow.heard_about_couchers,
                signup_motivations=flow.signup_motivations if flow.filled_motivations else None,
            )

            user.accepted_community_guidelines = flow.accepted_community_guidelines
            user.onboarding_emails_sent = 1
            user.opt_out_of_newsletter = not_none(flow.opt_out_of_newsletter)

            session.add(user)
            session.flush()

            # Create a profile gallery for the user
            profile_gallery = PhotoGallery(owner_user_id=user.id)
            session.add(profile_gallery)
            session.flush()
            user.profile_gallery_id = profile_gallery.id

            if flow.filled_feedback:
                form_ = ContributorForm(
                    user_id=user.id,
                    ideas=flow.ideas or None,
                    features=flow.features or None,
                    experience=flow.experience or None,
                    contribute=flow.contribute or None,
                    contribute_ways=not_none(flow.contribute_ways),
                    expertise=flow.expertise or None,
                )

                session.add(form_)

                user.filled_contributor_form = form_.is_filled

                maybe_send_contributor_form_email(session, form_)

            signup_duration_s = (now() - flow.created).total_seconds()

            session.delete(flow)
            session.commit()

            enforce_community_memberships_for_user(session, user)

            # sends onboarding email
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.onboarding__reminder,
                key="1",
            )

            signup_completions_counter.labels(flow.gender).inc()
            signup_time_histogram.labels(flow.gender).observe(signup_duration_s)
            log_event(
                context,
                session,
                "account.signup_completed",
                {
                    "gender": flow.gender,
                    "signup_duration_s": signup_duration_s,
                    "hosting_status": str(flow.hosting_status),
                    "city": flow.city,
                    "has_invite_code": flow.invite_code_id is not None,
                    "filled_contributor_form": user.filled_contributor_form,
                },
                _override_user_id=user.id,
            )

            create_session(context, session, user, False)
            return auth_pb2.SignupFlowRes(
                auth_res=_auth_res(user),
            )
        else:
            return auth_pb2.SignupFlowRes(
                flow_token=flow.flow_token,
                need_account=not flow.account_is_filled,
                need_feedback=False,
                need_verify_email=not flow.email_verified,
                need_accept_community_guidelines=flow.accepted_community_guidelines < GUIDELINES_VERSION,
                need_motivations=not flow.filled_motivations,
            )

    def UsernameValid(
        self, request: auth_pb2.UsernameValidReq, context: CouchersContext, session: Session
    ) -> auth_pb2.UsernameValidRes:
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=_username_available(session, request.username.lower()))

    def Authenticate(self, request: auth_pb2.AuthReq, context: CouchersContext, session: Session) -> auth_pb2.AuthRes:
        """
        Authenticates a classic password-based login request.

        request.user can be any of id/username/email
        """
        logger.debug(f"Logging in with {request.user=}, password=*******")
        user = session.execute(
            select(User).where(username_or_email(request.user)).where(User.deleted_at.is_(None))
        ).scalar_one_or_none()
        if user:
            logger.debug("Found user")
            if verify_password(user.hashed_password, request.password):
                logger.debug("Right password")
                # correct password
                create_session(context, session, user, request.remember_device)
                log_event(
                    context,
                    session,
                    "account.login",
                    {"gender": user.gender, "remember_device": request.remember_device},
                    _override_user_id=user.id,
                )
                return _auth_res(user)
            else:
                logger.debug("Wrong password")
                # wrong password
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_password_login")
        else:  # user not found
            # check if this is an email and they tried to sign up but didn't complete
            signup_flow = session.execute(
                select(SignupFlow).where(username_or_email(request.user, table=SignupFlow))
            ).scalar_one_or_none()
            if signup_flow:
                send_signup_email(context, session, signup_flow)
                session.commit()
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "signup_flow_email_started_signup")
            logger.debug("Didn't find user")
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "account_not_found")

    def GetAuthState(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> auth_pb2.GetAuthStateRes:
        if not context.is_logged_in():
            return auth_pb2.GetAuthStateRes(logged_in=False)
        else:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return auth_pb2.GetAuthStateRes(logged_in=True, auth_res=_auth_res(user))

    def Deauthenticate(self, request: empty_pb2.Empty, context: CouchersContext, session: Session) -> empty_pb2.Empty:
        """
        Removes an active cookie session.
        """
        token = parse_session_cookie(context.headers)
        logger.info(f"Deauthenticate(token={token})")

        # if we had a token, try to remove the session
        if token:
            delete_session(session, token)

        log_event(context, session, "account.logout", {})

        # set the cookie to an empty string and expire immediately, should remove it from the browser
        context.set_cookies(create_session_cookies("", "", now()))

        return empty_pb2.Empty()

    def ResetPassword(
        self, request: auth_pb2.ResetPasswordReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """
        If the user does not exist, do nothing.

        If the user exists, we send them an email. If they have a password, clicking that email will remove the password.
        If they don't have a password, it sends them an email saying someone tried to reset the password but there was none.

        Note that as long as emails are send synchronously, this is far from constant time regardless of output.
        """
        user = session.execute(
            select(User).where(username_or_email(request.user)).where(User.deleted_at.is_(None))
        ).scalar_one_or_none()
        if user:
            password_reset_token = PasswordResetToken(
                token=urlsafe_secure_token(), user_id=user.id, expiry=now() + timedelta(hours=2)
            )
            session.add(password_reset_token)
            session.flush()

            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.password_reset__start,
                key="",
                data=notification_data_pb2.PasswordResetStart(
                    password_reset_token=password_reset_token.token,
                ),
            )

            password_reset_initiations_counter.inc()
            log_event(
                context,
                session,
                "account.password_reset_initiated",
                {},
                _override_user_id=user.id,
            )
        else:  # user not found
            logger.debug("Didn't find user")

        return empty_pb2.Empty()

    def CompletePasswordResetV2(
        self, request: auth_pb2.CompletePasswordResetV2Req, context: CouchersContext, session: Session
    ) -> auth_pb2.AuthRes:
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
                topic_action=NotificationTopicAction.password_reset__complete,
                key="",
            )

            create_session(context, session, user, False)
            password_reset_completions_counter.inc()
            log_event(
                context,
                session,
                "account.password_reset_completed",
                {},
                _override_user_id=user.id,
            )
            return _auth_res(user)
        else:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")

    def ConfirmChangeEmailV2(
        self, request: auth_pb2.ConfirmChangeEmailV2Req, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        user = session.execute(
            select(User)
            .where(User.new_email_token == request.change_email_token)
            .where(User.new_email_token_created <= now())
            .where(User.new_email_token_expiry >= now())
        ).scalar_one_or_none()

        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")

        user.email = not_none(user.new_email)
        user.new_email = None
        user.new_email_token = None
        user.new_email_token_created = None
        user.new_email_token_expiry = None

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.email_address__verify,
            key="",
        )

        log_event(context, session, "account.email_confirmed", {}, _override_user_id=user.id)

        return empty_pb2.Empty()

    def ConfirmDeleteAccount(
        self, request: auth_pb2.ConfirmDeleteAccountReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
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
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")

        user, account_deletion_token = res

        session.execute(delete(AccountDeletionToken).where(AccountDeletionToken.user_id == user.id))

        user.deleted_at = now()
        user.undelete_until = now() + timedelta(days=UNDELETE_DAYS)
        user.undelete_token = urlsafe_secure_token()

        session.flush()

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.account_deletion__complete,
            key="",
            data=notification_data_pb2.AccountDeletionComplete(
                undelete_token=user.undelete_token,
                undelete_days=UNDELETE_DAYS,
            ),
        )

        account_deletion_completions_counter.labels(user.gender).inc()
        log_event(
            context,
            session,
            "account.deletion_completed",
            {"gender": user.gender},
            _override_user_id=user.id,
        )

        return empty_pb2.Empty()

    def RecoverAccount(
        self, request: auth_pb2.RecoverAccountReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """
        Recovers a recently deleted account
        """
        user = session.execute(
            select(User).where(User.undelete_token == request.token).where(User.undelete_until > now())
        ).scalar_one_or_none()

        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_token")

        user.deleted_at = None
        user.undelete_token = None
        user.undelete_until = None

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.account_deletion__recovered,
            key="",
        )

        account_recoveries_counter.labels(user.gender).inc()
        log_event(
            context,
            session,
            "account.recovered",
            {"gender": user.gender},
            _override_user_id=user.id,
        )

        return empty_pb2.Empty()

    def Unsubscribe(
        self, request: auth_pb2.UnsubscribeReq, context: CouchersContext, session: Session
    ) -> auth_pb2.UnsubscribeRes:
        return auth_pb2.UnsubscribeRes(response=respond_quick_link(request, context, session))

    def AntiBot(self, request: auth_pb2.AntiBotReq, context: CouchersContext, session: Session) -> auth_pb2.AntiBotRes:
        if not context.get_boolean_value("recaptcha_enabled", default=False):
            return auth_pb2.AntiBotRes()

        ip_address = cast(str | None, context.headers.get("x-couchers-real-ip"))
        user_agent = cast(str | None, context.headers.get("user-agent"))
        user_id = context.user_id if context.is_logged_in() else None

        resp = requests.post(
            f"https://recaptchaenterprise.googleapis.com/v1/projects/{config['RECAPTHCA_PROJECT_ID']}/assessments?key={config['RECAPTHCA_API_KEY']}",
            json={
                "event": {
                    "token": request.token,
                    "siteKey": config["RECAPTHCA_SITE_KEY"],
                    "userAgent": user_agent,
                    "userIpAddress": ip_address,
                    "expectedAction": request.action,
                    "userInfo": {"accountId": str(user_id) if user_id else None},
                }
            },
        )

        resp.raise_for_status()

        log = AntiBotLog(
            token=request.token,
            user_agent=user_agent,
            ip_address=ip_address,
            action=request.action,
            user_id=user_id,
            score=resp.json()["riskAnalysis"]["score"],
            provider_data=resp.json(),
        )

        session.add(log)
        session.flush()

        recaptchas_assessed_counter.labels(log.action).inc()
        recaptcha_score_histogram.labels(log.action).observe(log.score)

        if context.is_logged_in():
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            user.last_antibot = now()

        return auth_pb2.AntiBotRes()

    def AntiBotPolicy(
        self, request: auth_pb2.AntiBotPolicyReq, context: CouchersContext, session: Session
    ) -> auth_pb2.AntiBotPolicyRes:
        if context.get_boolean_value("recaptcha_enabled", default=False):
            if context.is_logged_in():
                user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
                if now() - user.last_antibot > ANTIBOT_FREQ:
                    return auth_pb2.AntiBotPolicyRes(should_antibot=True)

        return auth_pb2.AntiBotPolicyRes(should_antibot=False)

    def GetInviteCodeInfo(
        self, request: auth_pb2.GetInviteCodeInfoReq, context: CouchersContext, session: Session
    ) -> auth_pb2.GetInviteCodeInfoRes:
        invite = session.execute(
            select(InviteCode).where(
                InviteCode.id == request.code, or_(InviteCode.disabled == None, InviteCode.disabled > func.now())
            )
        ).scalar_one_or_none()

        if not invite:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invite_code_not_found")

        user = session.execute(select(User).where(User.id == invite.creator_user_id)).scalar_one()

        avatar_upload = get_avatar_upload(session, user)

        return auth_pb2.GetInviteCodeInfoRes(
            name=user.name,
            username=user.username,
            avatar_url=avatar_upload.thumbnail_url if avatar_upload else None,
            url=urls.invite_code_link(context, code=request.code),
        )
