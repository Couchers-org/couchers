"""
Exposes typed functions mapping 1-to-1 to backend APIs, encapsulating protobuf encoding boilerplate.
Functions have neutral defaults for tests that don't need specific parameter values.
"""

from datetime import date, datetime, time, timedelta

from google.protobuf import wrappers_pb2

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.proto import conversations_pb2, events_pb2, requests_pb2
from couchers.utils import today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import conversations_session, events_session, requests_session

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
    approve_by: Moderator | None = None,
) -> events_pb2.Event:
    if start_date_time is None:
        start_date_time = (today() + timedelta(days=1), time(12, 0))
    if end_date_time is None:
        end_date_time = _one_hour_after(start_date_time)

    with events_session(token) as api:
        event: events_pb2.Event = api.CreateEvent(
            events_pb2.CreateEventReq(
                title=title,
                content=content,
                photo_key=photo_key,
                parent_community_id=parent_community_id,
                location=location,
                start_datetime_iso8601_local=_date_time_to_iso8601(start_date_time),
                end_datetime_iso8601_local=_date_time_to_iso8601(end_date_time),
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

    with events_session(token) as api:
        event: events_pb2.Event = api.ScheduleEvent(
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
) -> events_pb2.Event:
    with events_session(token) as api:
        event: events_pb2.Event = api.UpdateEvent(
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
            )
        )
        return event


def get_event(token: str, event_id: int) -> events_pb2.Event:
    with events_session(token) as api:
        event: events_pb2.Event = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        return event


def valid_request_text(text: str = "Test request") -> str:
    """Pads a request text to a valid length."""
    # Request lengths are measured in utf-16 code units to match the frontend.
    utf16_length = len(text.encode("utf-16-le")) // 2
    if utf16_length >= HOST_REQUEST_MIN_LENGTH_UTF16:
        return text
    padding_length = HOST_REQUEST_MIN_LENGTH_UTF16 - utf16_length
    return text + ("_" * padding_length)  # Each "_" adds one utf16 code unit.


def create_host_request(
    *,
    token: str,
    host_user_id: int,
    from_date: date | None = None,
    to_date: date | None = None,
    text: str | None = None,
    public_trip_id: int | None = None,
    approve_by: Moderator | None = None,
) -> int:
    """Sends a host request from the user with `token`, by default for a night starting in two days."""
    if from_date is None:
        from_date = today() + timedelta(days=2)
    if to_date is None:
        to_date = from_date + timedelta(days=1)

    with requests_session(token) as api:
        host_request_id: int = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_user_id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text=text if text is not None else valid_request_text(),
                public_trip_id=public_trip_id,
            )
        ).host_request_id

    if approve_by is not None:
        approve_by.approve_host_request(host_request_id)

    return host_request_id


def create_group_chat(
    *,
    token: str,
    recipient_user_ids: list[int],
    title: str | None = None,
    messages: list[str] | None = None,
    approve_by: Moderator | None = None,
) -> int:
    """Creates a group chat as the user with `token`, sends `messages` into it, then has `approve_by` approve it."""
    with conversations_session(token) as api:
        group_chat_id: int = api.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=recipient_user_ids, title=_string_value(title))
        ).group_chat_id
        for message in messages or []:
            api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=message))

    if approve_by is not None:
        approve_by.approve_group_chat(group_chat_id)

    return group_chat_id
