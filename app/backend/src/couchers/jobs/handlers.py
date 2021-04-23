"""
Background job servicers
"""

import logging
from datetime import timedelta

from sqlalchemy import and_, desc
from sqlalchemy.orm import aliased
from sqlalchemy.sql import func, or_

from couchers import config, email, urls
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import (
    Conversation,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    HostRequestStatus,
    LoginToken,
    Message,
    MessageType,
    SignupToken,
    User,
)
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
    Sends out email notifications for groupchat messages that have been unseen for a long enough time #FIX
    """
    logger.info(f"Sending out email notifications for unseen messages")

    with session_scope() as session:
        Hosts = aliased(HostRequest)
        Guests = aliased(HostRequest)
        recent_messages = (
            session.query(
                Message.conversation_id.label("conversation_id"),
                Conversation.type.label("conversation_type"),
                func.count(Message.id).label("count_unseen_messages"),
                func.max(GroupChatSubscription.user_id, Hosts.to_user_id, Guests.from_user_id).label("user_id"),
            )
            .join(
                GroupChatSubscription,
                and_(
                    Message.conversation_id == GroupChatSubscription.group_chat_id,
                    Message.time >= GroupChatSubscription.joined,
                    or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None),
                    Message.id > GroupChatSubscription.last_seen_message_id,
                ),
            )
            .join(
                Hosts,
                and_(Message.conversation_id == Hosts.conversation_id, Message.id > Hosts.to_last_seen_message_id),
            )
            .join(
                Guests,
                and_(Message.conversation_id == Guests.conversation_id, Message.id > Guests.from_last_seen_message_id),
            )
            .join(Conversation, Conversation.id == Message.conversation_id)
            .filter(Message.time < now() - timedelta(minutes=5))
            .filter(Message.time > now() - timedelta(minutes=10))
            .filter(Message.id > User.last_notified_message_id)
            .group_by(Message.conversation_id)
            .group_by("user_id")
            .subquery()
        )

        user_data = (
            session.query(
                User,
                func.first(Message),
                recent_messages.c.conversation_type,
                recent_messages.c.count_unseen_messages,
            )
            .join(recent_messages, User.id == recent_messages.c.user_id)
            .join(Message, recent_messages.c.conversation_id == Message.conversation_id)
            .group_by(Message.conversation_id)
            .order_by(desc(Message.id))  # needs to be descending for func.first
            .order_by(User.id)
            .all()
        )

        unseen_messages = []
        total_unseen_messages = 0
        # in reverse so the last message accessed will be the biggest id for last_notified_message
        for i in reversed(range(len(user_data))):
            data = user_data[i]
            user = data[0]
            latest_message = data[1]
            conversation_type = data[2]
            count = data[3]

            # adds to beginning of list, so conversations remain in order
            unseen_messages.insert(0, (conversation_type, latest_message, count))
            total_unseen_messages += count

            if i == 0 or user_data[i - 1][0].id != user.id:  # end of loop or new user
                user.last_notified_message_id = latest_message.id  # ordered desc, so will always be biggest
                session.commit()

                email.enqueue_email_from_template(
                    user.email,
                    "unseen_messages",
                    template_args={
                        "user": user,
                        "total_unseen_message_count": total_unseen_messages,
                        "unseen_messages": unseen_messages,
                        "group_chats_link": urls.messages_link(),
                    },
                )
                unseen_messages = []
                total_unseen_messages = 0
