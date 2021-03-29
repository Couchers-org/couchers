from datetime import timedelta

import grpc
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import can_moderate_node, get_parent_node_at_location, session_scope
from couchers.models import (
    AttendeeStatus,
    Cluster,
    Event,
    EventOccurence,
    EventOccurenceAttendee,
    EventOrganizer,
    EventSubscription,
    Node,
    Thread,
    Upload,
    User,
)
from couchers.utils import Timestamp_from_datetime, create_coordinate, to_aware_datetime
from pb import events_pb2, events_pb2_grpc

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


def _can_moderate_event(event: Event, user_id):
    with session_scope() as session:
        # if the event is owned by a cluster, then any moderator of that cluster can moderate this event
        if event.owner_cluster is not None and can_moderate_node(session, user_id, event.owner_cluster.parent_node_id):
            return True

        # finally check if the user can moderate the parent node of the cluster
        return can_moderate_node(session, user_id, event.parent_node_id)


def _can_edit_event(event, user_id):
    return _is_event_owner(event, user_id) or _can_moderate_event(event, user_id)


def event_to_pb(occurence: EventOccurence, user_id):
    next_occurence = (
        event.occurences.filter(EventOccurence.end_time >= now()).order_by(EventOccurence.end_time.asc()).first()
    )

    owner_community_id = None
    owner_group_id = None
    if event.owner_cluster:
        if event.owner_cluster.is_official_cluster:
            owner_community_id = event.owner_cluster.parent_node_id
        else:
            owner_group_id = event.owner_cluster.id

    attendance = occurence.attendees.filter(EventOccurenceAttendee.user_id == user_id).one_or_none()
    attendance_state = attendance.attendee_status if attendance else None

    return events_pb2.Event(
        event_id=occurence.event.id,
        is_next=occurence.id == next_occurence.id,
        is_past=end_time < now(),
        is_future=end_time > now(),
        title=occurence.title,
        slug=occurence.slug,
        content=occurence.content,
        photo_url=occurence.photo.thumbnail_url if occurence.photo else None,
        is_online_only=occurence.geom is None,
        link=occurence.link,
        location=events_pb2.Coordinate(
            lat=occurence.coordinates[0],
            lng=occurence.coordinates[1],
        )
        if occurence.geom
        else None,
        address=occurence.address,
        created=Timestamp_from_datetime(occurence.created),
        last_edited=Timestamp_from_datetime(occurence.last_edited),
        creator_user_id=occurence.creator_user_id,
        start_time=Timestamp_from_datetime(occurence.start_time),
        end_time=Timestamp_from_datetime(occurence.end_time),
        timezone=occurence.timezone,
        start_time_display=str(occurence.start_time_display),
        end_time_display=str(occurence.end_time_display),
        attendance_state=attendancestate2api[attendance_state],
        organizer=occurence.organizers.filter(EventOrganizer.user_id == user_id).one_or_none() is not None,
        subscriber=occurence.subscribers.filter(EventOrganizer.user_id == user_id).one_or_none() is not None,
        going_count=occurence.attendees.filter(EventOccurenceAttendee.attendee_status == AttendeeStatus.going).count(),
        maybe_count=occurence.attendees.filter(EventOccurenceAttendee.attendee_status == AttendeeStatus.maybe).count(),
        organizer_count=occurence.organizers.count(),
        subscriber_count=occurence.subscribers.count(),
        owner_user_id=event.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread_id=occurence.thread_id,
        can_edit=_is_event_owner(event, user_id),
        can_moderate=_can_moderate_event(event, user_id),
    )


def _check_occurence_time_validity(start_time, end_time, context):
    if start_time < now():
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_IN_FUTURE)
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
        if request.is_online_only:
            geom = None
            address = None
            link = request.link
        else:
            if not (request.address and request.HasField("location")):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_OR_LOCATION)
            if request.location.lat == 0 and request.location.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            geom = create_coordinate(request.location.lat, request.location.lng)
            address = request.address
            link = None

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        _check_occurence_time_validity(start_time, end_time, context)

        with session_scope() as session:
            if request.parent_community_id:
                parent_node = session.query(Node).filter(Node.id == request.parent_community_id).one_or_none()
            else:
                if request.is_online_only:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_MISSING_PARENT_COMMUNITY)
                # parent community computed from geom
                parent_node = get_parent_node_at_location(session, geom)

            if not parent_node:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.COMMUNITY_NOT_FOUND)

            if request.photo_key and not session.query(Upload).filter(Upload.key == request.photo_key).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

            event = Event(
                parent_node_id=parent_node.id,
                owner_user_id=context.user_id,
                thread_id=Thread(),
            )

            occurence = EventOccurence(
                event=event,
                title=request.title,
                content=request.content,
                geom=geom,
                address=address,
                link=link,
                photo_key=request.photo_key if request.photo_key != "" else None,
                is_online_only=request.is_online_only,
                # timezone=timezone,
                start_time=start_time,
                end_time=end_time,
                creator_user_id=context.user_id,
            )

            organizer = EventOrganizer(
                user_id=context.user_id,
                event=event,
            )

            subscription = EventSubscription(
                user_id=context.user_id,
                event=event,
            )

            attendee = EventOccurenceAttendee(
                user_id=context.user_id,
                occurence=occurence,
                attendee_status=AttendeeStatus.going,
            )

            # TODO: repeats

            session.flush()

            return event_to_pb(occurence, context.user_id)

    def ScheduleEvent(self, request, context):
        # TODO
        return events_pb2.Event()

    def UpdateEvent(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurence = res

            if not _can_edit_event(occurence, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_TRANSFER_PERMISSION_DENIED)

            occurence_update = {"last_edited": func.now()}

            if request.HasField("title"):
                occurence_update["title"] = request.title.value

            if request.HasField("content"):
                occurence_update["content"] = request.content.value

            if request.HasField("photo_key"):
                occurence_update["photo_key"] = request.photo_key.value

            if request.HasField("is_online_only"):
                if request.is_online_only.value:
                    if not request.HasField("link"):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_REQUIRES_LINK)
                    occurence_update["geom"] = None
                    occurence_update["address"] = None
                else:
                    if not (request.HasField("address") and request.HasField("location")):
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_MISSING_PARENT_COMMUNITY)
                    occurence_update["address"] = request.address.value
            else:
                if request.HasField("link"):
                    occurence_update["link"] = request.link.value
                if request.HasField("location"):
                    if request.location.lat == 0 and request.location.lng == 0:
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
                    occurence_update["geom"] = create_coordinate(request.location.lat, request.location.lng)
                if request.HasField("address"):
                    occurence_update["address"] = request.address.value

            if request.HasField("start_time") or request.HasField("end_time"):
                if request.update_all_future:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_CANT_UPDATE_ALL_TIMES)
                if request.HasField("start_time"):
                    start_time = to_aware_datetime(request.start_time.value)
                else:
                    start_time = occurence.start_time
                if request.HasField("end_time"):
                    end_time = to_aware_datetime(request.end_time.value)
                else:
                    end_time = occurence.end_time

                _check_occurence_time_validity(start_time, end_time, context)

                occurence_update["start_time"] = start_time
                occurence_update["end_time"] = end_time

            # TODO
            # if request.HasField("timezone"):
            #     occurence_update["timezone"] = request.timezone

            # allow editing any event which hasn't ended more than 24 hours before now
            # when editing all future events, we edit all which have not yet ended

            if request.update_all_future:
                session.query(EventOccurence).filter(EventOccurence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurence.start_time >= occurence.start_time
                ).update(occurence_update)
            else:
                if occurence.end_time < now() - timedelta(hours=24):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)
                session.query(EventOccurence).filter(EventOccurence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurence.id == occurence.id
                ).update(occurence_update)

            # TODO notify_attendees

            session.flush()

            return event_to_pb(occurence, context.user_id)

    def GetEvent(self, request, context):
        with session_scope() as session:
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()

            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            return event_to_pb(occurence, context.user_id)

    def ListEventAttendees(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()
            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            attendees = (
                node.official_cluster.admins.filter(User.id >= next_user_id)
                .order_by(User.id)
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
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )
            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            event, occurence = res
            subscribers = event.subscribers.filter(User.id >= next_user_id).order_by(User.id).limit(page_size + 1).all()
            return events_pb2.ListEventSubscribersRes(
                subscriber_user_ids=[subscriber.id for subscriber in subscribers[:page_size]],
                next_page_token=str(subscribers[-1].id) if len(subscribers) > page_size else None,
            )

    def ListEventOrganizers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            res = (
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )
            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            event, occurence = res
            organizers = event.organizers.filter(User.id >= next_user_id).order_by(User.id).limit(page_size + 1).all()
            return events_pb2.ListEventOrganizersRes(
                subscriber_user_ids=[organizer.id for organizer in organizers[:page_size]],
                next_page_token=str(organizers[-1].id) if len(organizers) > page_size else None,
            )

    def TransferEvent(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurence = res

            if not _can_edit_event(occurence, context.user_id):
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
            return event_to_pb(occurence, context.user_id)

    def SetEventSubscription(self, request, context):
        with session_scope() as session:
            res = (
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurence = res

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

            return event_to_pb(occurence, context.user_id)

    def SetEventAttendance(self, request, context):
        with session_scope() as session:
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()

            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            current_attendance = (
                session.query(EventOccurenceAttendee)
                .filter(EventOccurenceAttendee.user_id == context.user_id)
                .filter(EventOccurenceAttendee.occurence_id == occurence.id)
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
                    attendance = EventOccurenceAttendee(
                        user_id == context.user_id,
                        occurence_id == occurence.id,
                        attendee_status=attendancestate2sql[request.attendance_state],
                    )
                    session.add(attendance)

            session.flush()

            return event_to_pb(occurence, context.user_id)
