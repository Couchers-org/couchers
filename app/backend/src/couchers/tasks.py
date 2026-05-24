import logging
from collections.abc import Sequence

from sqlalchemy import RowMapping, insert, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.constants import SIGNUP_EMAIL_TOKEN_VALIDITY
from couchers.context import CouchersContext
from couchers.crypto import urlsafe_secure_token
from couchers.db import session_scope
from couchers.email.queuing import queue_system_email, queue_userless_email
from couchers.models import (
    AccountDeletionReason,
    Cluster,
    ClusterRole,
    ClusterSubscription,
    ContentReport,
    ContributorForm,
    EventCommunityInviteRequest,
    Node,
    RateLimitAction,
    RateLimitViolation,
    Reference,
    SignupFlow,
    StrongVerificationAttempt,
    User,
)
from couchers.rate_limits.definitions import RATE_LIMIT_HOURS
from couchers.utils import now

logger = logging.getLogger(__name__)


def send_signup_email(context: CouchersContext, session: Session, flow: SignupFlow) -> None:
    logger.info(f"Sending signup email to {flow.email=}:")

    # whether we've sent an email at all yet
    email_sent_before = flow.email_sent
    if flow.email_verified:
        # we just send a link to continue, not a verification link
        signup_link = urls.signup_link(context, token=flow.flow_token)
    elif flow.email_token and flow.token_is_valid:
        # if the verification email was sent and still is not expired, just resend the verification email
        signup_link = urls.signup_link(context, token=flow.email_token)
    else:
        # otherwise send a fresh email with a new token
        token = urlsafe_secure_token()
        flow.email_verified = False
        flow.email_token = token
        flow.email_token_expiry = now() + SIGNUP_EMAIL_TOKEN_VALIDITY
        signup_link = urls.signup_link(context, token=flow.email_token)

    flow.email_sent = True

    queue_userless_email(
        session,
        flow.email,
        "Finish signing up for Couchers.org",
        "signup_verify" if not email_sent_before else "signup_continue",
        template_args={"flow": flow, "signup_link": signup_link},
    )


def send_email_changed_confirmation_to_new_email(context: CouchersContext, session: Session, user: User) -> None:
    """
    Send an email to the user's new email address requesting confirmation of email change
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=}'s new email address, "
        f"(old email: {user.email}, new email: {user.new_email=})"
    )

    if not user.new_email_token:
        raise ValueError(f"No new email token for {user.id}")
    elif not user.new_email:
        raise ValueError(f"No new email for {user.id}")

    confirmation_link = urls.change_email_link(context, confirmation_token=user.new_email_token)
    queue_userless_email(
        session,
        user.new_email,
        "Confirm your new email for Couchers.org",
        "email_changed_confirmation_new_email",
        template_args={"user": user, "confirmation_link": confirmation_link},
    )


def send_content_report_email(session: Session, content_report: ContentReport) -> None:
    logger.info("Sending content report email")
    queue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "content_report",
        template_args={"report": content_report},
    )


def maybe_send_reference_report_email(session: Session, reference: Reference) -> None:
    if reference.should_report:
        logger.info("Sending reference report email")
        queue_system_email(
            session,
            config["REPORTS_EMAIL_RECIPIENT"],
            "reference_report",
            template_args={"reference": reference},
        )


def send_rate_limit_violation_report_email(
    session: Session,
    rate_limit_violation: RateLimitViolation,
    events: dict[RateLimitAction, Sequence[RowMapping]],
    threshold: int,
) -> None:
    """Send a report email to the moderation team if a user exceeds a rate limit within a given time frame."""
    logger.info(
        f"Sending rate limit moderation email for user '{rate_limit_violation.user_id}' ({rate_limit_violation.action})"
    )
    user = session.get_one(User, rate_limit_violation.user_id)
    queue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "rate_limit_violation_report",
        template_args={
            "user": user,
            "action": rate_limit_violation.action,
            "threshold": threshold,
            "hours": RATE_LIMIT_HOURS,
            "is_hard_limit": rate_limit_violation.is_hard_limit,
            "events": events,
        },
    )


def send_duplicate_strong_verification_email(
    session: Session, old_attempt: StrongVerificationAttempt, new_attempt: StrongVerificationAttempt
) -> None:
    logger.info("Sending duplicate SV email")
    queue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "duplicate_strong_verification_report",
        template_args={
            "new_user": new_attempt.user,
            "new_attempt_id": new_attempt.id,
            "old_user": old_attempt.user,
            "old_attempt_id": old_attempt.id,
        },
    )


def maybe_send_contributor_form_email(session: Session, form: ContributorForm) -> None:
    if form.should_notify:
        queue_system_email(
            session,
            config["CONTRIBUTOR_FORM_EMAIL_RECIPIENT"],
            "contributor_form",
            template_args={"form": form},
        )


def send_event_community_invite_request_email(
    context: CouchersContext, session: Session, request: EventCommunityInviteRequest
) -> None:
    queue_system_email(
        session,
        config["MODS_EMAIL_RECIPIENT"],
        "event_community_invite_request",
        template_args={
            "event_link": urls.event_link(
                context, occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug
            ),
            "user_link": urls.user_link(context, username=request.user.username),
            "view_link": urls.console_link(page="tools/community-invites"),
        },
    )


def send_account_deletion_report_email(session: Session, reason: AccountDeletionReason) -> None:
    logger.info("Sending account deletion report email")
    queue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "account_deletion_report",
        template_args={
            "reason": reason,
        },
    )


def enforce_community_memberships() -> None:
    """
    Go through all communities and make sure every user in the polygon is also a member
    """
    with session_scope() as session:
        for node in session.execute(select(Node)).scalars().all():
            existing_users = select(ClusterSubscription.user_id).where(
                ClusterSubscription.cluster == node.official_cluster
            )
            node_geom = select(Node.geom).where(Node.id == node.id)
            user_ids_needing_adding = (
                session.execute(
                    select(User.id)
                    .where(User.is_visible)
                    .where(func.ST_Contains(node_geom, User.geom))
                    .where(~User.id.in_(existing_users))
                )
                .scalars()
                .all()
            )
            if user_ids_needing_adding:
                session.execute(
                    insert(ClusterSubscription),
                    [
                        {"user_id": user_id, "cluster_id": node.official_cluster.id, "role": ClusterRole.member}
                        for user_id in user_ids_needing_adding
                    ],
                )
                session.commit()


def enforce_community_memberships_for_user(session: Session, user: User) -> None:
    """
    Adds a given user to all the communities they belong in based on their location.
    """
    cluster_ids = (
        session.execute(
            select(Cluster.id)
            .join(Node, Node.id == Cluster.parent_node_id)
            .where(Cluster.is_official_cluster)
            .where(func.ST_Contains(Node.geom, user.geom))
        )
        .scalars()
        .all()
    )

    for cluster_id in cluster_ids:
        session.add(
            ClusterSubscription(
                user_id=user.id,
                cluster_id=cluster_id,
                role=ClusterRole.member,
            )
        )
    session.commit()
