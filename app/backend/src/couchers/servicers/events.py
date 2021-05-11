from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from psycopg2.extras import DateTimeTZRange
from sqlalchemy.sql import and_, func, or_

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
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    dt_from_millis,
    millis_from_dt,
    now,
    to_aware_datetime,
)
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
    event = occurence.event

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
        event_id=occurence.id,
        is_next=occurence.id == next_occurence.id,
        title=event.title,
        slug=event.slug,
        content=occurence.content,
        photo_url=occurence.photo.thumbnail_url if occurence.photo else None,
        online_information=events_pb2.OnlineEventInformation(
            link=occurence.link,
        )
        if occurence.link
        else None,
        offline_information=events_pb2.OfflineEventInformation(
            lat=occurence.coordinates[0],
            lng=occurence.coordinates[1],
            address=occurence.address,
        )
        if occurence.geom
        else None,
        created=Timestamp_from_datetime(occurence.created),
        last_edited=Timestamp_from_datetime(occurence.last_edited),
        creator_user_id=occurence.creator_user_id,
        start_time=Timestamp_from_datetime(occurence.start_time),
        end_time=Timestamp_from_datetime(occurence.end_time),
        timezone=occurence.timezone,
        start_time_display=str(occurence.start_time),
        end_time_display=str(occurence.end_time),
        attendance_state=attendancestate2api[attendance_state],
        organizer=event.organizers.filter(EventOrganizer.user_id == user_id).one_or_none() is not None,
        subscriber=event.subscribers.filter(EventSubscription.user_id == user_id).one_or_none() is not None,
        going_count=occurence.attendees.filter(EventOccurenceAttendee.attendee_status == AttendeeStatus.going).count(),
        maybe_count=occurence.attendees.filter(EventOccurenceAttendee.attendee_status == AttendeeStatus.maybe).count(),
        organizer_count=event.organizers.count(),
        subscriber_count=event.subscribers.count(),
        owner_user_id=event.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread_id=event.thread_id,
        can_edit=_is_event_owner(event, user_id),
        can_moderate=_can_moderate_event(event, user_id),
    )


def _check_occurence_time_validity(start_time, end_time, context):
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

        _check_occurence_time_validity(start_time, end_time, context)

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

            occurence = EventOccurence(
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
            session.add(occurence)

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

            attendee = EventOccurenceAttendee(
                user_id=context.user_id,
                occurence=occurence,
                attendee_status=AttendeeStatus.going,
            )
            session.add(attendee)

            session.flush()

            return event_to_pb(occurence, context.user_id)

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

        _check_occurence_time_validity(start_time, end_time, context)

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

            if not _can_edit_event(event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

            if request.photo_key and not session.query(Upload).filter(Upload.key == request.photo_key).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

            during = DateTimeTZRange(start_time, end_time)

            # && is the overlap operator for ranges
            if session.query(EventOccurence.id).filter(EventOccurence.during.op("&&")(during)).first() is not None:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_OVERLAP)

            occurence = EventOccurence(
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
            session.add(occurence)

            attendee = EventOccurenceAttendee(
                user_id=context.user_id,
                occurence=occurence,
                attendee_status=AttendeeStatus.going,
            )
            session.add(attendee)

            session.flush()

            # TODO: notify

            return event_to_pb(occurence, context.user_id)

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

            if not _can_edit_event(event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

            occurence_update = {"last_edited": now()}

            if request.HasField("title"):
                event.title = request.title.value
                event.last_edited = now()

            if request.HasField("content"):
                occurence_update["content"] = request.content.value

            if request.HasField("photo_key"):
                occurence_update["photo_key"] = request.photo_key.value

            if request.HasField("online_information"):
                if not request.online_information.link:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ONLINE_EVENT_REQUIRES_LINK)
                occurence_update["link"] = request.online_information.link
                occurence_update["geom"] = None
                occurence_update["address"] = None
            elif request.HasField("offline_information"):
                occurence_update["link"] = None
                if request.offline_information.lat == 0 and request.offline_information.lng == 0:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
                occurence_update["geom"] = create_coordinate(
                    request.offline_information.lat, request.offline_information.lng
                )
                occurence_update["address"] = request.offline_information.address

            if request.HasField("start_time") or request.HasField("end_time"):
                if request.update_all_future:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.EVENT_CANT_UPDATE_ALL_TIMES)
                if request.HasField("start_time"):
                    start_time = to_aware_datetime(request.start_time)
                else:
                    start_time = occurence.start_time
                if request.HasField("end_time"):
                    end_time = to_aware_datetime(request.end_time)
                else:
                    end_time = occurence.end_time

                _check_occurence_time_validity(start_time, end_time, context)

                during = DateTimeTZRange(start_time, end_time)

                # && is the overlap operator for ranges
                if (
                    session.query(EventOccurence.id)
                    .filter(EventOccurence.id != occurence.id)
                    .filter(EventOccurence.during.op("&&")(during))
                    .first()
                    is not None
                ):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_OVERLAP)

                occurence_update["during"] = during

            # TODO
            # if request.HasField("timezone"):
            #     occurence_update["timezone"] = request.timezone

            # allow editing any event which hasn't ended more than 24 hours before now
            # when editing all future events, we edit all which have not yet ended

            if request.update_all_future:
                session.query(EventOccurence).filter(EventOccurence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurence.start_time >= occurence.start_time
                ).update(occurence_update, synchronize_session=False)
            else:
                if occurence.end_time < now() - timedelta(hours=24):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_CANT_UPDATE_OLD_EVENT)
                session.query(EventOccurence).filter(EventOccurence.end_time >= now() - timedelta(hours=24)).filter(
                    EventOccurence.id == occurence.id
                ).update(occurence_update, synchronize_session=False)

            # TODO notify

            session.flush()

            # since we have synchronize_session=False, we have to refresh the object
            session.refresh(occurence)

            return event_to_pb(occurence, context.user_id)

    def GetEvent(self, request, context):
        with session_scope() as session:
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()

            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            return event_to_pb(occurence, context.user_id)

    def ListEventOccurences(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()
            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            occurences = session.query(EventOccurence).filter(EventOccurence.event_id == Event.id)

            if not request.past:
                occurences = occurences.filter(EventOccurence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.asc()
                )
            else:
                occurences = occurences.filter(EventOccurence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.desc()
                )

            occurences = occurences.limit(page_size + 1).all()

            return events_pb2.ListEventOccurencesRes(
                events=[event_to_pb(occurence, context.user_id) for occurence in occurences[:page_size]],
                next_page_token=str(millis_from_dt(occurences[-1].end_time)) if len(occurences) > page_size else None,
            )

    def ListEventAttendees(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0
            occurence = session.query(EventOccurence).filter(EventOccurence.id == request.event_id).one_or_none()
            if not occurence:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)
            attendees = (
                occurence.attendees.filter(EventOccurenceAttendee.id >= next_user_id)
                .order_by(EventOccurenceAttendee.id)
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
                organizer_user_ids=[organizer.id for organizer in organizers[:page_size]],
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

            if not _can_edit_event(event, context.user_id):
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
                        user_id=context.user_id,
                        occurence_id=occurence.id,
                        attendee_status=attendancestate2sql[request.attendance_state],
                    )
                    session.add(attendance)

            session.flush()

            return event_to_pb(occurence, context.user_id)

    def ListMyEvents(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

            occurences = session.query(EventOccurence).join(Event, Event.id == EventOccurence.event_id)

            include_all = not (request.subscribed or request.attending or request.organizing)
            include_subscribed = request.subscribed or include_all
            include_organizing = request.organizing or include_all
            include_attending = request.attending or include_all

            filter_ = []

            if include_subscribed:
                occurences = occurences.outerjoin(
                    EventSubscription,
                    and_(EventSubscription.event_id == Event.id, EventSubscription.user_id == context.user_id),
                )
                filter_.append(EventSubscription.user_id != None)
            if include_organizing:
                occurences = occurences.outerjoin(
                    EventOrganizer, and_(EventOrganizer.event_id == Event.id, EventOrganizer.user_id == context.user_id)
                )
                filter_.append(EventOrganizer.user_id != None)
            if include_attending:
                occurences = occurences.outerjoin(
                    EventOccurenceAttendee,
                    and_(
                        EventOccurenceAttendee.occurence_id == EventOccurence.id,
                        EventOccurenceAttendee.user_id == context.user_id,
                    ),
                )
                filter_.append(EventOccurenceAttendee.user_id != None)

            occurences = occurences.filter(or_(*filter_))

            if not request.past:
                occurences = occurences.filter(EventOccurence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.asc()
                )
            else:
                occurences = occurences.filter(EventOccurence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.desc()
                )

            occurences = occurences.limit(page_size + 1).all()

            return events_pb2.ListMyEventsRes(
                events=[event_to_pb(occurence, context.user_id) for occurence in occurences[:page_size]],
                next_page_token=str(millis_from_dt(occurences[-1].end_time)) if len(occurences) > page_size else None,
            )

    def InviteEventOrganizer(self, request, context):
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

            if not _can_edit_event(event, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.EVENT_EDIT_PERMISSION_DENIED)

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
                session.query(Event, EventOccurence)
                .filter(EventOccurence.id == request.event_id)
                .filter(EventOccurence.event_id == Event.id)
                .one_or_none()
            )

            if not res:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

            event, occurence = res

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
