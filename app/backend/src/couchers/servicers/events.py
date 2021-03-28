import grpc
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import (
    can_moderate_at,
    can_moderate_node,
    get_node_parents_recursively,
    get_parent_node_at_location,
    session_scope,
)
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Event,
    EventOccurence,
    EventType,
    EventVersion,
    Node,
    Thread,
    Upload,
    User,
)
from couchers.servicers.threads import pack_thread_id
from couchers.utils import Timestamp_from_datetime, create_coordinate, to_aware_datetime
from pb import events_pb2, events_pb2_grpc

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
    """
    Checks if the user is allowed to moderate this event
    """
    # checks if either the event is in the exclusive moderation area of a node
    with session_scope() as session:
        latest_occurence = event.occurences[-1]

        # if the event has a location, we firstly check if we are the moderator of any node that contains this event
        if latest_occurence.geom is not None and can_moderate_at(session, user_id, latest_occurence.geom):
            return True

        # if the event is owned by a cluster, then any moderator of that cluster can moderate this event
        if event.owner_cluster is not None and can_moderate_node(session, user_id, event.owner_cluster.parent_node_id):
            return True

        # finally check if the user can moderate the parent node of the cluster
        return can_moderate_node(session, user_id, event.parent_node_id)


def _occurence_to_pb(occurence: EventOccurence, user_id, is_next):
    return events_pb2.Occurence(
        event_id=occurence.event_id,
        occurence_id=occurence.id,
        is_next=is_next,
        is_past=occurence.end_time <= now(),
        is_future=occurence.end_time >= now(),
        content=occurence.content,
        photo_url=occurence.photo.thumbnail_url if occurence.photo else None,
        is_online=occurence.is_online,
        location=events_pb2.Coordinate(
            lat=occurence.coordinates[0],
            lng=occurence.coordinates[1],
        )
        if occurence.geom
        else None,
        link=occurence.link,
        address=occurence.address,
        created=Timestamp_from_datetime(occurence.created),
        last_edited=Timestamp_from_datetime(occurence.last_edited),
        creator_user_id=occurence.creator_user_id,
        start_time=Timestamp_from_datetime(occurence.start_time),
        end_time=Timestamp_from_datetime(occurence.end_time),
        timezone=occurence.timezone,
        start_time_display=str(occurence.start_time),
        end_time_display=str(occurence.end_time),
        # attendance_state=occurence.attendance_state,
        # going_count=occurence.going_count,
        # maybe_count=occurence.maybe_count,
        # organizer_count=occurence.organizer_count,
    )


def event_to_pb(event: Event, user_id):
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

    return events_pb2.Event(
        event_id=event.id,
        title=event.title,
        slug=event.slug,
        creator_user_id=event.creator_user_id,
        owner_user_id=event.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread_id=event.thread_id,
        occurences=[
            _occurence_to_pb(occurence, user_id, is_next=(occurence.id == next_occurence.id))
            for occurence in event.occurences
        ],
        # organizer=user_id in event.organizer,
        # subscriber=event.subscriber,
        # organizer_count=event.organizer_count,
        # subscriber_count=event.subscriber_count,
        can_edit=_is_event_owner(event, user_id),
        can_moderate=_can_moderate_event(event, user_id),
    )


class Events(events_pb2_grpc.EventsServicer):
    def CreateEvent(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_CONTENT)
        if request.is_online:
            address = None
            geom = None
            link = request.link
        else:
            if not (request.address and request.HasField("location")):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_EVENT_ADDRESS_OR_LOCATION)
            if request.location.lat == 0 and request.location.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            address = request.address
            geom = create_coordinate(request.location.lat, request.location.lng)
            link = None

        start_time = to_aware_datetime(request.start_time)
        end_time = to_aware_datetime(request.end_time)

        if start_time < now():
            pass  # start time in the past
        if end_time < start_time:
            pass  # ends before starts
        if end_time - start_time > timedelta(days=7):
            pass  # longer than 7 days
        if start_time - now() > timedelta(days=365):
            pass  # starts one year or later

        with session_scope() as session:
            if request.photo_key and not session.query(Upload).filter(Upload.key == request.photo_key).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

        title
        content
        photo_key
        is_online
        link
        parent_community_id
        address
        location
        start_time
        end_time
        timezone
        return events_pb2.Event()

    def ScheduleOccurence(self, request, context):
        return events_pb2.Event()

    def GetEvent(self, request, context):
        return events_pb2.Event()

    def UpdateEvent(self, request, context):
        return events_pb2.Event()

    def UpdateOccurence(self, request, context):
        return events_pb2.Event()

    def TransferEvent(self, request, context):
        return events_pb2.Event()

    def SubscribeToEvent(self, request, context):
        return events_pb2.Event()

    def SetOccurenceAttendance(self, request, context):
        return events_pb2.Event()
