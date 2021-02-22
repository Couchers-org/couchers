"""
Background job servicers
"""

import logging
from datetime import timedelta

from sqlalchemy.sql import func, or_

from couchers import config
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import GroupChat, GroupChatSubscription, LoginToken, Message, SignupToken, User
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
        for user_id in session.query(User.id).filter(~User.is_banned).all():
            max_view_size = 5
            group_chats = (
                session.query(GroupChat, GroupChatSubscription, func.count(Message.id), func.max(Message.id))
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(Message.id > GroupChatSubscription.last_notified_message_id)
                .filter(Message.time < now() - timedelta(minutes=30))
                .group_by(GroupChat, GroupChatSubscription)
                .order_by(func.max(Message.id).desc())
                .all()
            )
            logger.info(group_chats)
