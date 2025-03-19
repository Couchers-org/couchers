import logging
from datetime import timedelta
from types import SimpleNamespace

import grpc
from google.protobuf import empty_pb2
from psycopg2.extras import DateTimeTZRange
from sqlalchemy.sql import and_, func, or_, select, update

from couchers import errors
from couchers.db import can_moderate_node, get_parent_node_at_location, session_scope
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
from couchers.notifications.notify import notify
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import are_blocked
from couchers.servicers.threads import thread_to_pb
from couchers.sql import couchers_select as select
from couchers.tasks import send_event_community_invite_request_email
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    dt_from_millis,
    millis_from_dt,
    now,
    to_aware_datetime,
)
from proto import events_pb2, events_pb2_grpc, notification_data_pb2
from proto.internal import jobs_pb2

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


def _is_event_owner(event: Event, user_id):
    """
    Checks whether the user can act as an owner of the event
    """
    if event.owner_user:
        return event.owner_user_id == user_id
    # otherwise owned by a cluster
    return event.owner_cluster.admins.where(User.id == user_id).one_or_none() is not None


def _can_moderate_event(session, event: Event, user_id):
    # if the event is owned by a cluster, then any moderator of that cluster can moderate this event
    if event.owner_cluster is not None and can_moderate_node(session, user_id, event.owner_cluster.parent_node_id):
        return True

    # finally check if the user can moderate the parent node of the cluster
    return can_moderate_node(session, user_id, event.parent_node_id)


def _can_edit_event(session, event, user_id):
    return _is_event_owner(event, user_id) or _can_moderate_event(session, event, user_id)


def event_to_pb(session, occurrence: EventOccurrence, context):
    event = occurrence.event

    next_occurrence = (
        event.occurrences.where(EventOccurrence.end_time >= now()).order_by(EventOccurrence.end_time.asc()).first()
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
        select(func.count())
        .select_from(EventOccurrenceAttendee)
        .where_users_column_visible(context, EventOccurrenceAttendee.user_id)
        .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
        .where(EventOccurrenceAttendee.attendee_status == AttendeeStatus.going)
    ).scalar_one()
    maybe_count = session.execute(
        select(func.count())
        .select_from(EventOccurrenceAttendee)
        .where_users_column_visible(context, EventOccurrenceAttendee.user_id)
        .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
        .where(EventOccurrenceAttendee.attendee_status == AttendeeStatus.maybe)
    ).scalar_one()

    organizer_count = session.execute(
        select(func.count())
        .select_from(EventOrganizer)
        .where_users_column_visible(context, EventOrganizer.user_id)
        .where(EventOrganizer.event_id == event.id)
    ).scalar_one()
    subscriber_count = session.execute(
        select(func.count())
        .select_from(EventSubscription)
        .where_users_column_visible(context, EventSubscription.user_id)
        .where(EventSubscription.event_id == event.id)
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
        online_information=(
            events_pb2.OnlineEventInformation(
                link=occurrence.link,
            )
            if occurrence.link
            else None
        ),
        offline_information=(
            events_pb2.OfflineEventInformation(
                lat=occurrence.coordinates[0],
                lng=occurrence.coordinates[1],
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


def _get_event_and_occurrence_query(occurrence_id, include_deleted: bool):
    query = (
        select(Event, EventOccurrence)
        .where(EventOccurrence.id == occurrence_id)
        .where(EventOccurrence.event_id == Event.id)
    )

    if not include_deleted:
        query = query.where(~EventOccurrence.is_deleted)

    return query


def _get_event_and_occurrence_one(
    session, occurrence_id, include_deleted: bool = False
) -> tuple[Event, EventOccurrence]:
    return session.execute(_get_event_and_occurrence_query(occurrence_id, include_deleted)).one()


def _get_event_and_occurrence_one_or_none(
    session, occurrence_id, include_deleted: bool = False
) -> tuple[Event, EventOccurrence] | None:
    return session.execute(_get_event_and_occurrence_query(occurrence_id, include_deleted)).one_or_none()


def _check_occurrence_time_validity(start_time, end_time, context):
    if start_time < now():
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_IN_PAST)
    if end_time < start_time:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_ENDS_BEFORE_STARTS)
    if end_time - start_time > timedelta(days=7):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_TOO_LONG)
    if start_time - now() > timedelta(days=365):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_TOO_FAR_IN_FUTURE)


def get_users_to_notify_for_new_event(session, occurrence):
    """
    Returns the users to notify, as well as the community id that is being notified (None if based on geo search)
    """
    cluster = occurrence.event.parent_node.official_cluster
    if cluster.parent_node_id == 1:
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
        return users, None


def generate_event_create_notifications(payload: jobs_pb2.GenerateEventCreateNotificationsPayload):
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
            if are_blocked(session, user.id, creator.id):
                continue
            context = SimpleNamespace(user_id=user.id)
            notify(
                session,
                user_id=user.id,
                topic_action="event:create_approved" if payload.approved else "event:create_any",
                key=payload.occurrence_id,
                data=notification_data_pb2.EventCreate(
                    event=event_to_pb(session, occurrence, context),
                    inviting_user=user_model_to_pb(inviting_user, session, context),
                    nearby=True if node_id is None else None,
                    in_community=community_to_pb(session, event.parent_node, context) if node_id is not None else None,
                ),
            )


def generate_event_update_notifications(payload: jobs_pb2.GenerateEventUpdateNotificationsPayload):
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(session, occurrence_id=payload.occurrence_id)

        updating_user = session.execute(select(User).where(User.id == payload.updating_user_id)).scalar_one_or_none()

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            if are_blocked(session, user_id, updating_user.id):
                continue
            context = SimpleNamespace(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action="event:update",
                key=payload.occurrence_id,
                data=notification_data_pb2.EventUpdate(
                    event=event_to_pb(session, occurrence, context),
                    updating_user=user_model_to_pb(updating_user, session, context),
                    updated_items=payload.updated_items,
                ),
            )


def generate_event_cancel_notifications(payload: jobs_pb2.GenerateEventCancelNotificationsPayload):
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(session, occurrence_id=payload.occurrence_id)

        cancelling_user = session.execute(
            select(User).where(User.id == payload.cancelling_user_id)
        ).scalar_one_or_none()

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            if are_blocked(session, user_id, cancelling_user.id):
                continue
            context = SimpleNamespace(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action="event:cancel",
                key=payload.occurrence_id,
                data=notification_data_pb2.EventCancel(
                    event=event_to_pb(session, occurrence, context),
                    cancelling_user=user_model_to_pb(cancelling_user, session, context),
                ),
            )


def generate_event_delete_notifications(payload: jobs_pb2.GenerateEventDeleteNotificationsPayload):
    with session_scope() as session:
        event, occurrence = _get_event_and_occurrence_one(
            session, occurrence_id=payload.occurrence_id, include_deleted=True
        )

        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.user_id for user in occurrence.attendances]

        for user_id in set(subscribed_user_ids + attending_user_ids):
            context = SimpleNamespace(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action="event:delete",
                key=payload.occurrence_id,
                data=notification_data_pb2.EventDelete(
                    event=event_to_pb(session, occurrence, context),
                ),
            )


class Events(events_pb2_grpc.EventsServicer):
    def CreateEvent(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not user.has_completed_profile:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.INCOMPLETE_PROFILE_CREATE_EVENT)
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_CONTENT)
        if request.HasField("online_information"):
            online = True
            geom = None
            address = None
            if not request.online_information.link:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_REQUIRES_LINK)
            link = request.online_information.link
        elif request.HasField("offline_information"):
            online = False
            # As protobuf parses a missing value as 0.0, this is not a permitted event coordinate value
            if not (
                request.offline_information.address
                and request.offline_information.lat
                and request.offline_information.lng
            ):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_OR_LOCATION)
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            geom = create_coordinate(request.offline_information.lat, request.offline_information.lng)
            address = request.offline_information.address
            link = None
        else:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_LOCATION_OR_LINK)

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        _check_occurrence_time_validity(start_time, end_time, context)

        if request.parent_community_id:
            parent_node = session.execute(
                select(Node).where(Node.id == request.parent_community_id)
            ).scalar_one_or_none()
        else:
            if online:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_MISSING_PARENT_COMMUNITY)
            # parent community computed from geom
            parent_node = get_parent_node_at_location(session, geom)

        if not parent_node:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.COMMUNITY_NOT_FOUND)

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

        event = Event(
            title=request.title,
            parent_node_id=parent_node.id,
            owner_user_id=context.user_id,
            thread=Thread(),
            creator_user_id=context.user_id,
        )
        session.add(event)

        occurrence = EventOccurrence(
            event=event,
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

        session.add(
            EventOrganizer(
                user_id=context.user_id,
                event=event,
            )
        )

        session.add(
            EventSubscription(
                user_id=context.user_id,
                event=event,
            )
        )

        session.add(
            EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence=occurrence,
                attendee_status=AttendeeStatus.going,
            )
        )

        session.commit()

        if user.has_completed_profile:
            queue_job(
                session,
                "generate_event_create_notifications",
                payload=jobs_pb2.GenerateEventCreateNotificationsPayload(
                    inviting_user_id=user.id,
                    occurrence_id=occurrence.id,
                    approved=False,
                ),
            )

        return event_to_pb(session, occurrence, context)

    def ScheduleEvent(self, request, context, session):
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_CONTENT)
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
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_OR_LOCATION)
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            geom = create_coordinate(request.offline_information.lat, request.offline_information.lng)
            address = request.offline_information.address
            link = None
        else:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_LOCATION_OR_LINK)

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        _check_occurrence_time_validity(start_time, end_time, context)

        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

        during = DateTimeTZRange(start_time, end_time)

        # && is the overlap operator for ranges
        if (
            session.execute(
                select(EventOccurrence.id)
                .where(EventOccurrence.event_id == event.id)
                .where(EventOccurrence.during.op("&&")(during))
            )
            .scalars()
            .first()
            is not None
        ):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_OVERLAP)

        occurrence = EventOccurrence(
            event=event,
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

        session.add(
            EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence=occurrence,
                attendee_status=AttendeeStatus.going,
            )
        )

        session.flush()

        # TODO: notify

        return event_to_pb(session, occurrence, context)

    def UpdateEvent(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

        # the things that were updated and need to be notified about
        notify_updated = []

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        occurrence_update = {"last_edited": now()}

        if request.HasField("title"):
            notify_updated.append("title")
            event.title = request.title.value
            event.last_edited = now()

        if request.HasField("content"):
            notify_updated.append("content")
            occurrence_update["content"] = request.content.value

        if request.HasField("photo_key"):
            occurrence_update["photo_key"] = request.photo_key.value

        if request.HasField("online_information"):
            notify_updated.append("location")
            if not request.online_information.link:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_REQUIRES_LINK)
            occurrence_update["link"] = request.online_information.link
            occurrence_update["geom"] = None
            occurrence_update["address"] = None
        elif request.HasField("offline_information"):
            notify_updated.append("location")
            occurrence_update["link"] = None
            if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            occurrence_update["geom"] = create_coordinate(
                request.offline_information.lat, request.offline_information.lng
            )
            occurrence_update["address"] = request.offline_information.address

        if request.HasField("start_time") or request.HasField("end_time"):
            if request.update_all_future:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_CANT_UPDATE_ALL_TIMES)
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
                )
                .scalars()
                .first()
                is not None
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_OVERLAP)

            occurrence_update["during"] = during

        # TODO
        # if request.HasField("timezone"):
        #     occurrence_update["timezone"] = request.timezone

        # allow editing any event which hasn't ended more than 24 hours before now
        # when editing all future events, we edit all which have not yet ended

        if request.update_all_future:
            session.execute(
                update(EventOccurrence)
                .where(EventOccurrence.end_time >= now() - timedelta(hours=24))
                .where(EventOccurrence.start_time >= occurrence.start_time)
                .values(occurrence_update)
                .execution_options(synchronize_session=False)
            )
        else:
            if occurrence.end_time < now() - timedelta(hours=24):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)
            session.execute(
                update(EventOccurrence)
                .where(EventOccurrence.end_time >= now() - timedelta(hours=24))
                .where(EventOccurrence.id == occurrence.id)
                .values(occurrence_update)
                .execution_options(synchronize_session=False)
            )

        session.flush()

        if notify_updated:
            logger.info(f"Fields {','.join(notify_updated)} updated in event {event.id=}, notifying")

            queue_job(
                session,
                "generate_event_update_notifications",
                payload=jobs_pb2.GenerateEventUpdateNotificationsPayload(
                    updating_user_id=user.id,
                    occurrence_id=occurrence.id,
                    updated_items=notify_updated,
                ),
            )

        # since we have synchronize_session=False, we have to refresh the object
        session.refresh(occurrence)

        return event_to_pb(session, occurrence, context)

    def GetEvent(self, request, context, session):
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()

        if not occurrence:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        return event_to_pb(session, occurrence, context)

    def CancelEvent(self, request, context, session):
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_CANCEL_OLD_EVENT)

        occurrence.is_cancelled = True

        queue_job(
            session,
            "generate_event_cancel_notifications",
            payload=jobs_pb2.GenerateEventCancelNotificationsPayload(
                cancelling_user_id=context.user_id,
                occurrence_id=occurrence.id,
            ),
        )

        return empty_pb2.Empty()

    def RequestCommunityInvite(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

        this_user_reqs = [req for req in occurrence.community_invite_requests if req.user_id == context.user_id]

        if len(this_user_reqs) > 0:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_COMMUNITY_INVITE_ALREADY_REQUESTED)

        approved_reqs = [req for req in occurrence.community_invite_requests if req.approved]

        if len(approved_reqs) > 0:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_COMMUNITY_INVITE_ALREADY_APPROVED)

        request = EventCommunityInviteRequest(
            occurrence_id=request.event_id,
            user_id=context.user_id,
        )
        session.add(request)
        session.flush()

        send_event_community_invite_request_email(session, request)

        return empty_pb2.Empty()

    def ListEventOccurrences(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()
        if not occurrence:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        occurrences = (
            select(EventOccurrence).where(EventOccurrence.event_id == Event.id).where(~EventOccurrence.is_deleted)
        )

        if not request.include_cancelled:
            occurrences = occurrences.where(~EventOccurrence.is_cancelled)

        if not request.past:
            occurrences = occurrences.where(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.asc()
            )
        else:
            occurrences = occurrences.where(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.desc()
            )

        occurrences = occurrences.limit(page_size + 1)
        occurrences = session.execute(occurrences).scalars().all()

        return events_pb2.ListEventOccurrencesRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
        )

    def ListEventAttendees(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()
        if not occurrence:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
        attendees = (
            session.execute(
                select(EventOccurrenceAttendee)
                .where_users_column_visible(context, EventOccurrenceAttendee.user_id)
                .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                .where(EventOccurrenceAttendee.user_id >= next_user_id)
                .order_by(EventOccurrenceAttendee.user_id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventAttendeesRes(
            attendee_user_ids=[attendee.user_id for attendee in attendees[:page_size]],
            next_page_token=str(attendees[-1].user_id) if len(attendees) > page_size else None,
        )

    def ListEventSubscribers(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
        event, occurrence = res
        subscribers = (
            session.execute(
                select(EventSubscription)
                .where_users_column_visible(context, EventSubscription.user_id)
                .where(EventSubscription.event_id == event.id)
                .where(EventSubscription.user_id >= next_user_id)
                .order_by(EventSubscription.user_id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventSubscribersRes(
            subscriber_user_ids=[subscriber.user_id for subscriber in subscribers[:page_size]],
            next_page_token=str(subscribers[-1].user_id) if len(subscribers) > page_size else None,
        )

    def ListEventOrganizers(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
        event, occurrence = res
        organizers = (
            session.execute(
                select(EventOrganizer)
                .where_users_column_visible(context, EventOrganizer.user_id)
                .where(EventOrganizer.event_id == event.id)
                .where(EventOrganizer.user_id >= next_user_id)
                .order_by(EventOrganizer.user_id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return events_pb2.ListEventOrganizersRes(
            organizer_user_ids=[organizer.user_id for organizer in organizers[:page_size]],
            next_page_token=str(organizers[-1].user_id) if len(organizers) > page_size else None,
        )

    def TransferEvent(self, request, context, session):
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_TRANSFER_PERMISSION_DENIED)

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

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
            context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

        event.owner_user = None
        event.owner_cluster = cluster

        session.commit()
        return event_to_pb(session, occurrence, context)

    def SetEventSubscription(self, request, context, session):
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

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

        return event_to_pb(session, occurrence, context)

    def SetEventAttendance(self, request, context, session):
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == request.event_id).where(~EventOccurrence.is_deleted)
        ).scalar_one_or_none()

        if not occurrence:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

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
                current_attendance.attendee_status = attendancestate2sql[request.attendance_state]
            else:
                # create new
                attendance = EventOccurrenceAttendee(
                    user_id=context.user_id,
                    occurrence_id=occurrence.id,
                    attendee_status=attendancestate2sql[request.attendance_state],
                )
                session.add(attendance)

        session.flush()

        return event_to_pb(session, occurrence, context)

    def ListMyEvents(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = (
            dt_from_millis(int(request.page_token)) if request.page_token and not request.page_number else now()
        )
        # the page number is the page number we are on
        page_number = request.page_number or 1
        # Calculate the offset for pagination
        offset = (page_number - 1) * page_size
        occurrences = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(~EventOccurrence.is_deleted)
        )

        include_all = not (request.subscribed or request.attending or request.organizing or request.my_communities)
        include_subscribed = request.subscribed or include_all
        include_organizing = request.organizing or include_all
        include_attending = request.attending or include_all
        include_my_communities = request.my_communities or include_all

        where_ = []

        if include_subscribed:
            occurrences = occurrences.outerjoin(
                EventSubscription,
                and_(EventSubscription.event_id == Event.id, EventSubscription.user_id == context.user_id),
            )
            where_.append(EventSubscription.user_id != None)
        if include_organizing:
            occurrences = occurrences.outerjoin(
                EventOrganizer, and_(EventOrganizer.event_id == Event.id, EventOrganizer.user_id == context.user_id)
            )
            where_.append(EventOrganizer.user_id != None)
        if include_attending:
            occurrences = occurrences.outerjoin(
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

        occurrences = occurrences.where(or_(*where_))

        if not request.include_cancelled:
            occurrences = occurrences.where(~EventOccurrence.is_cancelled)

        if not request.past:
            occurrences = occurrences.where(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.asc()
            )
        else:
            occurrences = occurrences.where(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.desc()
            )
        # Count the total number of items for pagination
        total_items = session.execute(select(func.count()).select_from(occurrences.subquery())).scalar()
        # Apply pagination by page number
        occurrences = (
            occurrences.offset(offset).limit(page_size) if request.page_number else occurrences.limit(page_size + 1)
        )
        occurrences = session.execute(occurrences).scalars().all()

        return events_pb2.ListMyEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            total_items=total_items,
        )

    def ListAllEvents(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

        occurrences = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(~EventOccurrence.is_deleted)
        )

        if not request.include_cancelled:
            occurrences = occurrences.where(~EventOccurrence.is_cancelled)

        if not request.past:
            occurrences = occurrences.where(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.asc()
            )
        else:
            occurrences = occurrences.where(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                EventOccurrence.start_time.desc()
            )

        occurrences = occurrences.limit(page_size + 1)
        occurrences = session.execute(occurrences).scalars().all()

        return events_pb2.ListAllEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
        )

    def InviteEventOrganizer(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if not _can_edit_event(session, event, context.user_id):
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

        if not session.execute(
            select(User).where_users_visible(context).where(User.id == request.user_id)
        ).scalar_one_or_none():
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        session.add(
            EventOrganizer(
                user_id=request.user_id,
                event=event,
            )
        )
        session.flush()

        other_user_context = SimpleNamespace(user_id=request.user_id)

        notify(
            session,
            user_id=request.user_id,
            topic_action="event:invite_organizer",
            key=event.id,
            data=notification_data_pb2.EventInviteOrganizer(
                event=event_to_pb(session, occurrence, other_user_context),
                inviting_user=user_model_to_pb(user, session, other_user_context),
            ),
        )

        return empty_pb2.Empty()

    def RemoveEventOrganizer(self, request, context, session):
        res = _get_event_and_occurrence_one_or_none(session, occurrence_id=request.event_id)
        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        if occurrence.is_cancelled:
            context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_CANT_UPDATE_CANCELLED_EVENT)

        if occurrence.end_time < now() - timedelta(hours=24):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)

        if event.owner_user_id == context.user_id:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_REMOVE_OWNER_AS_ORGANIZER)

        current = session.execute(
            select(EventOrganizer)
            .where(EventOrganizer.user_id == context.user_id)
            .where(EventOrganizer.event_id == event.id)
        ).scalar_one_or_none()

        if not current:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_NOT_AN_ORGANIZER)

        session.delete(current)

        return empty_pb2.Empty()
