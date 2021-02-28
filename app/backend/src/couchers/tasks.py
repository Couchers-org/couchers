import logging

from sqlalchemy.sql import func

from couchers import email, urls
from couchers.config import config
from couchers.db import session_scope
from couchers.models import ClusterRole, ClusterSubscription, Node, User
from couchers.standardized_queries import query_users_who_arent_hidden

logger = logging.getLogger(__name__)


def send_signup_email(email_address, token, expiry_text):
    logger.info(f"Sending signup email to {email_address=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    signup_link = urls.signup_link(signup_token=token.token)
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


def send_host_request_email(host_request):
    host_request_link = urls.host_request_link()

    logger.info(f"Sending host request email to {host_request.to_user=}:")
    logger.info(f"Host request sent by {host_request.from_user}")
    logger.info(f"Email for {host_request.to_user.username=} sent to {host_request.to_user.email=}")

    email.enqueue_email_from_template(
        host_request.to_user.email,
        "host_request",
        template_args={
            "host_request": host_request,
            "host_request_link": host_request_link,
        },
    )


def send_message_received_email(user_recipient):
    messages_link = urls.messages_link()
    logger.info(f"Sending message received email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")

    email.enqueue_email_from_template(
        user_recipient.email,
        "message_received",
        template_args={
            "user": user_recipient,
            "messages_link": messages_link,
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
                query_users_who_arent_hidden(session).filter(func.ST_Contains(node.geom, User.geom)).filter(~User.id.in_(existing_users))
            )
            for user in users_needing_adding.all():
                node.official_cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user=user,
                        role=ClusterRole.member,
                    )
                )
            session.commit()
