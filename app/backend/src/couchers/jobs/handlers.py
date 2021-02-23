"""
Background job servicers
"""

import logging
from datetime import timedelta

from sqlalchemy.sql import func, or_

from couchers import config, email, urls
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import GroupChat, GroupChatSubscription, LoginToken, Message, MessageType, SignupToken, User
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


def process_purge_signup_tokens(payload):
    logger.info(f"Purging signup tokens")
    with session_scope() as session:
        session.query(SignupToken).filter(SignupToken.is_valid == False).delete(synchronize_session=False)


def process_send_message_notifications(payload):
    """
    Sends out email notifications for messages that have been unseen for a long enough time
    """
    # very crude and dumb algorithm
    logger.info(f"Sending out email notifications for unseen messages")

    with session_scope() as session:
        # users who have unnotified messages older than 30 minutes in any group chat
        users = (
            session.query(User)
            .join(GroupChatSubscription, GroupChatSubscription.user_id == User.id)
            .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
            .filter(Message.time >= GroupChatSubscription.joined)
            .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
            .filter(Message.id > User.last_notified_message_id)
            .filter(Message.id > GroupChatSubscription.last_seen_message_id)
            .filter(Message.time < now() - timedelta(minutes=30))
            .filter(Message.message_type == MessageType.text)  # TODO: only text messages for now
            .all()
        )

        for user in users:
            # now actually grab all the group chats, not just less than 30 min old
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
