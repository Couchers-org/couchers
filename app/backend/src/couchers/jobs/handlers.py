"""
Background job servicers
"""

import logging
from datetime import timedelta

import requests
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, delete, func, literal, or_, union_all

from couchers import config, email, urls
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import (
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    LoginToken,
    Message,
    MessageType,
    Reference,
    User,
)
from couchers.notifications.background import handle_email_notifications, handle_notification
from couchers.servicers.blocking import are_blocked
from couchers.sql import couchers_select as select
from couchers.tasks import enforce_community_memberships, send_onboarding_email, send_reference_reminder_email
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
        session.execute(
            delete(LoginToken).where(LoginToken.is_valid == False).execution_options(synchronize_session=False)
        )


def process_send_message_notifications(payload):
    """
    Sends out email notifications for messages that have been unseen for a long enough time
    """
    # very crude and dumb algorithm
    logger.info(f"Sending out email notifications for unseen messages")

    with session_scope() as session:
        # users who have unnotified messages older than 5 minutes in any group chat
        users = (
            session.execute(
                (
                    select(User)
                    .join(GroupChatSubscription, GroupChatSubscription.user_id == User.id)
                    .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                    .where(User.is_visible)
                    .where(Message.time >= GroupChatSubscription.joined)
                    .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                    .where(Message.id > User.last_notified_message_id)
                    .where(Message.id > GroupChatSubscription.last_seen_message_id)
                    .where(Message.time < now() - timedelta(minutes=5))
                    .where(Message.message_type == MessageType.text)  # TODO: only text messages for now
                )
            )
            .scalars()
            .unique()
        )

        for user in users:
            # now actually grab all the group chats, not just less than 5 min old
            subquery = (
                select(
                    GroupChatSubscription.group_chat_id.label("group_chat_id"),
                    func.max(GroupChatSubscription.id).label("group_chat_subscriptions_id"),
                    func.max(Message.id).label("message_id"),
                    func.count(Message.id).label("count_unseen"),
                )
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.user_id == user.id)
                .where(Message.id > user.last_notified_message_id)
                .where(Message.id > GroupChatSubscription.last_seen_message_id)
                .where(Message.time >= GroupChatSubscription.joined)
                .where(Message.message_type == MessageType.text)  # TODO: only text messages for now
                .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .group_by(GroupChatSubscription.group_chat_id)
                .order_by(func.max(Message.id).desc())
                .subquery()
            )

            unseen_messages = session.execute(
                select(GroupChat, Message, subquery.c.count_unseen)
                .join(subquery, subquery.c.message_id == Message.id)
                .join(GroupChat, GroupChat.conversation_id == subquery.c.group_chat_id)
                .order_by(subquery.c.message_id.desc())
            ).all()

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
        surfing_reqs = session.execute(
            select(User, HostRequest, func.max(Message.id))
            .where(User.is_visible)
            .join(HostRequest, HostRequest.surfer_user_id == User.id)
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .where(Message.id > HostRequest.surfer_last_seen_message_id)
            .where(Message.id > User.last_notified_request_message_id)
            .where(Message.time < now() - timedelta(minutes=5))
            .where(Message.message_type == MessageType.text)
            .group_by(User, HostRequest)
        ).all()

        # where this user is hosting
        hosting_reqs = session.execute(
            select(User, HostRequest, func.max(Message.id))
            .where(User.is_visible)
            .join(HostRequest, HostRequest.host_user_id == User.id)
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .where(Message.id > HostRequest.host_last_seen_message_id)
            .where(Message.id > User.last_notified_request_message_id)
            .where(Message.time < now() - timedelta(minutes=5))
            .where(Message.message_type == MessageType.text)
            .group_by(User, HostRequest)
        ).all()

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
        users = (
            session.execute(select(User).where(User.is_visible).where(User.onboarding_emails_sent == 0)).scalars().all()
        )

        for user in users:
            send_onboarding_email(user, email_number=1)
            user.onboarding_emails_sent = 1
            user.last_onboarding_email_sent = now()
            session.commit()

        # second onboarding email
        # sent after a week if the user has no profile or their "about me" section is less than 20 characters long
        users = (
            session.execute(
                select(User)
                .where(User.is_visible)
                .where(User.onboarding_emails_sent == 1)
                .where(now() - User.last_onboarding_email_sent > timedelta(days=7))
                .where(User.has_completed_profile == False)
            )
            .scalars()
            .all()
        )

        for user in users:
            send_onboarding_email(user, email_number=2)
            user.onboarding_emails_sent = 2
            user.last_onboarding_email_sent = now()
            session.commit()


def process_send_reference_reminders(payload):
    """
    Sends out reminders to write references after hosting/staying
    """
    logger.info(f"Sending out reference reminder emails")

    # Keep this in chronological order!
    reference_reminder_schedule = [
        # (number, timedelta before we stop being able to write a ref, text for how long they have left to write the ref)
        # the end time to write a reference is supposed to be midnight in the host's timezone
        # 8 pm ish on the last day of the stay
        (1, timedelta(days=15) - timedelta(hours=20), "14 days"),
        # 2 pm ish a week after stay
        (2, timedelta(days=8) - timedelta(hours=14), "7 days"),
        # 10 am ish 3 days before end of time to write ref
        (3, timedelta(days=4) - timedelta(hours=10), "3 days"),
    ]

    with session_scope() as session:
        # iterate the reminders in backwards order, so if we missed out on one we don't send duplicates
        for reminder_no, reminder_time, reminder_text in reversed(reference_reminder_schedule):
            user = aliased(User)
            other_user = aliased(User)
            # surfers needing to write a ref
            q1 = (
                select(literal(True), HostRequest, user, other_user)
                .join(user, user.id == HostRequest.surfer_user_id)
                .join(other_user, other_user.id == HostRequest.host_user_id)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        # if no reference is found in this join, then the surfer has not written a ref
                        Reference.from_user_id == HostRequest.surfer_user_id,
                    ),
                )
                .where(user.is_visible)
                .where(other_user.is_visible)
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.surfer_sent_reference_reminders < reminder_no)
                .where(HostRequest.end_time_to_write_reference - reminder_time < now())
            )

            # hosts needing to write a ref
            q2 = (
                select(literal(False), HostRequest, user, other_user)
                .join(user, user.id == HostRequest.host_user_id)
                .join(other_user, other_user.id == HostRequest.surfer_user_id)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        # if no reference is found in this join, then the host has not written a ref
                        Reference.from_user_id == HostRequest.host_user_id,
                    ),
                )
                .where(user.is_visible)
                .where(other_user.is_visible)
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.host_sent_reference_reminders < reminder_no)
                .where(HostRequest.end_time_to_write_reference - reminder_time < now())
            )

            union = union_all(q1, q2).subquery()
            union = select(
                union.c[0].label("surfed"),
                aliased(HostRequest, union),
                aliased(user, union),
                aliased(other_user, union),
            )
            reference_reminders = session.execute(union).all()

            for surfed, host_request, user, other_user in reference_reminders:
                # checked in sql
                assert user.is_visible
                if not are_blocked(session, user.id, other_user.id):
                    send_reference_reminder_email(user, other_user, host_request, surfed, reminder_text)
                    if surfed:
                        host_request.surfer_sent_reference_reminders = reminder_no
                    else:
                        host_request.host_sent_reference_reminders = reminder_no
                    session.commit()


def process_add_users_to_email_list(payload):
    if not config.config["MAILCHIMP_ENABLED"]:
        logger.info(f"Not adding users to mailing list")
        return

    logger.info(f"Adding users to mailing list")

    with session_scope() as session:
        users = (
            session.execute(select(User).where(User.is_visible).where(User.added_to_mailing_list == False).limit(100))
            .scalars()
            .all()
        )

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


def process_handle_notification(payload):
    handle_notification(payload.notification_id)


def process_handle_email_notifications(payload):
    handle_email_notifications()


# todo: send digests
