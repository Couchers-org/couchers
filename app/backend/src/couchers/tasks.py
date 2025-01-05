import logging

from sqlalchemy.sql import func

from couchers import email, urls
from couchers.config import config
from couchers.constants import SIGNUP_EMAIL_TOKEN_VALIDITY
from couchers.crypto import urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    EventCommunityInviteRequest,
    Node,
    User,
)
from couchers.sql import couchers_select as select
from couchers.templates.v2 import send_simple_pretty_email
from couchers.utils import now

logger = logging.getLogger(__name__)


def send_signup_email(session, flow):
    logger.info(f"Sending signup email to {flow.email=}:")

    # whether we've sent an email at all yet
    email_sent_before = flow.email_sent
    if flow.email_verified:
        # we just send a link to continue, not a verification link
        signup_link = urls.signup_link(token=flow.flow_token)
    elif flow.email_token and flow.token_is_valid:
        # if the verification email was sent and still is not expired, just resend the verification email
        signup_link = urls.signup_link(token=flow.email_token)
    else:
        # otherwise send a fresh email with new token
        token = urlsafe_secure_token()
        flow.email_verified = False
        flow.email_token = token
        flow.email_token_expiry = now() + SIGNUP_EMAIL_TOKEN_VALIDITY
        signup_link = urls.signup_link(token=flow.email_token)

    flow.email_sent = True

    send_simple_pretty_email(
        session,
        flow.email,
        "Finish signing up for Couchers.org",
        "signup_verify" if not email_sent_before else "signup_continue",
        template_args={"flow": flow, "signup_link": signup_link},
    )


def send_email_changed_confirmation_to_new_email(session, user):
    """
    Send an email to user's new email address requesting confirmation of email change
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=}'s new email address, (old email: {user.email}, new email: {user.new_email=})"
    )

    confirmation_link = urls.change_email_link(confirmation_token=user.new_email_token)
    send_simple_pretty_email(
        session,
        user.new_email,
        "Confirm your new email for Couchers.org",
        "email_changed_confirmation_new_email",
        template_args={"user": user, "confirmation_link": confirmation_link},
    )


def send_content_report_email(session, content_report):
    logger.info("Sending content report email")
    email.enqueue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "content_report",
        template_args={"report": content_report},
    )


def maybe_send_reference_report_email(session, reference):
    if reference.should_report:
        logger.info("Sending reference report email")
        email.enqueue_system_email(
            session,
            config["REPORTS_EMAIL_RECIPIENT"],
            "reference_report",
            template_args={"reference": reference},
        )


def send_duplicate_strong_verification_email(session, old_attempt, new_attempt):
    logger.info("Sending duplicate SV email")
    email.enqueue_system_email(
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


def maybe_send_contributor_form_email(session, form):
    if form.should_notify:
        email.enqueue_system_email(
            session,
            config["CONTRIBUTOR_FORM_EMAIL_RECIPIENT"],
            "contributor_form",
            template_args={"form": form},
        )


def send_event_community_invite_request_email(session, request: EventCommunityInviteRequest):
    email.enqueue_system_email(
        session,
        config["MODS_EMAIL_RECIPIENT"],
        "event_community_invite_request",
        template_args={
            "event_link": urls.event_link(occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug),
            "user_link": urls.user_link(username=request.user.username),
            "view_link": urls.console_link(page="api/org.couchers.admin.Admin"),
        },
    )


def send_account_deletion_report_email(session, reason):
    logger.info("Sending account deletion report email")
    email.enqueue_system_email(
        session,
        config["REPORTS_EMAIL_RECIPIENT"],
        "account_deletion_report",
        template_args={
            "reason": reason,
        },
    )


def enforce_community_memberships():
    """
    Go through all communities and make sure every user in the polygon is also a member
    """
    with session_scope() as session:
        for node in session.execute(select(Node)).scalars().all():
            existing_users = select(ClusterSubscription.user_id).where(
                ClusterSubscription.cluster == node.official_cluster
            )
            users_needing_adding = (
                session.execute(
                    select(User)
                    .where(User.is_visible)
                    .where(func.ST_Contains(node.geom, User.geom))
                    .where(~User.id.in_(existing_users))
                )
                .scalars()
                .all()
            )
            for user in users_needing_adding:
                node.official_cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user=user,
                        role=ClusterRole.member,
                    )
                )
            session.commit()


def enforce_community_memberships_for_user(session, user):
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
                user=user,
                cluster_id=cluster_id,
                role=ClusterRole.member,
            )
        )
    session.commit()
