"""
Background job servicers
"""

import logging
from datetime import timedelta

import requests
from sqlalchemy.sql import func, or_

from couchers import config, email, urls
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import GroupChat, GroupChatSubscription, HostRequest, LoginToken, Message, MessageType, User
from couchers.tasks import enforce_community_memberships, send_onboarding_email
from couchers.utils import now

logger = logging.getLogger(__name__)


def process_send_email(payload):
    logger.info(f"Sending email with subject '{payload.subject}' to '{payload.recipient}'")
    # selects a "sender", which either prints the email to the logger or sends it out with SMTP
    sender = send_smtp_email if config.config["ENABLE_EMAIL"] else print_dev_email
    # the sender must return a models.Email object that can be added to the database
    email = sender(
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=payload.html,
    )
    with session_scope() as session:
        session.add(email)


def process_purge_login_tokens(payload):
    logger.info(f"Purging login tokens")
    with session_scope() as session:
        session.query(LoginToken).filter(LoginToken.is_valid == False).delete(synchronize_session=False)


def process_send_message_notifications(payload):
    """
    Sends out email notifications for messages that have been unseen for a long enough time
    """
    # very crude and dumb algorithm
    logger.info(f"Sending out email notifications for unseen messages")

    with session_scope() as session:
        # users who have unnotified messages older than 5 minutes in any group chat
        users = (
            session.query(User)
            .filter(User.is_visible)
            .join(GroupChatSubscription, GroupChatSubscription.user_id == User.id)
            .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
            .filter(Message.time >= GroupChatSubscription.joined)
            .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
            .filter(Message.id > User.last_notified_message_id)
            .filter(Message.id > GroupChatSubscription.last_seen_message_id)
            .filter(Message.time < now() - timedelta(minutes=5))
            .filter(Message.message_type == MessageType.text)  # TODO: only text messages for now
            .all()
        )

        for user in users:
            # now actually grab all the group chats, not just less than 5 min old
            subquery = (
                session.query(
                    GroupChatSubscription.group_chat_id.label("group_chat_id"),
                    func.max(GroupChatSubscription.id).label("group_chat_subscriptions_id"),
                    func.max(Message.id).label("message_id"),
                    func.count(Message.id).label("count_unseen"),
                )
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == user.id)
                .filter(Message.id > user.last_notified_message_id)
                .filter(Message.id > GroupChatSubscription.last_seen_message_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(Message.message_type == MessageType.text)  # TODO: only text messages for now
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .group_by(GroupChatSubscription.group_chat_id)
                .order_by(func.max(Message.id).desc())
                .subquery()
            )

            unseen_messages = (
                session.query(GroupChat, Message, subquery.c.count_unseen)
                .join(subquery, subquery.c.message_id == Message.id)
                .join(GroupChat, GroupChat.conversation_id == subquery.c.group_chat_id)
                .order_by(subquery.c.message_id.desc())
                .all()
            )

            user.last_notified_message_id = max(message.id for _, message, _ in unseen_messages)
            session.commit()

            total_unseen_message_count = sum(count for _, _, count in unseen_messages)

            email.enqueue_email_from_template(
                user.email,
                "unseen_messages",
                template_args={
                    "user": user,
                    "total_unseen_message_count": total_unseen_message_count,
                    "unseen_messages": [
                        (group_chat, latest_message, count) for group_chat, latest_message, count in unseen_messages
                    ],
                    "group_chats_link": urls.messages_link(),
                },
            )


def process_send_request_notifications(payload):
    """
    Sends out email notifications for unseen messages in host requests (as surfer or host)
    """
    logger.info(f"Sending out email notifications for unseen messages in host requests")

    with session_scope() as session:
        # requests where this user is surfing
        surfing_reqs = (
            session.query(User, HostRequest, func.max(Message.id))
            .filter(User.is_visible)
            .join(HostRequest, HostRequest.from_user_id == User.id)
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .filter(Message.id > HostRequest.from_last_seen_message_id)
            .filter(Message.id > User.last_notified_request_message_id)
            .filter(Message.time < now() - timedelta(minutes=5))
            .filter(Message.message_type == MessageType.text)
            .group_by(User, HostRequest)
            .all()
        )

        # where this user is hosting
        hosting_reqs = (
            session.query(User, HostRequest, func.max(Message.id))
            .filter(User.is_visible)
            .join(HostRequest, HostRequest.to_user_id == User.id)
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .filter(Message.id > HostRequest.to_last_seen_message_id)
            .filter(Message.id > User.last_notified_request_message_id)
            .filter(Message.time < now() - timedelta(minutes=5))
            .filter(Message.message_type == MessageType.text)
            .group_by(User, HostRequest)
            .all()
        )

        for user, host_request, max_message_id in surfing_reqs:
            user.last_notified_request_message_id = max(user.last_notified_request_message_id, max_message_id)
            session.commit()

            email.enqueue_email_from_template(
                user.email,
                "unseen_message_guest",
                template_args={
                    "user": user,
                    "host_request": host_request,
                    "host_request_link": urls.host_request_link_guest(),
                },
            )

        for user, host_request, max_message_id in hosting_reqs:
            user.last_notified_request_message_id = max(user.last_notified_request_message_id, max_message_id)
            session.commit()

            email.enqueue_email_from_template(
                user.email,
                "unseen_message_host",
                template_args={
                    "user": user,
                    "host_request": host_request,
                    "host_request_link": urls.host_request_link_host(),
                },
            )


def process_send_onboarding_emails(payload):
    """
    Sends out onboarding emails
    """
    logger.info(f"Sending out onboarding emails")

    with session_scope() as session:
        # first onboarding email
        users = session.query(User).filter(User.is_visible).filter(User.onboarding_emails_sent == 0).all()

        for user in users:
            send_onboarding_email(user, email_number=1)
            user.onboarding_emails_sent = 1
            user.last_onboarding_email_sent = now()
            session.commit()

        # second onboarding email
        # sent after a week if the user has no profile or their "about me" section is less than 20 characters long
        users = (
            session.query(User)
            .filter(User.is_visible)
            .filter(User.onboarding_emails_sent == 1)
            .filter(now() - User.last_onboarding_email_sent > timedelta(days=7))
            .filter(User.has_completed_profile == False)
            .all()
        )

        for user in users:
            send_onboarding_email(user, email_number=2)
            user.onboarding_emails_sent = 2
            user.last_onboarding_email_sent = now()
            session.commit()


def process_add_users_to_email_list(payload):
    if not config.config["MAILCHIMP_ENABLED"]:
        logger.info(f"Not adding users to mailing list")
        return

    logger.info(f"Adding users to mailing list")

    with session_scope() as session:
        users = session.query(User).filter(User.is_visible).filter(User.added_to_mailing_list == False).limit(100).all()

        if not users:
            logger.info(f"No users to add to mailing list")
            return

        auth = ("apikey", config.config["MAILCHIMP_API_KEY"])

        body = {
            "members": [
                {
                    "email_address": user.email,
                    "status_if_new": "subscribed",
                    "status": "subscribed",
                    "merge_fields": {
                        "FNAME": user.name,
                    },
                }
                for user in users
            ]
        }

        dc = config.config["MAILCHIMP_DC"]
        list_id = config.config["MAILCHIMP_LIST_ID"]
        r = requests.post(f"https://{dc}.api.mailchimp.com/3.0/lists/{list_id}", auth=auth, json=body)
        if r.status_code == 200:
            for user in users:
                user.added_to_mailing_list = True
            session.commit()
        else:
            raise Exception("Failed to add users to mailing list")


def process_enforce_community_membership(payload):
    enforce_community_memberships()
