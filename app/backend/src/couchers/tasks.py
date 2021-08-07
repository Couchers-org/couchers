import logging
from datetime import timedelta

from sqlalchemy.sql import func, select

from couchers import email, urls
from couchers.config import config
from couchers.constants import EMAIL_TOKEN_VALIDITY
from couchers.crypto import urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import ClusterRole, ClusterSubscription, LoginToken, Node, PasswordResetToken, User
from couchers.sql import couchers_select as select
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
        flow.email_token_expiry = now() + EMAIL_TOKEN_VALIDITY
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
    email.enqueue_email_from_template(user.email, "login", template_args={"user": user, "login_link": login_link})

    return login_token


def send_api_key_email(session, user, token, expiry):
    logger.info(f"Sending API key email to {user=}:")
    email.enqueue_email_from_template(
        user.email, "api_key", template_args={"user": user, "token": token, "expiry": expiry}
    )


def send_password_reset_email(session, user):
    password_reset_token = PasswordResetToken(
        token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2)
    )
    session.add(password_reset_token)

    logger.info(f"Sending password reset email to {user=}:")
    password_reset_link = urls.password_reset_link(password_reset_token=password_reset_token.token)
    logger.info(f"Link is: {password_reset_link}")
    email.enqueue_email_from_template(
        user.email, "password_reset", template_args={"user": user, "password_reset_link": password_reset_link}
    )

    return password_reset_token


def send_report_email(complaint):
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    logger.info(f"Sending report email to {target_email=}")
    logger.info(f"User {complaint=} reporting user {complaint.reported_user.username=}")
    logger.info(f"Reason: {complaint.reason=}")
    logger.info(f"Description:")
    logger.info(f"{complaint.description=}")
    email.enqueue_email_from_template(
        target_email,
        "report",
        template_args={
            "complaint": complaint,
        },
    )


def send_new_host_request_email(host_request):
    logger.info(f"Sending host request email to {host_request.host=}:")
    logger.info(f"Host request sent by {host_request.surfer}")
    logger.info(f"Email for {host_request.host.username=} sent to {host_request.host.email=}")

    email.enqueue_email_from_template(
        host_request.host.email,
        "host_request",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_host_request_accepted_email_to_guest(host_request):
    logger.info(f"Sending host request accepted email to guest: {host_request.surfer=}:")
    logger.info(f"Email for {host_request.surfer.username=} sent to {host_request.surfer.email=}")

    email.enqueue_email_from_template(
        host_request.surfer.email,
        "host_request_accepted_guest",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_guest(),
        },
    )


def send_host_request_rejected_email_to_guest(host_request):
    logger.info(f"Sending host request rejected email to guest: {host_request.surfer=}:")
    logger.info(f"Email for {host_request.surfer.username=} sent to {host_request.surfer.email=}")

    email.enqueue_email_from_template(
        host_request.surfer.email,
        "host_request_rejected_guest",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_guest(),
        },
    )


def send_host_request_confirmed_email_to_host(host_request):
    logger.info(f"Sending host request confirmed email to host: {host_request.host=}:")
    logger.info(f"Email for {host_request.host.username=} sent to {host_request.host.email=}")

    email.enqueue_email_from_template(
        host_request.host.email,
        "host_request_confirmed_host",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_host_request_cancelled_email_to_host(host_request):
    logger.info(f"Sending host request cancelled email to host: {host_request.host=}:")
    logger.info(f"Email for {host_request.host.username=} sent to {host_request.host.email=}")

    email.enqueue_email_from_template(
        host_request.host.email,
        "host_request_cancelled_host",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_friend_request_email(friend_relationship):
    friend_requests_link = urls.friend_requests_link()

    logger.info(f"Sending friend request email to {friend_relationship.to_user=}:")
    logger.info(f"Email for {friend_relationship.to_user.username=} sent to {friend_relationship.to_user.email=}")
    logger.info(f"Friend request sent by {friend_relationship.from_user.username=}")

    email.enqueue_email_from_template(
        friend_relationship.to_user.email,
        "friend_request",
        template_args={
            "friend_relationship": friend_relationship,
            "friend_requests_link": friend_requests_link,
        },
    )


def send_friend_request_accepted_email(friend_relationship):
    user_link = urls.user_link(friend_relationship.to_user.username)

    logger.info(f"Sending friend request acceptance email to {friend_relationship.from_user=}:")
    logger.info(f"Email for {friend_relationship.from_user.username=} sent to {friend_relationship.from_user.email=}")

    email.enqueue_email_from_template(
        friend_relationship.from_user.email,
        "friend_request_accepted",
        template_args={
            "friend_relationship": friend_relationship,
            "user_link": user_link,
        },
    )


def send_host_reference_email(reference, both_written):
    """
    both_written iff both the surfer and hoster wrote a reference
    """
    assert reference.host_request_id

    logger.info(f"Sending host reference email to {reference.to_user=} for {reference.id=}")

    email.enqueue_email_from_template(
        reference.to_user.email,
        "host_reference",
        template_args={
            "reference": reference,
            # if this reference was written by the surfer, then the recipient hosted
            "surfed": reference.host_request.surfer_user_id != reference.from_user_id,
            "both_written": both_written,
        },
    )


def send_friend_reference_email(reference):
    assert not reference.host_request_id

    logger.info(f"Sending friend reference email to {reference.to_user=} for {reference.id=}")

    email.enqueue_email_from_template(
        reference.to_user.email,
        "friend_reference",
        template_args={
            "reference": reference,
        },
    )


def send_reference_reminder_email(user, other_user, host_request, surfed, time_left_text):
    logger.info(f"Sending host reference email to {user=}, they have {time_left_text} left to write a ref")

    email.enqueue_email_from_template(
        user.email,
        "reference_reminder",
        template_args={
            "user": user,
            "other_user": other_user,
            "host_request": host_request,
            "leave_reference_link": urls.leave_reference_link(
                "surfed" if surfed else "hosted", other_user.id, host_request.conversation_id
            ),
            "surfed": surfed,
            "time_left_text": time_left_text,
        },
    )


def send_password_changed_email(user):
    """
    Send the user an email saying their password has been changed.
    """
    logger.info(f"Sending password changed (notification) email to {user=}")
    email.enqueue_email_from_template(user.email, "password_changed", template_args={"user": user})


def send_email_changed_notification_email(user):
    """
    Send an email to user's original address notifying that it has been changed
    """
    logger.info(
        f"Sending email changed (notification) email to {user=} (old email: {user.email=}, new email: {user.new_email=})"
    )
    email.enqueue_email_from_template(user.email, "email_changed_notification", template_args={"user": user})


def send_email_changed_confirmation_to_old_email(user):
    """
    Send an email to user's original email address requesting confirmation of email change
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=}'s old email address, (old email: {user.email}, new email: {user.new_email=})"
    )

    confirmation_link = urls.change_email_link(confirmation_token=user.old_email_token)
    email.enqueue_email_from_template(
        user.email,
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
    email.enqueue_email_from_template(
        user.new_email,
        "email_changed_confirmation_new_email",
        template_args={"user": user, "confirmation_link": confirmation_link},
    )


def send_onboarding_email(user, email_number):
    email.enqueue_email_from_template(
        user.email,
        f"onboarding{email_number}",
        template_args={
            "user": user,
            "app_link": urls.app_link(),
            "profile_link": urls.profile_link(),
            "edit_profile_link": urls.edit_profile_link(),
        },
    )


def send_donation_email(user, amount, receipt_url):
    email.enqueue_email_from_template(
        user.email,
        "donation_received",
        template_args={"user": user, "amount": amount, "receipt_url": receipt_url},
    )


def maybe_send_contributor_form_email(form):
    target_email = config["CONTRIBUTOR_FORM_EMAIL_RECIPIENT"]

    if form.should_notify:
        email.enqueue_email_from_template(
            target_email,
            "contributor_form",
            template_args={"form": form, "user_link": urls.user_link(form.user.username)},
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
    nodes = session.execute(select(Node).where(func.ST_Contains(Node.geom, user.geom))).scalars().all()
    for node in nodes:
        node.official_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user=user,
                role=ClusterRole.member,
            )
        )
    session.commit()
