from contextlib import contextmanager
from datetime import date, datetime, time, timedelta
from typing import cast

import grpc
from google.protobuf import wrappers_pb2

from couchers.proto import events_pb2, events_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.servicers.events import Events
from couchers.utils import today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel

# Event location constants which timezone_areas.sql-fake has regions for.
# Neutral default location. Resolves to Etc/GMT with real dataset and Etc/UTC with fake dataset.
EVENT_LOCATION_DEFAULT_UTC = events_pb2.EventLocation(address="Near Null Island", lat=0.1, lng=0.2)
EVENT_LOCATION_HELSINKI = events_pb2.EventLocation(address="Helsinki, Finland", lat=60.192059, lng=24.945831)
EVENT_LOCATION_NEW_YORK = events_pb2.EventLocation(address="New York, New York", lat=40.712776, lng=-74.005974)


def _date_time_to_iso8601(value: tuple[date, time]) -> str:
    return f"{value[0].isoformat()}T{value[1].isoformat()}"


def _one_hour_after(value: tuple[date, time]) -> tuple[date, time]:
    end_datetime = datetime.combine(value[0], value[1]) + timedelta(hours=1)
    return end_datetime.date(), end_datetime.time()


def _string_value(value: str | None) -> wrappers_pb2.StringValue | None:
    return wrappers_pb2.StringValue(value=value) if value is not None else None


def _int64_value(value: int | None) -> wrappers_pb2.Int64Value | None:
    return wrappers_pb2.Int64Value(value=value) if value is not None else None


def weekly_recurrence(*, interval: int = 1, ends_on_date: date) -> events_pb2.CreateEventRecurrence:
    return events_pb2.CreateEventRecurrence(weekly_interval=interval, ends_on_date=ends_on_date.isoformat())


@contextmanager
def _events_session(token: str):
    channel = FakeChannel(token)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), cast(grpc.Server, channel))
    yield events_pb2_grpc.EventsStub(cast(grpc.Channel, channel))


def create_event(
    *,
    token: str,
    title: str | None = "Dummy Title",
    content: str | None = "Dummy content.",
    photo_key: str | None = None,
    parent_community_id: int | None = None,
    location: events_pb2.EventLocation | None = EVENT_LOCATION_DEFAULT_UTC,
    # Force callers to provide local date/times, not datetimes with timezones,
    # since the API accepts local times and resolves the timezone from the location.
    start_date_time: tuple[date, time] | None = None,
    end_date_time: tuple[date, time] | None = None,
    recurrence: events_pb2.CreateEventRecurrence | None = None,
    approve_by: Moderator | None = None,
) -> events_pb2.Event:
    if start_date_time is None:
        start_date_time = (today() + timedelta(days=1), time(12, 0))
    if end_date_time is None:
        end_date_time = _one_hour_after(start_date_time)

    with _events_session(token) as session:
        event: events_pb2.Event = session.CreateEvent(
            events_pb2.CreateEventReq(
                title=title,
                content=content,
                photo_key=photo_key,
                parent_community_id=parent_community_id,
                location=location,
                start_datetime_iso8601_local=_date_time_to_iso8601(start_date_time),
                end_datetime_iso8601_local=_date_time_to_iso8601(end_date_time),
                recurrence=recurrence,
            )
        )

    if approve_by is not None:
        approve_by.approve_event_occurrence(event.event_id)

    return event


def schedule_event(
    *,
    token: str,
    event_id: int,
    content: str | None = "Dummy content.",
    photo_key: str | None = None,
    location: events_pb2.EventLocation | None = EVENT_LOCATION_DEFAULT_UTC,
    # Force callers to provide local date/times, not datetimes with timezones,
    # since the API accepts local times and resolves the timezone from the location.
    start_date_time: tuple[date, time],
    end_date_time: tuple[date, time] | None = None,
    approve_by: Moderator | None = None,
) -> events_pb2.Event:
    if end_date_time is None:
        end_date_time = _one_hour_after(start_date_time)

    with _events_session(token) as session:
        event: events_pb2.Event = session.ScheduleEvent(
            events_pb2.ScheduleEventReq(
                event_id=event_id,
                content=content,
                photo_key=photo_key,
                location=location,
                start_datetime_iso8601_local=_date_time_to_iso8601(start_date_time),
                end_datetime_iso8601_local=_date_time_to_iso8601(end_date_time),
            )
        )

    if approve_by is not None:
        approve_by.approve_event_occurrence(event.event_id)

    return event


def update_event(
    *,
    token: str,
    event_id: int,
    # None leaves the field unchanged.
    title: str | None = None,
    content: str | None = None,
    photo_key: str | None = None,
    location: events_pb2.EventLocation | None = None,
    start_date_time: tuple[date, time] | None = None,
    end_date_time: tuple[date, time] | None = None,
    update_all_future: bool = False,
    should_notify: bool = False,
    stop_recurrence: bool = False,
) -> events_pb2.Event:
    with _events_session(token) as session:
        event: events_pb2.Event = session.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                update_all_future=update_all_future,
                title=_string_value(title),
                content=_string_value(content),
                photo_key=_string_value(photo_key),
                location=location,
                start_datetime_iso8601_local=_string_value(
                    _date_time_to_iso8601(start_date_time) if start_date_time is not None else None
                ),
                end_datetime_iso8601_local=_string_value(
                    _date_time_to_iso8601(end_date_time) if end_date_time is not None else None
                ),
                should_notify=should_notify,
                stop_recurrence=stop_recurrence,
            )
        )
    return event


def get_event(*, token: str, event_id: int) -> events_pb2.Event:
    with _events_session(token) as session:
        event: events_pb2.Event = session.GetEvent(events_pb2.GetEventReq(event_id=event_id))
    return event


def get_event_calendar_file(*, token: str, event_id: int) -> httpbody_pb2.HttpBody:
    with _events_session(token) as session:
        res: httpbody_pb2.HttpBody = session.GetEventCalendarFile(events_pb2.GetEventCalendarFileReq(event_id=event_id))
    return res


def transfer_event(
    *, token: str, event_id: int, new_owner_community_id: int | None = None, new_owner_group_id: int | None = None
) -> events_pb2.Event:
    with _events_session(token) as session:
        event: events_pb2.Event = session.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=event_id,
                new_owner_community_id=new_owner_community_id,
                new_owner_group_id=new_owner_group_id,
            )
        )
    return event


def request_community_invite(*, token: str, event_id: int) -> None:
    with _events_session(token) as session:
        session.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))


def set_event_subscription(*, token: str, event_id: int, subscribe: bool) -> events_pb2.Event:
    with _events_session(token) as session:
        event: events_pb2.Event = session.SetEventSubscription(
            events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=subscribe)
        )
    return event


def list_event_subscribers(
    *, token: str, event_id: int, page_size: int | None = None, page_token: str | None = None
) -> events_pb2.ListEventSubscribersRes:
    with _events_session(token) as session:
        res: events_pb2.ListEventSubscribersRes = session.ListEventSubscribers(
            events_pb2.ListEventSubscribersReq(event_id=event_id, page_size=page_size, page_token=page_token)
        )
    return res


def set_event_attendance(
    *, token: str, event_id: int, attendance_state: events_pb2.AttendanceState.ValueType
) -> events_pb2.Event:
    with _events_session(token) as session:
        event: events_pb2.Event = session.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=attendance_state)
        )
    return event


def list_event_attendees(
    *, token: str, event_id: int, page_size: int | None = None, page_token: str | None = None
) -> events_pb2.ListEventAttendeesRes:
    with _events_session(token) as session:
        res: events_pb2.ListEventAttendeesRes = session.ListEventAttendees(
            events_pb2.ListEventAttendeesReq(event_id=event_id, page_size=page_size, page_token=page_token)
        )
    return res


def invite_event_organizer(*, token: str, event_id: int, user_id: int) -> None:
    with _events_session(token) as session:
        session.InviteEventOrganizer(
            events_pb2.InviteEventOrganizerReq(
                event_id=event_id,
                user_id=user_id,
            )
        )


def remove_event_organizer(*, token: str, event_id: int, user_id: int | None = None) -> None:
    with _events_session(token) as session:
        session.RemoveEventOrganizer(
            events_pb2.RemoveEventOrganizerReq(
                event_id=event_id,
                user_id=_int64_value(user_id),
            )
        )


def list_event_organizers(
    *, token: str, event_id: int, page_size: int | None = None, page_token: str | None = None
) -> events_pb2.ListEventOrganizersRes:
    with _events_session(token) as session:
        res: events_pb2.ListEventOrganizersRes = session.ListEventOrganizers(
            events_pb2.ListEventOrganizersReq(event_id=event_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_event_occurrences(
    *,
    token: str,
    event_id: int,
    past: bool = False,
    include_cancelled: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
) -> events_pb2.ListEventOccurrencesRes:
    with _events_session(token) as session:
        res: events_pb2.ListEventOccurrencesRes = session.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(
                event_id=event_id,
                past=past,
                include_cancelled=include_cancelled,
                page_size=page_size,
                page_token=page_token,
            )
        )
    return res


def list_all_events(
    *,
    token: str,
    past: bool = False,
    include_cancelled: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
) -> events_pb2.ListAllEventsRes:
    with _events_session(token) as session:
        res: events_pb2.ListAllEventsRes = session.ListAllEvents(
            events_pb2.ListAllEventsReq(
                past=past, include_cancelled=include_cancelled, page_size=page_size, page_token=page_token
            )
        )
    return res


def list_my_events(
    *,
    token: str,
    attending: bool = False,
    exclude_attending: bool = False,
    subscribed: bool = False,
    organizing: bool = False,
    include_cancelled: bool = False,
    my_communities: bool = False,
    my_communities_exclude_global: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
    page_number: int | None = None,
) -> events_pb2.ListMyEventsRes:
    with _events_session(token) as session:
        res: events_pb2.ListMyEventsRes = session.ListMyEvents(
            events_pb2.ListMyEventsReq(
                attending=attending,
                exclude_attending=exclude_attending,
                subscribed=subscribed,
                organizing=organizing,
                include_cancelled=include_cancelled,
                my_communities=my_communities,
                my_communities_exclude_global=my_communities_exclude_global,
                page_size=page_size,
                page_token=page_token,
                page_number=page_number,
            )
        )
    return res


def cancel_event(*, token: str, event_id: int) -> None:
    with _events_session(token) as session:
        session.CancelEvent(events_pb2.CancelEventReq(event_id=event_id))
