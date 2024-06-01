import logging
from datetime import timedelta
from typing import List

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
    LoginToken,
    Node,
    Notification,
    PasswordResetToken,
    User,
)
from couchers.notifications.unsubscribe import generate_mute_all, generate_unsub_topic_action, generate_unsub_topic_key
from couchers.sql import couchers_select as select
from couchers.templates.v2 import email_user
from couchers.utils import now

logger = logging.getLogger(__name__)


def send_signup_email(flow):
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

    logger.info(f"Link is: {signup_link}")
    template = "signup_verify" if not email_sent_before else "signup_continue"
    email.enqueue_email_from_template(flow.email, template, template_args={"flow": flow, "signup_link": signup_link})


def send_login_email(session, user):
    login_token = LoginToken(token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2))
    session.add(login_token)

    logger.info(f"Sending login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {login_token=} ({login_token.created=}")
    login_link = urls.login_link(login_token=login_token.token)
    logger.info(f"Link is: {login_link}")
    email.enqueue_email_from_template_to_user(
        user, "login", template_args={"user": user, "login_link": login_link}, is_critical_email=True
    )

    return login_token


def send_api_key_email(session, user, token, expiry):
    logger.info(f"Sending API key email to {user=}:")
    email.enqueue_email_from_template_to_user(
        user, "api_key", template_args={"user": user, "token": token, "expiry": expiry}, is_critical_email=True
    )


def send_password_reset_email(session, user):
    password_reset_token = PasswordResetToken(
        token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2)
    )
    session.add(password_reset_token)

    logger.info(f"Sending password reset email to {user=}:")
    password_reset_link = urls.password_reset_link(password_reset_token=password_reset_token.token)
    logger.info(f"Link is: {password_reset_link}")
    email.enqueue_email_from_template_to_user(
        user,
        "password_reset",
        template_args={"user": user, "password_reset_link": password_reset_link},
        is_critical_email=True,
    )

    return password_reset_token


def send_new_host_request_email(host_request):
    # todo(notify2): replace with notification
    logger.info(f"Sending host request email to {host_request.host=}:")
    logger.info(f"Host request sent by {host_request.surfer}")
    logger.info(f"Email for {host_request.host.username=} sent to {host_request.host.email=}")

    email.enqueue_email_from_template_to_user(
        host_request.host,
        "host_request",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_host_reference_email(reference, both_written):
    """
    both_written == true if both the surfer and hoster wrote a reference
    """
    # todo(notify2): replace with notification
    assert reference.host_request_id

    logger.info(f"Sending host reference email to {reference.to_user=} for {reference.id=}")

    surfed = reference.host_request.surfer_user_id != reference.from_user_id

    email.enqueue_email_from_template_to_user(
        reference.to_user,
        "host_reference",
        template_args={
            "reference": reference,
            "leave_reference_link": urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=reference.from_user_id,
                host_request_id=reference.host_request.conversation_id,
            ),
            # if this reference was written by the surfer, then the recipient hosted
            "surfed": surfed,
            "both_written": both_written,
        },
    )


def send_friend_reference_email(reference):
    # todo(notify2): replace with notification
    assert not reference.host_request_id

    logger.info(f"Sending friend reference email to {reference.to_user=} for {reference.id=}")

    email.enqueue_email_from_template_to_user(
        reference.to_user,
        "friend_reference",
        template_args={
            "reference": reference,
        },
    )


def send_reference_reminder_email(user, other_user, host_request, surfed, time_left_text):
    # todo(notify2): replace with notification
    logger.info(f"Sending host reference email to {user=}, they have {time_left_text} left to write a ref")

    email.enqueue_email_from_template_to_user(
        user,
        "reference_reminder",
        template_args={
            "user": user,
            "other_user": other_user,
            "host_request": host_request,
            "leave_reference_link": urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=other_user.id,
                host_request_id=host_request.conversation_id,
            ),
            "surfed": surfed,
            "time_left_text": time_left_text,
        },
    )


def send_password_changed_email(user):
    """
    Send the user an email saying their password has been changed.
    """
    # todo(notify2): replace with notification
    logger.info(f"Sending password changed (notification) email to {user=}")
    email.enqueue_email_from_template_to_user(
        user, "password_changed", template_args={"user": user}, is_critical_email=True
    )


def send_email_changed_notification_email(user):
    """
    Send an email to user's original address notifying that it has been changed
    """
    # todo(notify2): replace with notification
    logger.info(
        f"Sending email changed (notification) email to {user=} (old email: {user.email=}, new email: {user.new_email=})"
    )
    email_user(user, "email_changed_notification", template_args={"user": user})


def send_email_changed_confirmation_to_old_email(user):
    """
    Send an email to user's original email address requesting confirmation of email change
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=}'s old email address, (old email: {user.email}, new email: {user.new_email=})"
    )

    confirmation_link = urls.change_email_link(confirmation_token=user.old_email_token)
    email_user(
        user,
        "email_changed_confirmation_old_email",
        template_args={"user": user, "confirmation_link": confirmation_link},
    )


def send_email_changed_confirmation_to_new_email(user):
    """
    Send an email to user's new email address requesting confirmation of email change
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=}'s new email address, (old email: {user.email}, new email: {user.new_email=})"
    )

    confirmation_link = urls.change_email_link(confirmation_token=user.new_email_token)
    email_user(
        user,
        "email_changed_confirmation_new_email",
        template_args={"user": user, "confirmation_link": confirmation_link},
        override_recipient=user.new_email,
    )


def send_onboarding_email(user, email_number):
    # todo(notify2): replace with notification
    email.enqueue_email_from_template_to_user(
        user,
        f"onboarding{email_number}",
        template_args={
            "user": user,
            "app_link": urls.app_link(),
            "profile_link": urls.profile_link(),
            "edit_profile_link": urls.edit_profile_link(),
        },
    )


def send_content_report_email(content_report):
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    logger.info(f"Sending content report email to {target_email=}")
    email.enqueue_email_from_template(
        target_email,
        "content_report",
        template_args={
            "report": content_report,
            "author_user_user_link": urls.user_link(username=content_report.author_user.username),
            "reporting_user_user_link": urls.user_link(username=content_report.reporting_user.username),
        },
    )


def maybe_send_reference_report_email(reference):
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    if reference.should_report:
        logger.info(f"Sending reference report email to {target_email=}")
        email.enqueue_email_from_template(
            target_email,
            "reference_report",
            template_args={
                "reference": reference,
                "from_user_user_link": urls.user_link(username=reference.from_user.username),
                "to_user_user_link": urls.user_link(username=reference.to_user.username),
            },
        )


def maybe_send_contributor_form_email(form):
    target_email = config["CONTRIBUTOR_FORM_EMAIL_RECIPIENT"]

    if form.should_notify:
        email.enqueue_email_from_template(
            target_email,
            "contributor_form",
            template_args={"form": form, "user_link": urls.user_link(username=form.user.username)},
        )


def send_event_community_invite_request_email(request: EventCommunityInviteRequest):
    email.enqueue_email_from_template(
        config["MODS_EMAIL_RECIPIENT"],
        "event_community_invite_request",
        template_args={
            "event_link": urls.event_link(occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug),
            "user_link": urls.user_link(username=request.user.username),
        },
    )


def send_digest_email(user, notifications: List[Notification]):
    logger.info(f"Sending digest email to {user=}:")
    email.enqueue_email_from_template_to_user(
        user,
        "digest",
        template_args={"user": user, "notifications": notifications},
    )


def send_notification_email(notification: Notification):
    logger.info(f"Sending notification email to {notification.user=}:")

    email.enqueue_email_from_template_to_user(
        notification.user,
        "notification",
        template_args={
            "notification": notification,
            "unsub_all": generate_mute_all(notification.user_id),
            "unsub_topic_key": generate_unsub_topic_key(notification),
            "unsub_topic_action": generate_unsub_topic_action(notification),
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


def send_account_deletion_report_email(reason):
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    logger.info(f"Sending account deletion report email to {target_email=}")
    email.enqueue_email_from_template(
        target_email,
        "account_deletion_report",
        template_args={
            "reason": reason,
        },
    )


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
