"""
Background job servicers
"""

import logging
from datetime import date, timedelta
from math import sqrt
from types import SimpleNamespace

import requests
from google.protobuf import empty_pb2
from sqlalchemy import Integer
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, case, cast, delete, distinct, extract, func, literal, not_, or_, select, union_all
from sqlalchemy.sql.functions import percentile_disc

from couchers.config import config
from couchers.crypto import asym_encrypt, b64decode, simple_decrypt
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.helpers.badges import user_add_badge, user_remove_badge
from couchers.materialized_views import refresh_materialized_views, refresh_materialized_views_rapid
from couchers.models import (
    AccountDeletionToken,
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Float,
    GroupChat,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    Invoice,
    LoginToken,
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
from couchers.resources import get_badge_dict, get_static_badge_dict
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import are_blocked
from couchers.servicers.conversations import generate_message_notifications
from couchers.servicers.events import (
    generate_event_cancel_notifications,
    generate_event_create_notifications,
    generate_event_delete_notifications,
    generate_event_update_notifications,
)
from couchers.servicers.requests import host_request_to_pb
from couchers.sql import couchers_select as select
from couchers.tasks import enforce_community_memberships as tasks_enforce_community_memberships
from couchers.utils import now
from proto import notification_data_pb2
from proto.internal import jobs_pb2, verification_pb2

logger = logging.getLogger(__name__)

# these were straight up imported
handle_notification.PAYLOAD = jobs_pb2.HandleNotificationPayload

send_raw_push_notification.PAYLOAD = jobs_pb2.SendRawPushNotificationPayload

handle_email_digests.PAYLOAD = empty_pb2.Empty
handle_email_digests.SCHEDULE = timedelta(minutes=15)

generate_message_notifications.PAYLOAD = jobs_pb2.GenerateMessageNotificationsPayload

generate_event_create_notifications.PAYLOAD = jobs_pb2.GenerateEventCreateNotificationsPayload

generate_event_update_notifications.PAYLOAD = jobs_pb2.GenerateEventUpdateNotificationsPayload

generate_event_cancel_notifications.PAYLOAD = jobs_pb2.GenerateEventCancelNotificationsPayload

generate_event_delete_notifications.PAYLOAD = jobs_pb2.GenerateEventDeleteNotificationsPayload


refresh_materialized_views.PAYLOAD = empty_pb2.Empty
refresh_materialized_views.SCHEDULE = timedelta(minutes=5)

refresh_materialized_views_rapid.PAYLOAD = empty_pb2.Empty
refresh_materialized_views_rapid.SCHEDULE = timedelta(seconds=30)


def send_email(payload):
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


def purge_login_tokens(payload):
    logger.info("Purging login tokens")
    with session_scope() as session:
        session.execute(delete(LoginToken).where(~LoginToken.is_valid).execution_options(synchronize_session=False))


purge_login_tokens.PAYLOAD = empty_pb2.Empty
purge_login_tokens.SCHEDULE = timedelta(hours=24)


def purge_password_reset_tokens(payload):
    logger.info("Purging login tokens")
    with session_scope() as session:
        session.execute(
            delete(PasswordResetToken).where(~PasswordResetToken.is_valid).execution_options(synchronize_session=False)
        )


purge_password_reset_tokens.PAYLOAD = empty_pb2.Empty
purge_password_reset_tokens.SCHEDULE = timedelta(hours=24)


def purge_account_deletion_tokens(payload):
    logger.info("Purging account deletion tokens")
    with session_scope() as session:
        session.execute(
            delete(AccountDeletionToken)
            .where(~AccountDeletionToken.is_valid)
            .execution_options(synchronize_session=False)
        )


purge_account_deletion_tokens.PAYLOAD = empty_pb2.Empty
purge_account_deletion_tokens.SCHEDULE = timedelta(hours=24)


def send_message_notifications(payload):
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

            user.last_notified_message_id = max(message.id for _, message, _ in unseen_messages)

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
                                SimpleNamespace(user_id=user.id),
                            ),
                            message=format_title(message, group_chat, count_unseen),
                            text=message.text,
                            group_chat_id=message.conversation_id,
                        )
                        for group_chat, message, count_unseen in unseen_messages
                    ],
                ),
            )
            session.commit()


send_message_notifications.PAYLOAD = empty_pb2.Empty
send_message_notifications.SCHEDULE = timedelta(minutes=3)


def send_request_notifications(payload):
    """
    Sends out email notifications for unseen messages in host requests (as surfer or host)
    """
    logger.info("Sending out email notifications for unseen messages in host requests")

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
            session.flush()

            context = SimpleNamespace(user_id=user.id)
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

            context = SimpleNamespace(user_id=user.id)
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


def send_onboarding_emails(payload):
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


def send_reference_reminders(payload):
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
                    context = SimpleNamespace(user_id=user.id)
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


def add_users_to_email_list(payload):
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
                auth=("listmonk", config["LISTMONK_API_KEY"]),
                json={
                    "email": user.email,
                    "name": user.name,
                    "list_uuids": [config["LISTMONK_LIST_UUID"]],
                    "preconfirm_subscriptions": True,
                    "attribs": {"couchers_user_id": user.id},
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


def enforce_community_membership(payload):
    tasks_enforce_community_memberships()


enforce_community_membership.PAYLOAD = empty_pb2.Empty
enforce_community_membership.SCHEDULE = timedelta(minutes=15)


def update_recommendation_scores(payload):
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

        has_text = int_(text_length > 500)
        long_text = int_(text_length > 2000)
        has_pic = int_(User.avatar_key != None)
        can_host = int_(User.hosting_status == HostingStatus.can_host)
        cant_host = int_(User.hosting_status == HostingStatus.cant_host)
        filled_home = int_(User.last_minute != None) * int_(home_length > 200)
        profile_points = 2 * has_text + 3 * long_text + 2 * has_pic + 3 * can_host + 2 * filled_home - 5 * cant_host

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
        t = (
            select(Message.conversation_id, Message.time)
            .where(Message.message_type == MessageType.chat_created)
            .subquery()
        )
        s = (
            select(Message.conversation_id, Message.author_id, func.min(Message.time).label("time"))
            .group_by(Message.conversation_id, Message.author_id)
            .subquery()
        )
        hr_subquery = (
            select(
                HostRequest.host_user_id.label("user_id"),
                func.avg(s.c.time - t.c.time).label("avg_response_time"),
                func.count(t.c.time).label("received"),
                func.count(s.c.time).label("responded"),
                float_(
                    extract(
                        "epoch",
                        percentile_disc(0.33).within_group(func.coalesce(s.c.time - t.c.time, timedelta(days=1000))),
                    )
                    / 60.0
                ).label("response_time_33p"),
                float_(
                    extract(
                        "epoch",
                        percentile_disc(0.66).within_group(func.coalesce(s.c.time - t.c.time, timedelta(days=1000))),
                    )
                    / 60.0
                ).label("response_time_66p"),
            )
            .join(t, t.c.conversation_id == HostRequest.conversation_id)
            .outerjoin(
                s, and_(s.c.conversation_id == HostRequest.conversation_id, s.c.author_id == HostRequest.host_user_id)
            )
            .group_by(HostRequest.host_user_id)
            .subquery()
        )
        avg_response_time = hr_subquery.c.avg_response_time
        avg_response_time_hr = float_(extract("epoch", avg_response_time) / 60.0)
        received = hr_subquery.c.received
        responded = hr_subquery.c.responded
        response_time_33p = hr_subquery.c.response_time_33p
        response_time_66p = hr_subquery.c.response_time_66p
        response_rate = float_(responded / (1.0 * func.greatest(received, 1)))
        # be careful with nulls
        response_rate_points = -10 * int_(response_time_33p > 60 * 48.0) + 5 * int_(response_time_66p < 60 * 48.0)

        recommendation_score = (
            profile_points
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


def update_badges(payload):
    with session_scope() as session:

        def update_badge(badge_id: str, members: list[int]):
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


def finalize_strong_verification(payload):
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
        assert json_data["document_type"] == "PASSPORT"
        verification_attempt.has_full_data = True
        verification_attempt.passport_encrypted_data = asym_encrypt(
            config["VERIFICATION_DATA_PUBLIC_KEY"], response.text.encode("utf8")
        )
        verification_attempt.passport_date_of_birth = date.fromisoformat(json_data["date_of_birth"])
        verification_attempt.passport_sex = PassportSex[json_data["sex"].lower()]
        verification_attempt.has_minimal_data = True
        verification_attempt.passport_expiry_date = date.fromisoformat(json_data["expiry_date"])
        verification_attempt.passport_nationality = json_data["nationality"]
        verification_attempt.passport_last_three_document_chars = json_data["document_number"][-3:]
        verification_attempt.status = StrongVerificationAttemptStatus.succeeded

        session.flush()

        user = verification_attempt.user
        if verification_attempt.has_strong_verification(user):
            badge_id = "strong_verification"
            if session.execute(
                select(UserBadge).where(UserBadge.user_id == user.id, UserBadge.badge_id == badge_id)
            ).scalar_one_or_none():
                return

            user_add_badge(session, user.id, badge_id)


finalize_strong_verification.PAYLOAD = jobs_pb2.FinalizeStrongVerificationPayload
