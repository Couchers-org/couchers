import logging

from sqlalchemy.sql import func

from couchers import email, urls
from couchers.config import config
from couchers.db import session_scope
from couchers.models import ClusterRole, ClusterSubscription, HostRequestStatus, Node, User

logger = logging.getLogger(__name__)


def send_flow_email_verification_email(email_address, token, expiry_text):
    # TODO
    logger.info(f"Sending signup flow email verification email to {email_address=}:")
    logger.info(f"Token: {token=}")
    signup_link = urls.signup_link(signup_token=token)
    logger.info(f"Link is: {signup_link}")
    email.enqueue_email_from_template(email_address, "signup", template_args={"signup_link": signup_link})


def send_login_email(user, token, expiry_text):
    logger.info(f"Sending login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    login_link = urls.login_link(login_token=token.token)
    logger.info(f"Link is: {login_link}")
    email.enqueue_email_from_template(user.email, "login", template_args={"user": user, "login_link": login_link})


def send_password_reset_email(user, token, expiry_text):
    logger.info(f"Sending password reset email to {user=}:")
    password_reset_link = urls.password_reset_link(password_reset_token=token.token)
    logger.info(f"Link is: {password_reset_link}")
    email.enqueue_email_from_template(
        user.email, "password_reset", template_args={"user": user, "password_reset_link": password_reset_link}
    )


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
    logger.info(f"Sending host request email to {host_request.to_user=}:")
    logger.info(f"Host request sent by {host_request.from_user}")
    logger.info(f"Email for {host_request.to_user.username=} sent to {host_request.to_user.email=}")

    email.enqueue_email_from_template(
        host_request.to_user.email,
        "host_request",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_host_request_accepted_email_to_guest(host_request):
    logger.info(f"Sending host request accepted email to guest: {host_request.from_user=}:")
    logger.info(f"Email for {host_request.from_user.username=} sent to {host_request.from_user.email=}")

    email.enqueue_email_from_template(
        host_request.from_user.email,
        "host_request_accepted_guest",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_guest(),
        },
    )


def send_host_request_rejected_email_to_guest(host_request):
    logger.info(f"Sending host request rejected email to guest: {host_request.from_user=}:")
    logger.info(f"Email for {host_request.from_user.username=} sent to {host_request.from_user.email=}")

    email.enqueue_email_from_template(
        host_request.from_user.email,
        "host_request_rejected_guest",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_guest(),
        },
    )


def send_host_request_confirmed_email_to_host(host_request):
    logger.info(f"Sending host request confirmed email to host: {host_request.to_user=}:")
    logger.info(f"Email for {host_request.to_user.username=} sent to {host_request.to_user.email=}")

    email.enqueue_email_from_template(
        host_request.to_user.email,
        "host_request_confirmed_host",
        template_args={
            "host_request": host_request,
            "host_request_link": urls.host_request_link_host(),
        },
    )


def send_host_request_cancelled_email_to_host(host_request):
    logger.info(f"Sending host request cancelled email to host: {host_request.to_user=}:")
    logger.info(f"Email for {host_request.to_user.username=} sent to {host_request.to_user.email=}")

    email.enqueue_email_from_template(
        host_request.to_user.email,
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
            "surfed": reference.host_request.from_user_id != reference.from_user_id,
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


def send_password_changed_email(user):
    """
    Send the user an email saying their password has been changed.
    """
    logger.info(f"Sending password changed (notification) email to {user=}")
    email.enqueue_email_from_template(user.email, "password_changed", template_args={"user": user})


def send_email_changed_notification_email(user):
    """
    Send the user an email saying their email has changed. Goes to the old address
    """
    logger.info(
        f"Sending email changed (notification) email to {user=} (old email: {user.email=}, new email: {user.new_email=})"
    )
    email.enqueue_email_from_template(user.email, "email_changed_notification", template_args={"user": user})


def send_email_changed_confirmation_email(user, token, expiry_text):
    """
    Send the user an email confirming their new email. Goes to the new address
    """
    logger.info(
        f"Sending email changed (confirmation) email to {user=} (old email: {user.email=}, new email: {user.new_email=})"
    )
    confirmation_link = urls.change_email_link(confirmation_token=token)
    email.enqueue_email_from_template(
        user.email, "email_changed_confirmation", template_args={"user": user, "confirmation_link": confirmation_link}
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


def enforce_community_memberships():
    """
    Go through all communities and make sure every user in the polygon is also a member
    """
    with session_scope() as session:
        for node in session.query(Node).all():
            existing_users = (
                session.query(ClusterSubscription.user_id)
                .filter(ClusterSubscription.cluster == node.official_cluster)
                .subquery()
            )
            users_needing_adding = (
                session.query(User)
                .filter(User.is_visible)
                .filter(func.ST_Contains(node.geom, User.geom))
                .filter(~User.id.in_(existing_users))
            )
            for user in users_needing_adding.all():
                node.official_cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user=user,
                        role=ClusterRole.member,
                    )
                )
            session.commit()
