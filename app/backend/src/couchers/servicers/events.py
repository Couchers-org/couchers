from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from psycopg2.extras import DateTimeTZRange
from sqlalchemy.sql import and_, or_

from couchers import errors
from couchers.db import can_moderate_node, get_parent_node_at_location, session_scope
from couchers.models import (
    AttendeeStatus,
    Cluster,
    Event,
    EventOccurrence,
    EventOccurrenceAttendee,
    EventOrganizer,
    EventSubscription,
    Node,
    Thread,
    Upload,
    User,
)
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    dt_from_millis,
    millis_from_dt,
    now,
    to_aware_datetime,
)
from proto import events_pb2, events_pb2_grpc

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
    return event.owner_cluster.admins.filter(User.id == user_id).one_or_none() is not None


def _can_moderate_event(session, event: Event, user_id):
    # if the event is owned by a cluster, then any moderator of that cluster can moderate this event
    if event.owner_cluster is not None and can_moderate_node(session, user_id, event.owner_cluster.parent_node_id):
        return True

    # finally check if the user can moderate the parent node of the cluster
    return can_moderate_node(session, user_id, event.parent_node_id)


def _can_edit_event(session, event, user_id):
    return _is_event_owner(event, user_id) or _can_moderate_event(session, event, user_id)


def event_to_pb(occurrence: EventOccurrence, context):
    event = occurrence.event

    next_occurrence = (
        event.occurrences.filter(EventOccurrence.end_time >= now()).order_by(EventOccurrence.end_time.asc()).first()
    )

    owner_community_id = None
    owner_group_id = None
    if event.owner_cluster:
        if event.owner_cluster.is_official_cluster:
            owner_community_id = event.owner_cluster.parent_node_id
        else:
            owner_group_id = event.owner_cluster.id

    attendance = occurrence.attendees.filter(EventOccurrenceAttendee.user_id == context.user_id).one_or_none()
    attendance_state = attendance.attendee_status if attendance else None

    with session_scope() as session:
        can_moderate = _can_moderate_event(session, event, context.user_id)

        going_count = (
            session.query(EventOccurrenceAttendee)
            .filter_users_column(context, EventOccurrenceAttendee.user_id)
            .filter(EventOccurrenceAttendee.occurrence_id == occurrence.id)
            .filter(EventOccurrenceAttendee.attendee_status == AttendeeStatus.going)
            .count()
        )
        maybe_count = (
            session.query(EventOccurrenceAttendee)
            .filter_users_column(context, EventOccurrenceAttendee.user_id)
            .filter(EventOccurrenceAttendee.occurrence_id == occurrence.id)
            .filter(EventOccurrenceAttendee.attendee_status == AttendeeStatus.maybe)
            .count()
        )

        organizer_count = (
            session.query(EventOrganizer)
            .filter_users_column(context, EventOrganizer.user_id)
            .filter(EventOrganizer.event_id == event.id)
            .count()
        )
        subscriber_count = (
            session.query(EventSubscription)
            .filter_users_column(context, EventSubscription.user_id)
            .filter(EventSubscription.event_id == event.id)
            .count()
        )

    return events_pb2.Event(
        event_id=occurrence.id,
        is_next=occurrence.id == next_occurrence.id,
        title=event.title,
        slug=event.slug,
        content=occurrence.content,
        photo_url=occurrence.photo.thumbnail_url if occurrence.photo else None,
        online_information=events_pb2.OnlineEventInformation(
            link=occurrence.link,
        )
        if occurrence.link
        else None,
        offline_information=events_pb2.OfflineEventInformation(
            lat=occurrence.coordinates[0],
            lng=occurrence.coordinates[1],
            address=occurrence.address,
        )
        if occurrence.geom
        else None,
        created=Timestamp_from_datetime(occurrence.created),
        last_edited=Timestamp_from_datetime(occurrence.last_edited),
        creator_user_id=occurrence.creator_user_id,
        start_time=Timestamp_from_datetime(occurrence.start_time),
        end_time=Timestamp_from_datetime(occurrence.end_time),
        timezone=occurrence.timezone,
        start_time_display=str(occurrence.start_time),
        end_time_display=str(occurrence.end_time),
        attendance_state=attendancestate2api[attendance_state],
        organizer=event.organizers.filter(EventOrganizer.user_id == context.user_id).one_or_none() is not None,
        subscriber=event.subscribers.filter(EventSubscription.user_id == context.user_id).one_or_none() is not None,
        going_count=going_count,
        maybe_count=maybe_count,
        organizer_count=organizer_count,
        subscriber_count=subscriber_count,
        owner_user_id=event.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread_id=event.thread_id,
        can_edit=_is_event_owner(event, context.user_id),
        can_moderate=can_moderate,
    )


def _check_occurrence_time_validity(start_time, end_time, context):
    if start_time < now():
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_IN_PAST)
    if end_time < start_time:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_ENDS_BEFORE_STARTS)
    if end_time - start_time > timedelta(days=7):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_TOO_LONG)
    if start_time - now() > timedelta(days=365):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_TOO_FAR_IN_FUTURE)


class Events(events_pb2_grpc.EventsServicer):
    def CreateEvent(self, request, context):
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

        with session_scope() as session:
            if request.parent_community_id:
                parent_node = session.query(Node).filter(Node.id == request.parent_community_id).one_or_none()
            else:
                if online:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_MISSING_PARENT_COMMUNITY)
                # parent community computed from geom
                parent_node = get_parent_node_at_location(session, geom)

            if not parent_node:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.COMMUNITY_NOT_FOUND)

            if request.photo_key and not session.query(Upload).filter(Upload.key == request.photo_key).one_or_none():
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

            organizer = EventOrganizer(
                user_id=context.user_id,
                event=event,
            )
            session.add(organizer)

            subscription = EventSubscription(
                user_id=context.user_id,
                event=event,
            )
            session.add(subscription)

            attendee = EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence=occurrence,
                attendee_status=AttendeeStatus.going,
            )
            session.add(attendee)

            session.commit()

            return event_to_pb(occurrence, context)

    def ScheduleEvent(self, request, context):
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_CONTENT)
        if request.HasField("online_information"):
            online = True
            geom = None
            address = None
            link = request.online_information.link
        elif request.HasField("offline_information"):
            online = False
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

        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            if not _can_edit_event(session, event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

            if request.photo_key and not session.query(Upload).filter(Upload.key == request.photo_key).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

            during = DateTimeTZRange(start_time, end_time)

            # && is the overlap operator for ranges
            if session.query(EventOccurrence.id).filter(EventOccurrence.during.op("&&")(during)).first() is not None:
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

            attendee = EventOccurrenceAttendee(
                user_id=context.user_id,
                occurrence=occurrence,
                attendee_status=AttendeeStatus.going,
            )
            session.add(attendee)

            session.flush()

            # TODO: notify

            return event_to_pb(occurrence, context)

    def UpdateEvent(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            if not _can_edit_event(session, event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

            occurrence_update = {"last_edited": now()}

            if request.HasField("title"):
                event.title = request.title.value
                event.last_edited = now()

            if request.HasField("content"):
                occurrence_update["content"] = request.content.value

            if request.HasField("photo_key"):
                occurrence_update["photo_key"] = request.photo_key.value

            if request.HasField("online_information"):
                if not request.online_information.link:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_REQUIRES_LINK)
                occurrence_update["link"] = request.online_information.link
                occurrence_update["geom"] = None
                occurrence_update["address"] = None
            elif request.HasField("offline_information"):
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
                    start_time = to_aware_datetime(request.start_time)
                else:
                    start_time = occurrence.start_time
                if request.HasField("end_time"):
                    end_time = to_aware_datetime(request.end_time)
                else:
                    end_time = occurrence.end_time

                _check_occurrence_time_validity(start_time, end_time, context)

                during = DateTimeTZRange(start_time, end_time)

                # && is the overlap operator for ranges
                if (
                    session.query(EventOccurrence.id)
                    .filter(EventOccurrence.id != occurrence.id)
                    .filter(EventOccurrence.during.op("&&")(during))
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
                session.query(EventOccurrence).filter(EventOccurrence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurrence.start_time >= occurrence.start_time
                ).update(occurrence_update, synchronize_session=False)
            else:
                if occurrence.end_time < now() - timedelta(hours=24):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)
                session.query(EventOccurrence).filter(EventOccurrence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurrence.id == occurrence.id
                ).update(occurrence_update, synchronize_session=False)

            # TODO notify

            session.flush()

            # since we have synchronize_session=False, we have to refresh the object
            session.refresh(occurrence)

            return event_to_pb(occurrence, context)

    def GetEvent(self, request, context):
        with session_scope() as session:
            occurrence = session.query(EventOccurrence).filter(EventOccurrence.id == request.event_id).one_or_none()

            if not occurrence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            return event_to_pb(occurrence, context)

    def ListEventOccurrences(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()
            occurrence = session.query(EventOccurrence).filter(EventOccurrence.id == request.event_id).one_or_none()
            if not occurrence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            occurrences = session.query(EventOccurrence).filter(EventOccurrence.event_id == Event.id)

            if not request.past:
                occurrences = occurrences.filter(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.asc()
                )
            else:
                occurrences = occurrences.filter(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.desc()
                )

            occurrences = occurrences.limit(page_size + 1).all()

            return events_pb2.ListEventOccurrencesRes(
                events=[event_to_pb(occurrence, context) for occurrence in occurrences[:page_size]],
                next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            )

    def ListEventAttendees(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            occurrence = session.query(EventOccurrence).filter(EventOccurrence.id == request.event_id).one_or_none()
            if not occurrence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            attendees = (
                session.query(EventOccurrenceAttendee)
                .filter_users_column(context, EventOccurrenceAttendee.user_id)
                .filter(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                .filter(EventOccurrenceAttendee.user_id >= next_user_id)
                .order_by(EventOccurrenceAttendee.user_id)
                .limit(page_size + 1)
                .all()
            )
            return events_pb2.ListEventAttendeesRes(
                attendee_user_ids=[attendee.id for attendee in attendees[:page_size]],
                next_page_token=str(attendees[-1].id) if len(attendees) > page_size else None,
            )

    def ListEventSubscribers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )
            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            event, occurrence = res
            subscribers = (
                session.query(EventSubscription)
                .filter_users_column(context, EventSubscription.user_id)
                .filter(EventSubscription.event_id == event.id)
                .filter(EventSubscription.user_id >= next_user_id)
                .order_by(EventSubscription.user_id)
                .limit(page_size + 1)
                .all()
            )
            return events_pb2.ListEventSubscribersRes(
                subscriber_user_ids=[subscriber.id for subscriber in subscribers[:page_size]],
                next_page_token=str(subscribers[-1].id) if len(subscribers) > page_size else None,
            )

    def ListEventOrganizers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )
            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            event, occurrence = res
            organizers = (
                session.query(EventOrganizer)
                .filter_users_column(context, EventOrganizer.user_id)
                .filter(EventOrganizer.event_id == event.id)
                .filter(EventOrganizer.user_id >= next_user_id)
                .order_by(EventOrganizer.user_id)
                .limit(page_size + 1)
                .all()
            )
            return events_pb2.ListEventOrganizersRes(
                organizer_user_ids=[organizer.id for organizer in organizers[:page_size]],
                next_page_token=str(organizers[-1].id) if len(organizers) > page_size else None,
            )

    def TransferEvent(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            if not _can_edit_event(session, event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_TRANSFER_PERMISSION_DENIED)

            if request.WhichOneof("new_owner") == "new_owner_group_id":
                cluster = (
                    session.query(Cluster)
                    .filter(~Cluster.is_official_cluster)
                    .filter(Cluster.id == request.new_owner_group_id)
                    .one_or_none()
                )
            elif request.WhichOneof("new_owner") == "new_owner_community_id":
                cluster = (
                    session.query(Cluster)
                    .filter(Cluster.parent_node_id == request.new_owner_community_id)
                    .filter(Cluster.is_official_cluster)
                    .one_or_none()
                )

            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

            event.owner_user = None
            event.owner_cluster = cluster

            session.commit()
            return event_to_pb(occurrence, context)

    def SetEventSubscription(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            current_subscription = (
                session.query(EventSubscription)
                .filter(EventSubscription.user_id == context.user_id)
                .filter(EventSubscription.event_id == event.id)
                .one_or_none()
            )

            # if not subscribed, subscribe
            if request.subscribe and not current_subscription:
                session.add(EventSubscription(user_id=context.user_id, event_id=event.id))

            # if subscribed but unsubbing, remove subscription
            if not request.subscribe and current_subscription:
                session.delete(current_subscription)

            session.flush()

            return event_to_pb(occurrence, context)

    def SetEventAttendance(self, request, context):
        with session_scope() as session:
            occurrence = session.query(EventOccurrence).filter(EventOccurrence.id == request.event_id).one_or_none()

            if not occurrence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            current_attendance = (
                session.query(EventOccurrenceAttendee)
                .filter(EventOccurrenceAttendee.user_id == context.user_id)
                .filter(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                .one_or_none()
            )

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

            return event_to_pb(occurrence, context)

    def ListMyEvents(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

            occurrences = session.query(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id)

            include_all = not (request.subscribed or request.attending or request.organizing)
            include_subscribed = request.subscribed or include_all
            include_organizing = request.organizing or include_all
            include_attending = request.attending or include_all

            filter_ = []

            if include_subscribed:
                occurrences = occurrences.outerjoin(
                    EventSubscription,
                    and_(EventSubscription.event_id == Event.id, EventSubscription.user_id == context.user_id),
                )
                filter_.append(EventSubscription.user_id != None)
            if include_organizing:
                occurrences = occurrences.outerjoin(
                    EventOrganizer, and_(EventOrganizer.event_id == Event.id, EventOrganizer.user_id == context.user_id)
                )
                filter_.append(EventOrganizer.user_id != None)
            if include_attending:
                occurrences = occurrences.outerjoin(
                    EventOccurrenceAttendee,
                    and_(
                        EventOccurrenceAttendee.occurrence_id == EventOccurrence.id,
                        EventOccurrenceAttendee.user_id == context.user_id,
                    ),
                )
                filter_.append(EventOccurrenceAttendee.user_id != None)

            occurrences = occurrences.filter(or_(*filter_))

            if not request.past:
                occurrences = occurrences.filter(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.asc()
                )
            else:
                occurrences = occurrences.filter(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.desc()
                )

            occurrences = occurrences.limit(page_size + 1).all()

            return events_pb2.ListMyEventsRes(
                events=[event_to_pb(occurrence, context) for occurrence in occurrences[:page_size]],
                next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            )

    def ListAllEvents(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

            occurrences = session.query(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id)

            if not request.past:
                occurrences = occurrences.filter(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.asc()
                )
            else:
                occurrences = occurrences.filter(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.desc()
                )

            occurrences = occurrences.limit(page_size + 1).all()

            return events_pb2.ListAllEventsRes(
                events=[event_to_pb(occurrence, context) for occurrence in occurrences[:page_size]],
                next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            )

    def InviteEventOrganizer(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            if not _can_edit_event(session, event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

            if not session.query(User).filter_users(context).filter(User.id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.USER_NOT_FOUND)

            organizer = EventOrganizer(
                user_id=request.user_id,
                event=event,
            )
            session.add(organizer)
            session.flush()

            # TODO: notify

            return empty_pb2.Empty()

    def RemoveEventOrganizer(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurrence)
                .filter(EventOccurrence.id == request.event_id)
                .filter(EventOccurrence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurrence = res

            if event.owner_user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_REMOVE_OWNER_AS_ORGANIZER)

            current = (
                session.query(EventOrganizer)
                .filter(EventOrganizer.user_id == context.user_id)
                .filter(EventOrganizer.event_id == event.id)
                .one_or_none()
            )

            if not current:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_NOT_AN_ORGANIZER)

            session.delete(current)

            return empty_pb2.Empty()
