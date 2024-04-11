"""
Contains "fan functions" that given some data decide who to notify. Needs to return a list of user ids
"""

import logging

from sqlalchemy.sql import not_, select

from couchers.db import session_scope
from couchers.models import GroupChat, GroupChatSubscription, Message, MessageType, User
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def fan_message_notifications(message_id_str):
    """
    Generates notifications for a message sent to a group chat
    """
    message_id = int(message_id_str)
    logger.info(f"Fanning notifications for message_id = {message_id}")

    with session_scope() as session:
        message, group_chat = session.execute(
            select(Message, GroupChat)
            .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
            .where(Message.id == message_id)
        ).one()

        if message.message_type != MessageType.text:
            logger.info(f"Not a text message, not notifying. message_id = {message_id}")
            return

        subscriptions = (
            session.execute(
                select(GroupChatSubscription)
                .join(User, User.id == GroupChatSubscription.user_id)
                .where(GroupChatSubscription.group_chat_id == message.conversation_id)
                .where(User.is_visible)
                .where(User.id != message.author_id)
                .where(GroupChatSubscription.left == None)
                .where(not_(GroupChatSubscription.is_muted))
            )
            .scalars()
            .all()
        )

        return [subscription.user_id for subscription in subscriptions]
