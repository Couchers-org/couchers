"""
Background job servicers
"""


import logging
from datetime import timedelta
from math import sqrt

import requests
from sqlalchemy import Integer
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, cast, delete, distinct, extract, func, literal, not_, or_, select, union_all
from sqlalchemy.sql.functions import percentile_disc

from couchers import config, email, urls
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.materialized_views import refresh_materialized_views
from couchers.models import (
    AccountDeletionToken,
    Cluster,
    ClusterEventAssociation,
    ClusterRole,
    ClusterSubscription,
    Event,
    Float,
    GroupChat,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    LoginToken,
    Message,
    MessageType,
    PasswordResetToken,
    Reference,
    User,
)
from couchers.notifications.background import handle_email_digests, handle_email_notifications, handle_notification
from couchers.notifications.notify import notify
from couchers.servicers.blocking import are_blocked
from couchers.sql import couchers_select as select
from couchers.tasks import (
    enforce_community_memberships,
    send_event_creation_email,
    send_onboarding_email,
    send_reference_reminder_email,
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
        session.execute(delete(LoginToken).where(~LoginToken.is_valid).execution_options(synchronize_session=False))


def process_purge_password_reset_tokens(payload):
    logger.info(f"Purging login tokens")
    with session_scope() as session:
        session.execute(
            delete(PasswordResetToken).where(~PasswordResetToken.is_valid).execution_options(synchronize_session=False)
        )


def process_purge_account_deletion_tokens(payload):
    logger.info(f"Purging account deletion tokens")
    with session_scope() as session:
        session.execute(
            delete(AccountDeletionToken)
            .where(~AccountDeletionToken.is_valid)
            .execution_options(synchronize_session=False)
        )


def process_generate_message_notifications(payload):
    """
    Generates notifications for a message sent to a group chat
    """
    logger.info(f"Sending out notifications for message_id = {payload.message_id}")

    with session_scope() as session:
        message, group_chat = session.execute(
            select(Message, GroupChat)
            .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
            .where(Message.id == payload.message_id)
        ).one()

        if message.message_type != MessageType.text:
            logger.info(f"Not a text message, not notifying. message_id = {payload.message_id}")
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

        for subscription in subscriptions:
            logger.info(f"Notifying user_id = {subscription.user_id}")
            notify(
                user_id=subscription.user_id,
                topic="chat",
                key=str(message.conversation_id),
                action="message",
                icon="message",
                title=f"{message.author.name} sent a message in {group_chat.title}",
                content=message.text,
                link=urls.chat_link(chat_id=message.conversation_id),
            )


def process_event_creation_emails(payload):
    """
    Sends out emails to all users subscribed to a newly created event's cluster.
    """
    logger.info(f"Sending out emails for event_id = {payload.event_id}")

    # don't send emails to global and regional events
    excluded_cluster_parent_node_ids = {
        "Global Community": 1,
    }
    # don't send emails to users more than max_radius away from an event if there are more than max_users subscribed
    max_users = 1000
    max_radius = 20000

    with session_scope() as session:
        event, cluster = session.execute(
            select(Event, Cluster)
            .join(ClusterEventAssociation, Event.id == ClusterEventAssociation.event_id)
            .join(Cluster, ClusterEventAssociation.cluster_id == Cluster.id)
            .where(Event.id == payload.event_id)
        ).one()

        creator = event.creator_user
        if not creator.has_completed_profile():
            # TODO: notify people once their profile is completed (maybe it makes more sense to just prevent
            # incomplete user profiles from even being able to create events though via frontend logic)
            logger.info(f"User {creator.name=} created event {event.name=} but has an incomplete profile.")
            return
        for community_name, node_id in excluded_cluster_parent_node_ids.items():
            if node_id == cluster.parent_node_id:
                logger.info(
                    f"Event {event.name=} was created in cluster {cluster.name=}, "
                    "which is too large a community for sending emails."
                )
                return
        if creator not in cluster.admins:
            logger.info(
                f"User {creator.name=} created event {event.name=} but is not an admin of cluster {cluster.name=}."
            )
            return

        users_subquery = session.execute(
            select(User)
            .join(ClusterSubscription, User.id == ClusterSubscription.user_id)
            .join(EventOccurrence, event.id == EventOccurrence.event_id)
            .where(ClusterSubscription.cluster_id == cluster.id)
        ).subquery()
        users = users_subquery.all()

        if len(users) > max_users:
            users = users_subquery.where(
                func.ST_Contains(func.ST_Buffer(EventOccurrence.geom, max_radius), User.geom)
            ).all()

        for user in users:
            if user.send_event_notifications:
                logger.info(
                    f"Sending email for event {event.name=} to subscriber {user.name=} of cluster {cluster.name=}"
                )
                send_event_creation_email(user, event)
            else:
                logger.info(
                    f"User {user.name=} has unsubscribed from event notifications, not sending email for event {event.name=}"
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
                    .where(not_(GroupChatSubscription.is_muted))
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


def process_handle_email_digests(payload):
    handle_email_digests()


def process_update_recommendation_scores(payload):
    text_fields = [
        User.hometown,
        User.occupation,
        User.education,
        User.about_me,
        User.my_travels,
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
        phone_verified = int_(User.phone_is_verified)
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
        f = int_(User.id <= 2)
        wcb = int_(min_node_id == 1)
        verification_points = 0.0 + 100 * f + 10 * wcb + 5 * cb

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
            + verification_points
            + response_rate_points
            + 2 * poor_man_gaussian()
        )

        scores = (
            select(User.id.label("user_id"), recommendation_score.label("score"))
            .outerjoin(messaging_subquery, messaging_subquery.c.user_id == User.id)
            .outerjoin(left_refs_subquery, left_refs_subquery.c.user_id == User.id)
            .outerjoin(received_ref_subquery, received_ref_subquery.c.user_id == User.id)
            .outerjoin(cb_subquery, cb_subquery.c.user_id == User.id)
            .outerjoin(hr_subquery, hr_subquery.c.user_id == User.id)
        ).subquery()

        session.execute(
            User.__table__.update().values(recommendation_score=scores.c.score).where(User.id == scores.c.user_id)
        )

    logger.info("Updated recommendation scores")


def process_refresh_materialized_views(payload):
    refresh_materialized_views()
