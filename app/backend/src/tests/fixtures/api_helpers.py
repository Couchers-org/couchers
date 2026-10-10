from datetime import date, datetime, time, timedelta

from google.protobuf import wrappers_pb2

from couchers.proto import events_pb2
from couchers.utils import today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import events_session

_DEFAULT_EVENT_LOCATION = events_pb2.EventLocation(address="Near Null Island", lat=0.1, lng=0.2)


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
    location: events_pb2.EventLocation | None = _DEFAULT_EVENT_LOCATION,
    # API accepts local times so don't take datetime, which are usually tz-aware.
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
    location: events_pb2.EventLocation | None = _DEFAULT_EVENT_LOCATION,
    # Required since occurrences of the same event can't overlap, so there's no safe default.
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
