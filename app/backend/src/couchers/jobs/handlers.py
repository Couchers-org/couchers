"""
Background job servicers
"""

import logging
from datetime import date, timedelta
from math import cos, pi, sin, sqrt
from random import sample
from typing import Any

import requests
from google.protobuf import empty_pb2
from sqlalchemy import Float, Integer
from sqlalchemy.orm import aliased
from sqlalchemy.sql import (
    and_,
    case,
    cast,
    delete,
    distinct,
    exists,
    extract,
    func,
    literal,
    not_,
    or_,
    union_all,
    update,
)

from couchers.config import config
from couchers.constants import (
    ACTIVENESS_PROBE_EXPIRY_TIME,
    ACTIVENESS_PROBE_INACTIVITY_PERIOD,
    ACTIVENESS_PROBE_TIME_REMINDERS,
    EVENT_REMINDER_TIMEDELTA,
    HOST_REQUEST_MAX_REMINDERS,
    HOST_REQUEST_REMINDER_INTERVAL,
)
from couchers.context import make_background_user_context
from couchers.crypto import (
    USER_LOCATION_RANDOMIZATION_NAME,
    asym_encrypt,
    b64decode,
    get_secret,
    simple_decrypt,
    stable_secure_uniform,
)
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.helpers.badges import user_add_badge, user_remove_badge
from couchers.materialized_views import (
    UserResponseRate,
    refresh_materialized_views,
    refresh_materialized_views_rapid,
)
from couchers.metrics import strong_verification_completions_counter
from couchers.models import (
    AccountDeletionToken,
    ActivenessProbe,
    ActivenessProbeStatus,
    Cluster,
    ClusterRole,
    ClusterSubscription,
    EventOccurrence,
    EventOccurrenceAttendee,
    GroupChat,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    HostRequestStatus,
    Invoice,
    LoginToken,
    MeetupStatus,
    Message,
    MessageType,
    PassportSex,
    PasswordResetToken,
    Reference,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    User,
    UserBadge,
)
from couchers.notifications.background import handle_email_digests, handle_notification, send_raw_push_notification
from couchers.notifications.notify import notify
from couchers.proto import notification_data_pb2
from couchers.proto.internal import jobs_pb2, verification_pb2
from couchers.resources import get_badge_dict, get_static_badge_dict
from couchers.servicers.admin import generate_new_blog_post_notifications
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import is_not_visible
from couchers.servicers.conversations import generate_message_notifications
from couchers.servicers.discussions import generate_create_discussion_notifications
from couchers.servicers.events import (
    event_to_pb,
    generate_event_cancel_notifications,
    generate_event_create_notifications,
    generate_event_delete_notifications,
    generate_event_update_notifications,
)
from couchers.servicers.requests import host_request_to_pb
from couchers.servicers.threads import generate_reply_notifications
from couchers.sql import couchers_select as select
from couchers.tasks import enforce_community_memberships as tasks_enforce_community_memberships
from couchers.tasks import send_duplicate_strong_verification_email
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    get_coordinates,
    now,
)

logger = logging.getLogger(__name__)


# these were straight up imported
handle_notification.PAYLOAD = jobs_pb2.HandleNotificationPayload

send_raw_push_notification.PAYLOAD = jobs_pb2.SendRawPushNotificationPayload

handle_email_digests.PAYLOAD = empty_pb2.Empty
handle_email_digests.SCHEDULE = timedelta(minutes=15)

generate_message_notifications.PAYLOAD = jobs_pb2.GenerateMessageNotificationsPayload

generate_reply_notifications.PAYLOAD = jobs_pb2.GenerateReplyNotificationsPayload

generate_create_discussion_notifications.PAYLOAD = jobs_pb2.GenerateCreateDiscussionNotificationsPayload

generate_event_create_notifications.PAYLOAD = jobs_pb2.GenerateEventCreateNotificationsPayload

generate_event_update_notifications.PAYLOAD = jobs_pb2.GenerateEventUpdateNotificationsPayload

generate_event_cancel_notifications.PAYLOAD = jobs_pb2.GenerateEventCancelNotificationsPayload

generate_event_delete_notifications.PAYLOAD = jobs_pb2.GenerateEventDeleteNotificationsPayload

generate_new_blog_post_notifications.PAYLOAD = jobs_pb2.GenerateNewBlogPostNotificationsPayload

refresh_materialized_views.PAYLOAD = empty_pb2.Empty
refresh_materialized_views.SCHEDULE = timedelta(minutes=5)

refresh_materialized_views_rapid.PAYLOAD = empty_pb2.Empty
refresh_materialized_views_rapid.SCHEDULE = timedelta(seconds=30)


def send_email(payload: jobs_pb2.SendEmailPayload) -> None:
    logger.info(f"Sending email with subject '{payload.subject}' to '{payload.recipient}'")
    # selects a "sender", which either prints the email to the logger or sends it out with SMTP
    sender = send_smtp_email if config["ENABLE_EMAIL"] else print_dev_email
    # the sender must return a models.Email object that can be added to the database
    email = sender(
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=payload.html,
        list_unsubscribe_header=payload.list_unsubscribe_header,
        source_data=payload.source_data,
    )
    with session_scope() as session:
        session.add(email)


send_email.PAYLOAD = jobs_pb2.SendEmailPayload


def purge_login_tokens(payload: empty_pb2.Empty) -> None:
    logger.info("Purging login tokens")
    with session_scope() as session:
        session.execute(delete(LoginToken).where(~LoginToken.is_valid).execution_options(synchronize_session=False))


purge_login_tokens.PAYLOAD = empty_pb2.Empty
purge_login_tokens.SCHEDULE = timedelta(hours=24)


def purge_password_reset_tokens(payload: empty_pb2.Empty) -> None:
    logger.info("Purging login tokens")
    with session_scope() as session:
        session.execute(
            delete(PasswordResetToken).where(~PasswordResetToken.is_valid).execution_options(synchronize_session=False)
        )


purge_password_reset_tokens.PAYLOAD = empty_pb2.Empty
purge_password_reset_tokens.SCHEDULE = timedelta(hours=24)


def purge_account_deletion_tokens(payload: empty_pb2.Empty) -> None:
    logger.info("Purging account deletion tokens")
    with session_scope() as session:
        session.execute(
            delete(AccountDeletionToken)
            .where(~AccountDeletionToken.is_valid)
            .execution_options(synchronize_session=False)
        )


purge_account_deletion_tokens.PAYLOAD = empty_pb2.Empty
purge_account_deletion_tokens.SCHEDULE = timedelta(hours=24)


def send_message_notifications(payload: empty_pb2.Empty) -> None:
    """
    Sends out email notifications for messages that have been unseen for a long enough time
    """
    # very crude and dumb algorithm
    logger.info("Sending out email notifications for unseen messages")

    with session_scope() as session:
        # users who have unnotified messages older than 5 minutes in any group chat
        users = (
            session.execute(
                select(User)
                .join(GroupChatSubscription, GroupChatSubscription.user_id == User.id)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .where(not_(GroupChatSubscription.is_muted))
                .where(User.is_visible)
                .where(Message.time >= GroupChatSubscription.joined)
                .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .where(Message.id > User.last_notified_message_id)
                .where(Message.id > GroupChatSubscription.last_seen_message_id)
                .where(Message.time < now() - timedelta(minutes=5))
                .where(Message.message_type == MessageType.text)  # TODO: only text messages for now
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
                .where(not_(GroupChatSubscription.is_muted))
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

            if not unseen_messages:
                continue

            user.last_notified_message_id = max(message.id for _, message, _ in unseen_messages)

            # Filter out messages from authors who are not visible to the user (e.g., blocked)
            visible_unseen_messages = [
                (group_chat, message, count_unseen)
                for group_chat, message, count_unseen in unseen_messages
                if not is_not_visible(session, user.id, message.author_id)
            ]

            if not visible_unseen_messages:
                session.commit()
                continue

            def format_title(message, group_chat, count_unseen):
                if group_chat.is_dm:
                    return f"You missed {count_unseen} message(s) from {message.author.name}"
                else:
                    return f"You missed {count_unseen} message(s) in {group_chat.title}"

            notify(
                session,
                user_id=user.id,
                topic_action="chat:missed_messages",
                data=notification_data_pb2.ChatMissedMessages(
                    messages=[
                        notification_data_pb2.ChatMessage(
                            author=user_model_to_pb(
                                message.author,
                                session,
                                make_background_user_context(user_id=user.id),
                            ),
                            message=format_title(message, group_chat, count_unseen),
                            text=message.text,
                            group_chat_id=message.conversation_id,
                        )
                        for group_chat, message, count_unseen in visible_unseen_messages
                    ],
                ),
            )
            session.commit()


send_message_notifications.PAYLOAD = empty_pb2.Empty
send_message_notifications.SCHEDULE = timedelta(minutes=3)


def send_request_notifications(payload: empty_pb2.Empty) -> None:
    """
    Sends out email notifications for unseen messages in host requests (as surfer or host)
    """
    logger.info("Sending out email notifications for unseen messages in host requests")

    with session_scope() as session:
        # Get all candidate users who might have unseen request messages
        candidate_user_ids = (
            session.execute(
                select(User.id)
                .where(User.is_visible)
                .where(
                    or_(
                        # Users with unseen messages as surfer
                        exists(
                            select(1)
                            .select_from(HostRequest)
                            .join(Message, Message.conversation_id == HostRequest.conversation_id)
                            .where(HostRequest.surfer_user_id == User.id)
                            .where(Message.id > HostRequest.surfer_last_seen_message_id)
                            .where(Message.id > User.last_notified_request_message_id)
                            .where(Message.time < now() - timedelta(minutes=5))
                            .where(Message.message_type == MessageType.text)
                        ),
                        # Users with unseen messages as host
                        exists(
                            select(1)
                            .select_from(HostRequest)
                            .join(Message, Message.conversation_id == HostRequest.conversation_id)
                            .where(HostRequest.host_user_id == User.id)
                            .where(Message.id > HostRequest.host_last_seen_message_id)
                            .where(Message.id > User.last_notified_request_message_id)
                            .where(Message.time < now() - timedelta(minutes=5))
                            .where(Message.message_type == MessageType.text)
                        ),
                    )
                )
            )
            .scalars()
            .all()
        )

        for user_id in candidate_user_ids:
            context = make_background_user_context(user_id=user_id)

            # requests where this user is surfing
            surfing_reqs = session.execute(
                select(User, HostRequest, func.max(Message.id))
                .where(User.id == user_id)
                .join(HostRequest, HostRequest.surfer_user_id == User.id)
                .where_users_column_visible(context, HostRequest.host_user_id)
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
                .where(User.id == user_id)
                .join(HostRequest, HostRequest.host_user_id == User.id)
                .where_users_column_visible(context, HostRequest.surfer_user_id)
                .join(Message, Message.conversation_id == HostRequest.conversation_id)
                .where(Message.id > HostRequest.host_last_seen_message_id)
                .where(Message.id > User.last_notified_request_message_id)
                .where(Message.time < now() - timedelta(minutes=5))
                .where(Message.message_type == MessageType.text)
                .group_by(User, HostRequest)
            ).all()

            for user, host_request, max_message_id in surfing_reqs:
                user.last_notified_request_message_id = max(user.last_notified_request_message_id, max_message_id)
                session.flush()

                notify(
                    session,
                    user_id=user.id,
                    topic_action="host_request:missed_messages",
                    key=host_request.conversation_id,
                    data=notification_data_pb2.HostRequestMissedMessages(
                        host_request=host_request_to_pb(host_request, session, context),
                        user=user_model_to_pb(host_request.host, session, context),
                        am_host=False,
                    ),
                )

            for user, host_request, max_message_id in hosting_reqs:
                user.last_notified_request_message_id = max(user.last_notified_request_message_id, max_message_id)
                session.flush()

                notify(
                    session,
                    user_id=user.id,
                    topic_action="host_request:missed_messages",
                    key=host_request.conversation_id,
                    data=notification_data_pb2.HostRequestMissedMessages(
                        host_request=host_request_to_pb(host_request, session, context),
                        user=user_model_to_pb(host_request.surfer, session, context),
                        am_host=True,
                    ),
                )


send_request_notifications.PAYLOAD = empty_pb2.Empty
send_request_notifications.SCHEDULE = timedelta(minutes=3)


def send_onboarding_emails(payload: empty_pb2.Empty) -> None:
    """
    Sends out onboarding emails
    """
    logger.info("Sending out onboarding emails")

    with session_scope() as session:
        # first onboarding email
        users = (
            session.execute(select(User).where(User.is_visible).where(User.onboarding_emails_sent == 0)).scalars().all()
        )

        for user in users:
            notify(
                session,
                user_id=user.id,
                topic_action="onboarding:reminder",
                key="1",
            )
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
            notify(
                session,
                user_id=user.id,
                topic_action="onboarding:reminder",
                key="2",
            )
            user.onboarding_emails_sent = 2
            user.last_onboarding_email_sent = now()
            session.commit()


send_onboarding_emails.PAYLOAD = empty_pb2.Empty
send_onboarding_emails.SCHEDULE = timedelta(hours=1)


def send_reference_reminders(payload: empty_pb2.Empty) -> None:
    """
    Sends out reminders to write references after hosting/staying
    """
    logger.info("Sending out reference reminder emails")

    # Keep this in chronological order!
    reference_reminder_schedule = [
        # (number, timedelta before we stop being able to write a ref, text for how long they have left to write the ref)
        # the end time to write a reference is supposed to be midnight in the host's timezone
        # 8 pm ish on the last day of the stay
        (1, timedelta(days=15) - timedelta(hours=20), 14),
        # 2 pm ish a week after stay
        (2, timedelta(days=8) - timedelta(hours=14), 7),
        # 10 am ish 3 days before end of time to write ref
        (3, timedelta(days=4) - timedelta(hours=10), 3),
    ]

    with session_scope() as session:
        # iterate the reminders in backwards order, so if we missed out on one we don't send duplicates
        for reminder_number, reminder_time, reminder_days_left in reversed(reference_reminder_schedule):
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
                .where(HostRequest.surfer_sent_reference_reminders < reminder_number)
                .where(HostRequest.end_time_to_write_reference - reminder_time < now())
                .where(HostRequest.surfer_reason_didnt_meetup == None)
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
                .where(HostRequest.host_sent_reference_reminders < reminder_number)
                .where(HostRequest.end_time_to_write_reference - reminder_time < now())
                .where(HostRequest.host_reason_didnt_meetup == None)
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
                if not is_not_visible(session, user.id, other_user.id):
                    context = make_background_user_context(user_id=user.id)
                    notify(
                        session,
                        user_id=user.id,
                        topic_action="reference:reminder_surfed" if surfed else "reference:reminder_hosted",
                        data=notification_data_pb2.ReferenceReminder(
                            host_request_id=host_request.conversation_id,
                            other_user=user_model_to_pb(other_user, session, context),
                            days_left=reminder_days_left,
                        ),
                    )
                    if surfed:
                        host_request.surfer_sent_reference_reminders = reminder_number
                    else:
                        host_request.host_sent_reference_reminders = reminder_number
                    session.commit()


send_reference_reminders.PAYLOAD = empty_pb2.Empty
send_reference_reminders.SCHEDULE = timedelta(hours=1)


def send_host_request_reminders(payload: empty_pb2.Empty) -> None:
    with session_scope() as session:
        host_has_sent_message = select(1).where(
            Message.conversation_id == HostRequest.conversation_id, Message.author_id == HostRequest.host_user_id
        )

        requests = (
            session.execute(
                select(HostRequest)
                .where(HostRequest.status == HostRequestStatus.pending)
                .where(HostRequest.host_sent_request_reminders < HOST_REQUEST_MAX_REMINDERS)
                .where(HostRequest.start_time > func.now())
                .where((func.now() - HostRequest.last_sent_request_reminder_time) >= HOST_REQUEST_REMINDER_INTERVAL)
                .where(~exists(host_has_sent_message))
            )
            .scalars()
            .all()
        )

        for host_request in requests:
            # Skip if users are not visible to each other (e.g., one blocked the other)
            if is_not_visible(session, host_request.host_user_id, host_request.surfer_user_id):
                continue

            host_request.host_sent_request_reminders += 1
            host_request.last_sent_request_reminder_time = now()

            context = make_background_user_context(user_id=host_request.host_user_id)
            notify(
                session,
                user_id=host_request.host_user_id,
                topic_action="host_request:reminder",
                data=notification_data_pb2.HostRequestReminder(
                    host_request=host_request_to_pb(host_request, session, context),
                    surfer=user_model_to_pb(host_request.surfer, session, context),
                ),
            )

            session.commit()


send_host_request_reminders.PAYLOAD = empty_pb2.Empty
send_host_request_reminders.SCHEDULE = timedelta(minutes=15)


def add_users_to_email_list(payload: empty_pb2.Empty) -> None:
    if not config["LISTMONK_ENABLED"]:
        logger.info("Not adding users to mailing list")
        return

    logger.info("Adding users to mailing list")

    while True:
        with session_scope() as session:
            user = session.execute(
                select(User).where(User.is_visible).where(User.in_sync_with_newsletter == False).limit(1)
            ).scalar_one_or_none()
            if not user:
                logger.info("Finished adding users to mailing list")
                return

            if user.opt_out_of_newsletter:
                user.in_sync_with_newsletter = True
                session.commit()
                continue

            r = requests.post(
                config["LISTMONK_BASE_URL"] + "/api/subscribers",
                auth=(config["LISTMONK_API_USERNAME"], config["LISTMONK_API_KEY"]),
                json={
                    "email": user.email,
                    "name": user.name,
                    "lists": [config["LISTMONK_LIST_ID"]],
                    "preconfirm_subscriptions": True,
                    "attribs": {"couchers_user_id": user.id},
                    "status": "enabled",
                },
                timeout=10,
            )
            # the API returns if the user is already subscribed
            if r.status_code == 200 or r.status_code == 409:
                user.in_sync_with_newsletter = True
                session.commit()
            else:
                raise Exception("Failed to add users to mailing list")


add_users_to_email_list.PAYLOAD = empty_pb2.Empty
add_users_to_email_list.SCHEDULE = timedelta(hours=1)


def enforce_community_membership(payload: empty_pb2.Empty) -> None:
    tasks_enforce_community_memberships()


enforce_community_membership.PAYLOAD = empty_pb2.Empty
enforce_community_membership.SCHEDULE = timedelta(minutes=15)


def update_recommendation_scores(payload: empty_pb2.Empty) -> None:
    text_fields = [
        User.hometown,
        User.occupation,
        User.education,
        User.about_me,
        User.things_i_like,
        User.about_place,
        User.additional_information,
        User.pet_details,
        User.kid_details,
        User.housemate_details,
        User.other_host_info,
        User.sleeping_details,
        User.area,
        User.house_rules,
    ]
    home_fields = [User.about_place, User.other_host_info, User.sleeping_details, User.area, User.house_rules]

    def poor_man_gaussian():
        """
        Produces an approximatley std normal random variate
        """
        trials = 5
        return (sum([func.random() for _ in range(trials)]) - trials / 2) / sqrt(trials / 12)

    def int_(stmt):
        return func.coalesce(cast(stmt, Integer), 0)

    def float_(stmt):
        return func.coalesce(cast(stmt, Float), 0.0)

    with session_scope() as session:
        # profile
        profile_text = ""
        for field in text_fields:
            profile_text += func.coalesce(field, "")
        text_length = func.length(profile_text)
        home_text = ""
        for field in home_fields:
            home_text += func.coalesce(field, "")
        home_length = func.length(home_text)

        filled_profile = int_(User.has_completed_profile)
        has_text = int_(text_length > 500)
        long_text = int_(text_length > 2000)
        can_host = int_(User.hosting_status == HostingStatus.can_host)
        may_host = int_(User.hosting_status == HostingStatus.maybe)
        cant_host = int_(User.hosting_status == HostingStatus.cant_host)
        filled_home = int_(User.has_completed_my_home)
        filled_home_lots = int_(home_length > 200)
        hosting_status_points = 5 * can_host - 5 * may_host - 10 * cant_host
        profile_points = 5 * filled_profile + 2 * has_text + 3 * long_text + 5 * filled_home + 10 * filled_home_lots

        # references
        left_ref_expr = int_(1).label("left_reference")
        left_refs_subquery = (
            select(Reference.from_user_id.label("user_id"), left_ref_expr).group_by(Reference.from_user_id).subquery()
        )
        left_reference = int_(left_refs_subquery.c.left_reference)
        has_reference_expr = int_(func.count(Reference.id) >= 1).label("has_reference")
        ref_count_expr = int_(func.count(Reference.id)).label("ref_count")
        ref_avg_expr = func.avg(1.4 * (Reference.rating - 0.3)).label("ref_avg")
        has_multiple_types_expr = int_(func.count(distinct(Reference.reference_type)) >= 2).label("has_multiple_types")
        has_bad_ref_expr = int_(func.sum(int_((Reference.rating <= 0.2) | (~Reference.was_appropriate))) >= 1).label(
            "has_bad_ref"
        )
        received_ref_subquery = (
            select(
                Reference.to_user_id.label("user_id"),
                has_reference_expr,
                has_multiple_types_expr,
                has_bad_ref_expr,
                ref_count_expr,
                ref_avg_expr,
            )
            .group_by(Reference.to_user_id)
            .subquery()
        )
        has_multiple_types = int_(received_ref_subquery.c.has_multiple_types)
        has_reference = int_(received_ref_subquery.c.has_reference)
        has_bad_reference = int_(received_ref_subquery.c.has_bad_ref)
        rating_score = float_(
            received_ref_subquery.c.ref_avg
            * (
                2 * func.least(received_ref_subquery.c.ref_count, 5)
                + func.greatest(received_ref_subquery.c.ref_count - 5, 0)
            )
        )
        ref_score = 2 * has_reference + has_multiple_types + left_reference - 5 * has_bad_reference + rating_score

        # activeness
        recently_active = int_(User.last_active >= now() - timedelta(days=180))
        very_recently_active = int_(User.last_active >= now() - timedelta(days=14))
        recently_messaged = int_(func.max(Message.time) > now() - timedelta(days=14))
        messaged_lots = int_(func.count(Message.id) > 5)
        messaging_points_subquery = (recently_messaged + messaged_lots).label("messaging_points")
        messaging_subquery = (
            select(Message.author_id.label("user_id"), messaging_points_subquery)
            .where(Message.message_type == MessageType.text)
            .group_by(Message.author_id)
            .subquery()
        )
        activeness_points = recently_active + 2 * very_recently_active + int_(messaging_subquery.c.messaging_points)

        # verification
        cb_subquery = (
            select(ClusterSubscription.user_id.label("user_id"), func.min(Cluster.parent_node_id).label("min_node_id"))
            .join(Cluster, Cluster.id == ClusterSubscription.cluster_id)
            .where(ClusterSubscription.role == ClusterRole.admin)
            .where(Cluster.is_official_cluster)
            .group_by(ClusterSubscription.user_id)
            .subquery()
        )
        min_node_id = cb_subquery.c.min_node_id
        cb = int_(min_node_id >= 1)
        wcb = int_(min_node_id == 1)
        badge_points = {
            "founder": 100,
            "board_member": 20,
            "past_board_member": 5,
            "strong_verification": 3,
            "volunteer": 3,
            "past_volunteer": 2,
            "donor": 1,
            "phone_verified": 1,
        }

        badge_subquery = (
            select(
                UserBadge.user_id.label("user_id"),
                func.sum(case(badge_points, value=UserBadge.badge_id, else_=0)).label("badge_points"),
            )
            .group_by(UserBadge.user_id)
            .subquery()
        )

        other_points = 0.0 + 10 * wcb + 5 * cb + int_(badge_subquery.c.badge_points)

        # response rate
        hr_subquery = select(
            UserResponseRate.user_id,
            float_(extract("epoch", UserResponseRate.response_time_33p) / 60.0).label("response_time_33p"),
            float_(extract("epoch", UserResponseRate.response_time_66p) / 60.0).label("response_time_66p"),
        ).subquery()
        response_time_33p = hr_subquery.c.response_time_33p
        response_time_66p = hr_subquery.c.response_time_66p
        # be careful with nulls
        response_rate_points = -10 * int_(response_time_33p > 60 * 96.0) + 5 * int_(response_time_66p < 60 * 96.0)

        recommendation_score = (
            hosting_status_points
            + profile_points
            + ref_score
            + activeness_points
            + other_points
            + response_rate_points
            + 2 * poor_man_gaussian()
        )

        scores = (
            select(User.id.label("user_id"), recommendation_score.label("score"))
            .outerjoin(messaging_subquery, messaging_subquery.c.user_id == User.id)
            .outerjoin(left_refs_subquery, left_refs_subquery.c.user_id == User.id)
            .outerjoin(badge_subquery, badge_subquery.c.user_id == User.id)
            .outerjoin(received_ref_subquery, received_ref_subquery.c.user_id == User.id)
            .outerjoin(cb_subquery, cb_subquery.c.user_id == User.id)
            .outerjoin(hr_subquery, hr_subquery.c.user_id == User.id)
        ).subquery()

        session.execute(
            User.__table__.update().values(recommendation_score=scores.c.score).where(User.id == scores.c.user_id)
        )

    logger.info("Updated recommendation scores")


update_recommendation_scores.PAYLOAD = empty_pb2.Empty
update_recommendation_scores.SCHEDULE = timedelta(hours=24)


def update_badges(payload: empty_pb2.Empty) -> None:
    with session_scope() as session:

        def update_badge(badge_id: str, members: list[int]) -> None:
            badge = get_badge_dict()[badge_id]
            user_ids = session.execute(select(UserBadge.user_id).where(UserBadge.badge_id == badge_id)).scalars().all()
            # in case the user ids don't exist in the db
            actual_members = session.execute(select(User.id).where(User.id.in_(members))).scalars().all()
            # we should add the badge to these
            add = set(actual_members) - set(user_ids)
            # we should remove the badge from these
            remove = set(user_ids) - set(actual_members)
            for user_id in add:
                user_add_badge(session, user_id, badge_id)

            for user_id in remove:
                user_remove_badge(session, user_id, badge_id)

        update_badge("founder", get_static_badge_dict()["founder"])
        update_badge("board_member", get_static_badge_dict()["board_member"])
        update_badge("past_board_member", get_static_badge_dict()["past_board_member"])
        update_badge(
            "donor", session.execute(select(User.id).join(Invoice, Invoice.user_id == User.id)).scalars().all()
        )
        update_badge("moderator", session.execute(select(User.id).where(User.is_superuser)).scalars().all())
        update_badge("phone_verified", session.execute(select(User.id).where(User.phone_is_verified)).scalars().all())
        # strong verification requires passport on file + gender/sex correspondence and date of birth match
        update_badge(
            "strong_verification",
            session.execute(
                select(User.id)
                .join(StrongVerificationAttempt, StrongVerificationAttempt.user_id == User.id)
                .where(StrongVerificationAttempt.has_strong_verification(User))
            )
            .scalars()
            .all(),
        )


update_badges.PAYLOAD = empty_pb2.Empty
update_badges.SCHEDULE = timedelta(minutes=15)


def finalize_strong_verification(payload: "jobs_pb2.FinalizeStrongVerificationPayload") -> None:
    with session_scope() as session:
        verification_attempt = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.id == payload.verification_attempt_id)
            .where(StrongVerificationAttempt.status == StrongVerificationAttemptStatus.in_progress_waiting_on_backend)
        ).scalar_one()
        response = requests.post(
            "https://passportreader.app/api/v1/session.get",
            auth=(config["IRIS_ID_PUBKEY"], config["IRIS_ID_SECRET"]),
            json={"id": verification_attempt.iris_session_id},
            timeout=10,
            verify="/etc/ssl/certs/ca-certificates.crt",
        )
        if response.status_code != 200:
            raise Exception(f"Iris didn't return 200: {response.text}")
        json_data = response.json()
        reference_payload = verification_pb2.VerificationReferencePayload.FromString(
            simple_decrypt("iris_callback", b64decode(json_data["reference"]))
        )
        assert verification_attempt.user_id == reference_payload.user_id
        assert verification_attempt.verification_attempt_token == reference_payload.verification_attempt_token
        assert verification_attempt.iris_session_id == json_data["id"]
        assert json_data["state"] == "APPROVED"

        if json_data["document_type"] != "PASSPORT":
            verification_attempt.status = StrongVerificationAttemptStatus.failed
            notify(
                session,
                user_id=verification_attempt.user_id,
                topic_action="verification:sv_fail",
                data=notification_data_pb2.VerificationSVFail(
                    reason=notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT
                ),
            )
            return

        assert json_data["document_type"] == "PASSPORT"

        expiry_date = date.fromisoformat(json_data["expiry_date"])
        nationality = json_data["nationality"]
        last_three_document_chars = json_data["document_number"][-3:]

        existing_attempt = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.passport_expiry_date == expiry_date)
            .where(StrongVerificationAttempt.passport_nationality == nationality)
            .where(StrongVerificationAttempt.passport_last_three_document_chars == last_three_document_chars)
            .order_by(StrongVerificationAttempt.id)
            .limit(1)
        ).scalar_one_or_none()

        verification_attempt.has_minimal_data = True
        verification_attempt.passport_expiry_date = expiry_date
        verification_attempt.passport_nationality = nationality
        verification_attempt.passport_last_three_document_chars = last_three_document_chars

        if existing_attempt:
            verification_attempt.status = StrongVerificationAttemptStatus.duplicate

            if existing_attempt.user_id != verification_attempt.user_id:
                session.flush()
                send_duplicate_strong_verification_email(session, existing_attempt, verification_attempt)

            notify(
                session,
                user_id=verification_attempt.user_id,
                topic_action="verification:sv_fail",
                data=notification_data_pb2.VerificationSVFail(reason=notification_data_pb2.SV_FAIL_REASON_DUPLICATE),
            )
            return

        verification_attempt.has_full_data = True
        verification_attempt.passport_encrypted_data = asym_encrypt(
            config["VERIFICATION_DATA_PUBLIC_KEY"], response.text.encode("utf8")
        )
        verification_attempt.passport_date_of_birth = date.fromisoformat(json_data["date_of_birth"])
        verification_attempt.passport_sex = PassportSex[json_data["sex"].lower()]
        verification_attempt.status = StrongVerificationAttemptStatus.succeeded

        session.flush()

        strong_verification_completions_counter.inc()

        user = verification_attempt.user
        if verification_attempt.has_strong_verification(user):
            badge_id = "strong_verification"
            if session.execute(
                select(UserBadge).where(UserBadge.user_id == user.id, UserBadge.badge_id == badge_id)
            ).scalar_one_or_none():
                return

            user_add_badge(session, user.id, badge_id, do_notify=False)
            notify(session, user_id=verification_attempt.user_id, topic_action="verification:sv_success")
        else:
            notify(
                session,
                user_id=verification_attempt.user_id,
                topic_action="verification:sv_fail",
                data=notification_data_pb2.VerificationSVFail(
                    reason=notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER
                ),
            )


finalize_strong_verification.PAYLOAD = jobs_pb2.FinalizeStrongVerificationPayload


def send_activeness_probes(payload: empty_pb2.Empty) -> None:
    with session_scope() as session:
        ## Step 1: create new activeness probes for those who need it and don't have one (if enabled)

        if config["ACTIVENESS_PROBES_ENABLED"]:
            # current activeness probes
            subquery = select(ActivenessProbe.user_id).where(ActivenessProbe.responded == None).subquery()

            # users who we should send an activeness probe to
            new_probe_user_ids = (
                session.execute(
                    select(User.id)
                    .where(User.is_visible)
                    .where(User.hosting_status == HostingStatus.can_host)
                    .where(User.last_active < func.now() - ACTIVENESS_PROBE_INACTIVITY_PERIOD)
                    .where(User.id.not_in(select(subquery.c.user_id)))
                )
                .scalars()
                .all()
            )

            total_users = session.execute(select(func.count()).select_from(User).where(User.is_visible)).scalar_one()
            probes_today = session.execute(
                select(func.count())
                .select_from(ActivenessProbe)
                .where(func.now() - ActivenessProbe.probe_initiated < timedelta(hours=24))
            ).scalar_one()

            # send probes to max 2% of users per day
            max_probes_per_day = 0.02 * total_users
            max_probe_size = int(max(min(max_probes_per_day - probes_today, max_probes_per_day / 24), 1))

            if len(new_probe_user_ids) > max_probe_size:
                new_probe_user_ids = sample(new_probe_user_ids, max_probe_size)

            for user_id in new_probe_user_ids:
                session.add(ActivenessProbe(user_id=user_id))

            session.commit()

        ## Step 2: actually send out probe notifications
        for probe_number_minus_1, delay in enumerate(ACTIVENESS_PROBE_TIME_REMINDERS):
            probes = (
                session.execute(
                    select(ActivenessProbe)
                    .where(ActivenessProbe.notifications_sent == probe_number_minus_1)
                    .where(ActivenessProbe.probe_initiated + delay < func.now())
                    .where(ActivenessProbe.is_pending)
                )
                .scalars()
                .all()
            )

            for probe in probes:
                probe.notifications_sent = probe_number_minus_1 + 1
                context = make_background_user_context(user_id=probe.user.id)
                notify(
                    session,
                    user_id=probe.user.id,
                    topic_action="activeness:probe",
                    key=probe.id,
                    data=notification_data_pb2.ActivenessProbe(
                        reminder_number=probe_number_minus_1 + 1,
                        deadline=Timestamp_from_datetime(probe.probe_initiated + ACTIVENESS_PROBE_EXPIRY_TIME),
                    ),
                )
                session.commit()

        ## Step 3: for those who haven't responded, mark them as failed
        expired_probes = (
            session.execute(
                select(ActivenessProbe)
                .where(ActivenessProbe.notifications_sent == len(ACTIVENESS_PROBE_TIME_REMINDERS))
                .where(ActivenessProbe.is_pending)
                .where(ActivenessProbe.probe_initiated + ACTIVENESS_PROBE_EXPIRY_TIME < func.now())
            )
            .scalars()
            .all()
        )

        for probe in expired_probes:
            probe.responded = now()
            probe.response = ActivenessProbeStatus.expired
            if probe.user.hosting_status == HostingStatus.can_host:
                probe.user.hosting_status = HostingStatus.maybe
            if probe.user.meetup_status == MeetupStatus.wants_to_meetup:
                probe.user.meetup_status = MeetupStatus.open_to_meetup
            session.commit()


send_activeness_probes.PAYLOAD = empty_pb2.Empty
send_activeness_probes.SCHEDULE = timedelta(minutes=60)


def update_randomized_locations(payload: empty_pb2.Empty) -> None:
    """
    We generate for each user a randomized location as follows:
    - Start from a strong random seed (based on the SECRET env var and our key derivation function)
    - For each user, mix in the user_id for randomness
    - Generate a radius from [0.02, 0.1] degrees (about 2-10km)
    - Generate an angle from [0, 360]
    - Randomized location is then a distance `radius` away at an angle `angle` from `geom`
    """
    randomization_secret = get_secret(USER_LOCATION_RANDOMIZATION_NAME)

    def gen_randomized_coords(user_id: int, lat: float, lng: float) -> tuple[float, float]:
        radius_u = stable_secure_uniform(randomization_secret, seed=bytes(f"{user_id}|radius", "ascii"))
        angle_u = stable_secure_uniform(randomization_secret, seed=bytes(f"{user_id}|angle", "ascii"))
        radius = 0.02 + 0.08 * radius_u
        angle_rad = 2 * pi * angle_u
        offset_lng = radius * cos(angle_rad)
        offset_lat = radius * sin(angle_rad)
        return lat + offset_lat, lng + offset_lng

    user_updates: list[dict[str, Any]] = []

    with session_scope() as session:
        users_to_update = session.execute(select(User.id, User.geom).where(User.randomized_geom == None)).all()

        for user_id, geom in users_to_update:
            lat, lng = get_coordinates(geom)
            user_updates.append(
                {"id": user_id, "randomized_geom": create_coordinate(*gen_randomized_coords(user_id, lat, lng))}
            )

    with session_scope() as session:
        session.execute(update(User), user_updates)


update_randomized_locations.PAYLOAD = empty_pb2.Empty
update_randomized_locations.SCHEDULE = timedelta(hours=1)


def send_event_reminders(payload: empty_pb2.Empty) -> None:
    """
    Sends reminders for events that are 24 hours away to users who marked themselves as attending.
    """
    logger.info("Sending event reminder emails")

    with session_scope() as session:
        occurrences = (
            session.execute(
                select(EventOccurrence)
                .where(EventOccurrence.start_time <= now() + EVENT_REMINDER_TIMEDELTA)
                .where(EventOccurrence.start_time >= now())
            )
            .scalars()
            .all()
        )

        for occurrence in occurrences:
            results = session.execute(
                select(User, EventOccurrenceAttendee)
                .join(EventOccurrenceAttendee, EventOccurrenceAttendee.user_id == User.id)
                .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                .where(EventOccurrenceAttendee.reminder_sent == False)
            ).all()

            for user, attendee in results:
                context = make_background_user_context(user_id=user.id)

                notify(
                    session,
                    user_id=user.id,
                    topic_action="event:reminder",
                    data=notification_data_pb2.EventReminder(
                        event=event_to_pb(session, occurrence, context),
                        user=user_model_to_pb(user, session, context),
                    ),
                )

                attendee.reminder_sent = True
                session.commit()


send_event_reminders.PAYLOAD = empty_pb2.Empty
send_event_reminders.SCHEDULE = timedelta(hours=1)
