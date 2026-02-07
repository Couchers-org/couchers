import logging
from datetime import datetime, timedelta
from typing import Any, cast

import grpc
from google.protobuf import empty_pb2
from psycopg2.extras import DateTimeTZRange
from sqlalchemy import Select, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import and_, func, or_, update

from couchers.constants import GLOBAL_COMMUNITY_MAX_NODE_ID
from couchers.context import CouchersContext, make_background_user_context
from couchers.db import can_moderate_node, get_parent_node_at_location, session_scope
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    AttendeeStatus,
    Cluster,
    ClusterSubscription,
    Event,
    EventCommunityInviteRequest,
    EventOccurrence,
    EventOccurrenceAttendee,
    EventOrganizer,
    EventSubscription,
    Node,
    Thread,
    Upload,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import events_pb2, events_pb2_grpc, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import is_not_visible
from couchers.servicers.threads import thread_to_pb
from couchers.sql import users_visible, where_users_column_visible
from couchers.tasks import send_event_community_invite_request_email
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    dt_from_millis,
    millis_from_dt,
    not_none,
    now,
    to_aware_datetime,
)

logger = logging.getLogger(__name__)

attendancestate2sql = {
    events_pb2.AttendanceState.ATTENDANCE_STATE_NOT_GOING: None,
    events_pb2.AttendanceState.ATTENDANCE_STATE_GOING: AttendeeStatus.going,
    events_pb2.AttendanceState.ATTENDANCE_STATE_MAYBE: AttendeeStatus.maybe,
}

attendancestate2api = {
    None: events_pb2.AttendanceState.ATTENDANCE_STATE_NOT_GOING,
    AttendeeStatus.going: events_pb2.AttendanceState.ATTENDANCE_STATE_GOING,
    AttendeeStatus.maybe: events_pb2.AttendanceState.ATTENDANCE_STATE_MAYBE,
}

MAX_PAGINATION_LENGTH = 25


def _is_event_owner(event: Event, user_id: int) -> bool:
    """
    Checks whether the user can act as an owner of the event
    """
    if event.owner_user:
        return event.owner_user_id == user_id
    # otherwise owned by a cluster
    return not_none(event.owner_cluster).admins.where(User.id == user_id).one_or_none() is not None


def _is_event_organizer(event: Event, user_id: int) -> bool:
    """
    Checks whether the user is as an organizer of the event
    """
    return event.organizers.where(EventOrganizer.user_id == user_id).one_or_none() is not None


def _can_moderate_event(session: Session, event: Event, user_id: int) -> bool:
    # if the event is owned by a cluster, then any moderator of that cluster can moderate this event
    if event.owner_cluster is not None and can_moderate_node(session, user_id, event.owner_cluster.parent_node_id):
        return True

    # finally check if the user can moderate the parent node of the cluster
    return can_moderate_node(session, user_id, event.parent_node_id)


def _can_edit_event(session: Session, event: Event, user_id: int) -> bool:
    return (
        _is_event_owner(event, user_id)
        or _is_event_organizer(event, user_id)
        or _can_moderate_event(session, event, user_id)
    )


def event_to_pb(session: Session, occurrence: EventOccurrence, context: CouchersContext) -> events_pb2.Event:
    event = occurrence.event

    next_occurrence = (
        event.occurrences.where(EventOccurrence.end_time >= now())
        .order_by(EventOccurrence.end_time.asc())
        .limit(1)
        .one_or_none()
    )

    owner_community_id = None
    owner_group_id = None
    if event.owner_cluster:
        if event.owner_cluster.is_official_cluster:
            owner_community_id = event.owner_cluster.parent_node_id
        else:
            owner_group_id = event.owner_cluster.id

    attendance = occurrence.attendances.where(EventOccurrenceAttendee.user_id == context.user_id).one_or_none()
    attendance_state = attendance.attendee_status if attendance else None

    can_moderate = _can_moderate_event(session, event, context.user_id)
    can_edit = _can_edit_event(session, event, context.user_id)

    going_count = session.execute(
        where_users_column_visible(
            select(func.count())
            .select_from(EventOccurrenceAttendee)
            .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
            .where(EventOccurrenceAttendee.attendee_status == AttendeeStatus.going),
            context,
            EventOccurrenceAttendee.user_id,
        )
    ).scalar_one()
    maybe_count = session.execute(
        where_users_column_visible(
            select(func.count())
            .select_from(EventOccurrenceAttendee)
            .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
            .where(EventOccurrenceAttendee.attendee_status == AttendeeStatus.maybe),
            context,
            EventOccurrenceAttendee.user_id,
        )
    ).scalar_one()

    organizer_count = session.execute(
        where_users_column_visible(
            select(func.count()).select_from(EventOrganizer).where(EventOrganizer.event_id == event.id),
            context,
            EventOrganizer.user_id,
        )
    ).scalar_one()
    subscriber_count = session.execute(
        where_users_column_visible(
            select(func.count()).select_from(EventSubscription).where(EventSubscription.event_id == event.id),
            context,
            EventSubscription.user_id,
        )
    ).scalar_one()

    return events_pb2.Event(
        event_id=occurrence.id,
        is_next=False if not next_occurrence else occurrence.id == next_occurrence.id,
        is_cancelled=occurrence.is_cancelled,
        is_deleted=occurrence.is_deleted,
        title=event.title,
        slug=event.slug,
        content=occurrence.content,
        photo_url=occurrence.photo.full_url if occurrence.photo else None,
        photo_key=occurrence.photo_key or "",
        online_information=(
            events_pb2.OnlineEventInformation(
                link=occurrence.link,
            )
            if occurrence.link
            else None
        ),
        offline_information=(
            events_pb2.OfflineEventInformation(
                lat=not_none(occurrence.coordinates)[0],
                lng=not_none(occurrence.coordinates)[1],
                address=occurrence.address,
            )
            if occurrence.geom
            else None
        ),
        created=Timestamp_from_datetime(occurrence.created),
        last_edited=Timestamp_from_datetime(occurrence.last_edited),
        creator_user_id=occurrence.creator_user_id,
        start_time=Timestamp_from_datetime(occurrence.start_time),
        end_time=Timestamp_from_datetime(occurrence.end_time),
        timezone=occurrence.timezone,
        start_time_display=str(occurrence.start_time),
        end_time_display=str(occurrence.end_time),
        attendance_state=attendancestate2api[attendance_state],
        organizer=event.organizers.where(EventOrganizer.user_id == context.user_id).one_or_none() is not None,
        subscriber=event.subscribers.where(EventSubscription.user_id == context.user_id).one_or_none() is not None,
        going_count=going_count,
        maybe_count=maybe_count,
        organizer_count=organizer_count,
        subscriber_count=subscriber_count,
        owner_user_id=event.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread=thread_to_pb(session, event.thread_id),
        can_edit=can_edit,
        can_moderate=can_moderate,
    )


def _get_event_and_occurrence_query(occurrence_id: int, include_deleted: bool) -> Select[tuple[Event, EventOccurrence]]:
    query = (
        select(Event, EventOccurrence)
        .where(EventOccurrence.id == occurrence_id)
        .where(EventOccurrence.event_id == Event.id)
    )

    if not include_deleted:
        query = query.where(~EventOccurrence.is_deleted)

    return query


def _get_event_and_occurrence_one(
    session: Session, occurrence_id: int, include_deleted: bool = False
) -> tuple[Event, EventOccurrence]:
    result = session.execute(_get_event_and_occurrence_query(occurrence_id, include_deleted)).one()
    return result._tuple()


def _get_event_and_occurrence_one_or_none(
    session: Session, occurrence_id: int, include_deleted: bool = False
) -> tuple[Event, EventOccurrence] | None:
    result = session.execute(_get_event_and_occurrence_query(occurrence_id, include_deleted)).one_or_none()
    return result._tuple() if result else None


def _check_occurrence_time_validity(start_time: datetime, end_time: datetime, context: CouchersContext) -> None:
    if start_time < now():
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "event_in_past")
    if end_time < start_time:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "event_ends_before_starts")
    if end_time - start_time > timedelta(days=7):
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "event_too_long")
    if start_time - now() > timedelta(days=365):
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "event_too_far_in_future")


def get_users_to_notify_for_new_event(session: Session, occurrence: EventOccurrence) -> tuple[list[User], int | None]:
    """
    Returns the users to notify, as well as the community id that is being notified (None if based on geo search)
    """
    cluster = occurrence.event.parent_node.official_cluster
    if cluster.parent_node_id <= GLOBAL_COMMUNITY_MAX_NODE_ID:
        logger.info("The Global Community is too big for email notifications.")
        return [], occurrence.event.parent_node_id
    elif occurrence.creator_user in cluster.admins or cluster.is_leaf:
        return list(cluster.members.where(User.is_visible)), occurrence.event.parent_node_id
    else:
        max_radius = 20000  # m
        users = (
            session.execute(
                select(User)
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .where(User.is_visible)
                .where(ClusterSubscription.cluster_id == cluster.id)
                .where(func.ST_DWithin(User.geom, occurrence.geom, max_radius / 111111))
            )
            .scalars()
            .all()
        )
        return cast(tuple[list[User], int | None], (users, None))


def generate_event_create_notifications(payload: jobs_pb2.GenerateEventCreateNotificationsPayload) -> None:
    """
    Background job to generated/fan out event notifications
    """
    from couchers.servicers.communities import community_to_pb

    logger.info(f"Fanning out notifications for event occurrence id = {payload.occurrence_id}")

    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(session, occurrence_id=payload.occurrence_id)
        creator = occurrence.creator_user

        users, node_id = get_users_to_notify_for_new_event(session, occurrence)

        inviting_user = session.execute(select(User).where(User.id == payload.inviting_user_id)).scalar_one_or_none()

        if not inviting_user:
            logger.error(f"Inviting user {payload.inviting_user_id} is gone while trying to send event notification?")
            return

        for user in users:
            if is_not_visible(session, user.id, creator.id):
                continue
            context = make_background_user_context(user_id=user.id)
            topic_action = (
                NotificationTopicAction.event__create_approved
                if payload.approved
                else NotificationTopicAction.event__create_any
            )
            notify(
                session,
                user_id=user.id,
                topic_action=topic_action,
                key=str(payload.occurrence_id),
                data=notification_data_pb2.EventCreate(
                    event=event_to_pb(session, occurrence, context),
                    inviting_user=user_model_to_pb(inviting_user, session, context),
                    nearby=True if node_id is None else None,
                    in_community=community_to_pb(session, event.parent_node, context) if node_id is not None else None,
                ),
            )


def generate_event_update_notifications(payload: jobs_pb2.GenerateEventUpdateNotificationsPayload) -> None:
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(session, occurrence_id=payload.occurrence_id)

        updating_user = session.execute(select(User).where(User.id == payload.updating_user_id)).scalar_one()

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            if is_not_visible(session, user_id, updating_user.id):
                continue
            context = make_background_user_context(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action=NotificationTopicAction.event__update,
                key=str(payload.occurrence_id),
                data=notification_data_pb2.EventUpdate(
                    event=event_to_pb(session, occurrence, context),
                    updating_user=user_model_to_pb(updating_user, session, context),
                    updated_items=payload.updated_items,
                ),
            )


def generate_event_cancel_notifications(payload: jobs_pb2.GenerateEventCancelNotificationsPayload) -> None:
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(session, occurrence_id=payload.occurrence_id)

        cancelling_user = session.execute(select(User).where(User.id == payload.cancelling_user_id)).scalar_one()

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            if is_not_visible(session, user_id, cancelling_user.id):
                continue
            context = make_background_user_context(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action=NotificationTopicAction.event__cancel,
                key=str(payload.occurrence_id),
                data=notification_data_pb2.EventCancel(
                    event=event_to_pb(session, occurrence, context),
                    cancelling_user=user_model_to_pb(cancelling_user, session, context),
                ),
            )


def generate_event_delete_notifications(payload: jobs_pb2.GenerateEventDeleteNotificationsPayload) -> None:
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(
            session, occurrence_id=payload.occurrence_id, include_deleted=True
        )

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            context = make_background_user_context(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action=NotificationTopicAction.event__delete,
                key=str(payload.occurrence_id),
                data=notification_data_pb2.EventDelete(
                    event=event_to_pb(session, occurrence, context),
                ),
            )


class Events(events_pb2_grpc.EventsServicer):
    def CreateEvent(
        self, request: events_pb2.CreateEventReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not has_completed_profile(session, user):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_create_event")
        if not request.title:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_title")
        if not request.content:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_content")
        if request.HasField("online_information"):
            online = True
            geom = None
            address = None
            if not request.online_information.link:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "online_event_requires_link")
            link = request.online_information.link
        elif request.HasField("offline_information"):
            online = False
            # As protobuf parses a missing value as 0.0, this is not a permitted event coordinate value
            if not (
                request.offline_information.address
                and request.offline_information.lat
                and request.offline_information.lng
            ):
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_address_or_location")
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")
            geom = create_coordinate(request.offline_information.lat, request.offline_information.lng)
            address = request.offline_information.address
            link = None
        else:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_address_location_or_link")

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        _check_occurrence_time_validity(start_time, end_time, context)

        if request.parent_community_id:
            parent_node = session.execute(
                select(Node).where(Node.id == request.parent_community_id)
            ).scalar_one_or_none()

            if not parent_node or not parent_node.official_cluster.events_enabled:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "events_not_enabled")
        else:
            if online:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "online_event_missing_parent_community")
            # parent community computed from geom
            parent_node = get_parent_node_at_location(session, not_none(geom))

        if not parent_node:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "community_not_found")

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "photo_not_found")

        thread = Thread()
        session.add(thread)
        session.flush()

        event = Event(
            title=request.title,
            parent_node_id=parent_node.id,
            owner_user_id=context.user_id,
            thread_id=thread.id,
            creator_user_id=context.user_id,
        )
        session.add(event)
        session.flush()

        occurrence = EventOccurrence(
            event_id=event.id,
            content=request.content,
            geom=geom,
            address=address,
            link=link,
            photo_key=request.photo_key if request.photo_key != "" else None,
            # timezone=timezone,
            during=DateTimeTZRange(start_time, end_time),
            creator_user_id=context.user_id,
        )
        session.add(occurrence)
        session.flush()

        session.add(
            EventOrganizer(
                user_id=context.user_id,
                event_id=event.id,
            )
        )

        session.add(
            EventSubscription(
                user_id=context.user_id,
                event_id=event.id,
            )
        )

        session.add(
            EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence_id=occurrence.id,
                attendee_status=AttendeeStatus.going,
            )
        )

        session.commit()

        log_event(
            context,
            session,
            "event.created",
            {
                "event_id": event.id,
                "occurrence_id": occurrence.id,
                "parent_community_id": parent_node.id,
                "parent_community_name": parent_node.official_cluster.name,
                "online": online,
            },
        )

        if has_completed_profile(session, user):
            queue_job(
                session,
                job=generate_event_create_notifications,
                payload=jobs_pb2.GenerateEventCreateNotificationsPayload(
                    inviting_user_id=user.id,
                    occurrence_id=occurrence.id,
                    approved=False,
                ),
            )

        return event_to_pb(session, occurrence, context)

    def ScheduleEvent(
        self, request: events_pb2.ScheduleEventReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        if not request.content:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_content")
        if request.HasField("online_information"):
            geom = None
            address = None
            link = request.online_information.link
        elif request.HasField("offline_information"):
            if not (
                request.offline_information.address
                and request.offline_information.lat
                and request.offline_information.lng
            ):
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_address_or_location")
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")
            geom = create_coordinate(request.offline_information.lat, request.offline_information.lng)
            address = request.offline_information.address
            link = None
        else:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_event_address_location_or_link")

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        _check_occurrence_time_validity(start_time, end_time, context)

        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_edit_permission_denied")

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "photo_not_found")

        during = DateTimeTZRange(start_time, end_time)

        # && is the overlap operator for ranges
        if (
            session.execute(
                select(EventOccurrence.id)
                .where(EventOccurrence.event_id == event.id)
                .where(EventOccurrence.during.op("&&")(during))
                .limit(1)
            )
            .scalars()
            .one_or_none()
            is not None
        ):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_overlap")

        occurrence = EventOccurrence(
            event_id=event.id,
            content=request.content,
            geom=geom,
            address=address,
            link=link,
            photo_key=request.photo_key if request.photo_key != "" else None,
            # timezone=timezone,
            during=during,
            creator_user_id=context.user_id,
        )
        session.add(occurrence)
        session.flush()

        session.add(
            EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence_id=occurrence.id,
                attendee_status=AttendeeStatus.going,
            )
        )

        session.flush()

        # TODO: notify

        return event_to_pb(session, occurrence, context)

    def UpdateEvent(
        self, request: events_pb2.UpdateEventReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_edit_permission_denied")

        # the things that were updated and need to be notified about
        notify_updated = []

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        occurrence_update: dict[str, Any] = {"last_edited": now()}

        if request.HasField("title"):
            notify_updated.append("title")
            event.title = request.title.value

        if request.HasField("content"):
            notify_updated.append("content")
            occurrence_update["content"] = request.content.value

        if request.HasField("photo_key"):
            occurrence_update["photo_key"] = request.photo_key.value

        if request.HasField("online_information"):
            notify_updated.append("location")
            if not request.online_information.link:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "online_event_requires_link")
            occurrence_update["link"] = request.online_information.link
            occurrence_update["geom"] = None
            occurrence_update["address"] = None
        elif request.HasField("offline_information"):
            notify_updated.append("location")
            occurrence_update["link"] = None
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")
            occurrence_update["geom"] = create_coordinate(
                request.offline_information.lat, request.offline_information.lng
            )
            occurrence_update["address"] = request.offline_information.address

        if request.HasField("start_time") or request.HasField("end_time"):
            if request.update_all_future:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "event_cant_update_all_times")
            if request.HasField("start_time"):
                notify_updated.append("start time")
                start_time = to_aware_datetime(request.start_time)
            else:
                start_time = occurrence.start_time
            if request.HasField("end_time"):
                notify_updated.append("end time")
                end_time = to_aware_datetime(request.end_time)
            else:
                end_time = occurrence.end_time

            _check_occurrence_time_validity(start_time, end_time, context)

            during = DateTimeTZRange(start_time, end_time)

            # && is the overlap operator for ranges
            if (
                session.execute(
                    select(EventOccurrence.id)
                    .where(EventOccurrence.event_id == event.id)
                    .where(EventOccurrence.id != occurrence.id)
                    .where(EventOccurrence.during.op("&&")(during))
                    .limit(1)
                )
                .scalars()
                .one_or_none()
                is not None
            ):
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_overlap")

            occurrence_update["during"] = during

        # TODO
        # if request.HasField("timezone"):
        #     occurrence_update["timezone"] = request.timezone

        # allow editing any event which hasn't ended more than 24 hours before now
        # when editing all future events, we edit all which have not yet ended

        cutoff_time = now() - timedelta(hours=24)
        if request.update_all_future:
            session.execute(
                update(EventOccurrence)
                .where(EventOccurrence.end_time >= cutoff_time)
                .where(EventOccurrence.start_time >= occurrence.start_time)
                .values(occurrence_update)
                .execution_options(synchronize_session=False)
            )
        else:
            if occurrence.end_time < cutoff_time:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")
            session.execute(
                update(EventOccurrence)
                .where(EventOccurrence.end_time >= cutoff_time)
                .where(EventOccurrence.id == occurrence.id)
                .values(occurrence_update)
                .execution_options(synchronize_session=False)
            )

        session.flush()

        if notify_updated:
            if request.should_notify:
                logger.info(f"Fields {','.join(notify_updated)} updated in event {event.id=}, notifying")

                queue_job(
                    session,
                    job=generate_event_update_notifications,
                    payload=jobs_pb2.GenerateEventUpdateNotificationsPayload(
                        updating_user_id=user.id,
                        occurrence_id=occurrence.id,
                        updated_items=notify_updated,
                    ),
                )
            else:
                logger.info(
                    f"Fields {','.join(notify_updated)} updated in event {event.id=}, but skipping notifications"
                )

        # since we have synchronize_session=False, we have to refresh the object
        session.refresh(occurrence)

        return event_to_pb(session, occurrence, context)

    def GetEvent(self, request: events_pb2.GetEventReq, context: CouchersContext, session: Session) -> events_pb2.Event:
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()

        if not occurrence:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        return event_to_pb(session, occurrence, context)

    def CancelEvent(
        self, request: events_pb2.CancelEventReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_edit_permission_denied")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_cancel_old_event")

        occurrence.is_cancelled = True

        log_event(context, session, "event.cancelled", {"event_id": event.id, "occurrence_id": occurrence.id})

        queue_job(
            session,
            job=generate_event_cancel_notifications,
            payload=jobs_pb2.GenerateEventCancelNotificationsPayload(
                cancelling_user_id=context.user_id,
                occurrence_id=occurrence.id,
            ),
        )

        return empty_pb2.Empty()

    def RequestCommunityInvite(
        self, request: events_pb2.RequestCommunityInviteReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_edit_permission_denied")

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        this_user_reqs = [req for req in occurrence.community_invite_requests if req.user_id == context.user_id]

        if len(this_user_reqs) > 0:
            context.abort_with_error_code(
                grpc.StatusCode.FAILED_PRECONDITION, "event_community_invite_already_requested"
            )

        approved_reqs = [req for req in occurrence.community_invite_requests if req.approved]

        if len(approved_reqs) > 0:
            context.abort_with_error_code(
                grpc.StatusCode.FAILED_PRECONDITION, "event_community_invite_already_approved"
            )

        req = EventCommunityInviteRequest(
            occurrence_id=request.event_id,
            user_id=context.user_id,
        )
        session.add(req)
        session.flush()

        send_event_community_invite_request_email(session, req)

        return empty_pb2.Empty()

    def ListEventOccurrences(
        self, request: events_pb2.ListEventOccurrencesReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListEventOccurrencesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()
        if not occurrence:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        query = select(EventOccurrence).where(EventOccurrence.event_id == Event.id).where(~EventOccurrence.is_deleted)

        if not request.include_cancelled:
            query = query.where(~EventOccurrence.is_cancelled)

        if not request.past:
            cutoff = page_token - timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time > cutoff).order_by(EventOccurrence.start_time.asc())
        else:
            cutoff = page_token + timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time < cutoff).order_by(EventOccurrence.start_time.desc())

        query = query.limit(page_size + 1)
        occurrences = session.execute(query).scalars().all()

        return events_pb2.ListEventOccurrencesRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
        )

    def ListEventAttendees(
        self, request: events_pb2.ListEventAttendeesReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListEventAttendeesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()
        if not occurrence:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")
        attendees = (
            session.execute(
                where_users_column_visible(
                    select(EventOccurrenceAttendee)
                    .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                    .where(EventOccurrenceAttendee.user_id >= next_user_id)
                    .order_by(EventOccurrenceAttendee.user_id)
                    .limit(page_size + 1),
                    context,
                    EventOccurrenceAttendee.user_id,
                )
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventAttendeesRes(
            attendee_user_ids=[attendee.user_id for attendee in attendees[:page_size]],
            next_page_token=str(attendees[-1].user_id) if len(attendees) > page_size else None,
        )

    def ListEventSubscribers(
        self, request: events_pb2.ListEventSubscribersReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListEventSubscribersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")
        event, occurrence = res
        subscribers = (
            session.execute(
                where_users_column_visible(
                    select(EventSubscription)
                    .where(EventSubscription.event_id == event.id)
                    .where(EventSubscription.user_id >= next_user_id)
                    .order_by(EventSubscription.user_id)
                    .limit(page_size + 1),
                    context,
                    EventSubscription.user_id,
                )
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventSubscribersRes(
            subscriber_user_ids=[subscriber.user_id for subscriber in subscribers[:page_size]],
            next_page_token=str(subscribers[-1].user_id) if len(subscribers) > page_size else None,
        )

    def ListEventOrganizers(
        self, request: events_pb2.ListEventOrganizersReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListEventOrganizersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")
        event, occurrence = res
        organizers = (
            session.execute(
                where_users_column_visible(
                    select(EventOrganizer)
                    .where(EventOrganizer.event_id == event.id)
                    .where(EventOrganizer.user_id >= next_user_id)
                    .order_by(EventOrganizer.user_id)
                    .limit(page_size + 1),
                    context,
                    EventOrganizer.user_id,
                )
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventOrganizersRes(
            organizer_user_ids=[organizer.user_id for organizer in organizers[:page_size]],
            next_page_token=str(organizers[-1].user_id) if len(organizers) > page_size else None,
        )

    def TransferEvent(
        self, request: events_pb2.TransferEventReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_transfer_permission_denied")

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        if request.WhichOneof("new_owner") == "new_owner_group_id":
            cluster = session.execute(
                select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.new_owner_group_id)
            ).scalar_one_or_none()
        elif request.WhichOneof("new_owner") == "new_owner_community_id":
            cluster = session.execute(
                select(Cluster)
                .where(Cluster.parent_node_id == request.new_owner_community_id)
                .where(Cluster.is_official_cluster)
            ).scalar_one_or_none()

        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_or_community_not_found")

        event.owner_user = None
        event.owner_cluster = cluster

        session.commit()
        return event_to_pb(session, occurrence, context)

    def SetEventSubscription(
        self, request: events_pb2.SetEventSubscriptionReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        current_subscription = session.execute(
            select(EventSubscription)
            .where(EventSubscription.user_id == context.user_id)
            .where(EventSubscription.event_id == event.id)
        ).scalar_one_or_none()

        # if not subscribed, subscribe
        if request.subscribe and not current_subscription:
            session.add(EventSubscription(user_id=context.user_id, event_id=event.id))

        # if subscribed but unsubbing, remove subscription
        if not request.subscribe and current_subscription:
            session.delete(current_subscription)

        session.flush()

        log_event(
            context,
            session,
            "event.subscription_set",
            {"event_id": event.id, "occurrence_id": occurrence.id, "subscribed": request.subscribe},
        )

        return event_to_pb(session, occurrence, context)

    def SetEventAttendance(
        self, request: events_pb2.SetEventAttendanceReq, context: CouchersContext, session: Session
    ) -> events_pb2.Event:
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()

        if not occurrence:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        current_attendance = session.execute(
            select(EventOccurrenceAttendee)
            .where(EventOccurrenceAttendee.user_id == context.user_id)
            .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
        ).scalar_one_or_none()

        if request.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING:
            if current_attendance:
                session.delete(current_attendance)
            # if unset/not going, nothing to do!
        else:
            if current_attendance:
                current_attendance.attendee_status = attendancestate2sql[request.attendance_state]  # type: ignore[assignment]
            else:
                # create new
                attendance = EventOccurrenceAttendee(
                    user_id=context.user_id,
                    occurrence_id=occurrence.id,
                    attendee_status=not_none(attendancestate2sql[request.attendance_state]),
                )
                session.add(attendance)

        session.flush()

        log_event(
            context,
            session,
            "event.attendance_set",
            {"occurrence_id": occurrence.id, "attendance_state": request.attendance_state},
        )

        return event_to_pb(session, occurrence, context)

    def ListMyEvents(
        self, request: events_pb2.ListMyEventsReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListMyEventsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = (
            dt_from_millis(int(request.page_token)) if request.page_token and not request.page_number else now()
        )
        # the page number is the page number we are on
        page_number = request.page_number or 1
        # Calculate the offset for pagination
        offset = (page_number - 1) * page_size
        query = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(~EventOccurrence.is_deleted)
        )

        include_all = not (request.subscribed or request.attending or request.organizing or request.my_communities)
        include_subscribed = request.subscribed or include_all
        include_organizing = request.organizing or include_all
        include_attending = request.attending or include_all
        include_my_communities = request.my_communities or include_all

        where_ = []

        if include_subscribed:
            query = query.outerjoin(
                EventSubscription,
                and_(EventSubscription.event_id == Event.id, EventSubscription.user_id == context.user_id),
            )
            where_.append(EventSubscription.user_id != None)
        if include_organizing:
            query = query.outerjoin(
                EventOrganizer, and_(EventOrganizer.event_id == Event.id, EventOrganizer.user_id == context.user_id)
            )
            where_.append(EventOrganizer.user_id != None)
        if include_attending:
            query = query.outerjoin(
                EventOccurrenceAttendee,
                and_(
                    EventOccurrenceAttendee.occurrence_id == EventOccurrence.id,
                    EventOccurrenceAttendee.user_id == context.user_id,
                ),
            )
            where_.append(EventOccurrenceAttendee.user_id != None)
        if include_my_communities:
            my_communities = (
                session.execute(
                    select(Node.id)
                    .join(Cluster, Cluster.parent_node_id == Node.id)
                    .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                    .where(ClusterSubscription.user_id == context.user_id)
                    .where(Cluster.is_official_cluster)
                    .order_by(Node.id)
                    .limit(100000)
                )
                .scalars()
                .all()
            )
            where_.append(Event.parent_node_id.in_(my_communities))

        query = query.where(or_(*where_))

        if request.my_communities_exclude_global:
            query = query.where(Event.parent_node_id > GLOBAL_COMMUNITY_MAX_NODE_ID)

        if not request.include_cancelled:
            query = query.where(~EventOccurrence.is_cancelled)

        if not request.past:
            cutoff = page_token - timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time > cutoff).order_by(EventOccurrence.start_time.asc())
        else:
            cutoff = page_token + timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time < cutoff).order_by(EventOccurrence.start_time.desc())
        # Count the total number of items for pagination
        total_items = session.execute(select(func.count()).select_from(query.subquery())).scalar()
        # Apply pagination by page number
        query = query.offset(offset).limit(page_size) if request.page_number else query.limit(page_size + 1)
        occurrences = session.execute(query).scalars().all()

        return events_pb2.ListMyEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            total_items=total_items,
        )

    def ListAllEvents(
        self, request: events_pb2.ListAllEventsReq, context: CouchersContext, session: Session
    ) -> events_pb2.ListAllEventsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

        query = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(~EventOccurrence.is_deleted)
        )

        if not request.include_cancelled:
            query = query.where(~EventOccurrence.is_cancelled)

        if not request.past:
            cutoff = page_token - timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time > cutoff).order_by(EventOccurrence.start_time.asc())
        else:
            cutoff = page_token + timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time < cutoff).order_by(EventOccurrence.start_time.desc())

        query = query.limit(page_size + 1)
        occurrences = session.execute(query).scalars().all()

        return events_pb2.ListAllEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
        )

    def InviteEventOrganizer(
        self, request: events_pb2.InviteEventOrganizerReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_edit_permission_denied")

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        session.add(
            EventOrganizer(
                user_id=request.user_id,
                event_id=event.id,
            )
        )
        session.flush()

        other_user_context = make_background_user_context(user_id=request.user_id)

        notify(
            session,
            user_id=request.user_id,
            topic_action=NotificationTopicAction.event__invite_organizer,
            key=str(event.id),
            data=notification_data_pb2.EventInviteOrganizer(
                event=event_to_pb(session, occurrence, other_user_context),
                inviting_user=user_model_to_pb(user, session, other_user_context),
            ),
        )

        return empty_pb2.Empty()

    def RemoveEventOrganizer(
        self, request: events_pb2.RemoveEventOrganizerReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        if occurrence.is_cancelled:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "event_cant_update_cancelled_event")

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_update_old_event")

        # Determine which user to remove
        user_id_to_remove = request.user_id.value if request.HasField("user_id") else context.user_id

        # Check if the target user is the event owner (only after permission check)
        if event.owner_user_id == user_id_to_remove:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_cant_remove_owner_as_organizer")

        # Check permissions: either an organizer removing an organizer OR you're the event owner
        if not _can_edit_event(session, event, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_edit_permission_denied")

        # Find the organizer to remove
        organizer_to_remove = session.execute(
            select(EventOrganizer)
            .where(EventOrganizer.user_id == user_id_to_remove)
            .where(EventOrganizer.event_id == event.id)
        ).scalar_one_or_none()

        if not organizer_to_remove:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_not_an_organizer")

        session.delete(organizer_to_remove)

        return empty_pb2.Empty()
