from datetime import date, datetime, time, timedelta

from couchers.proto import events_pb2
from couchers.utils import today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import events_session

_DEFAULT_EVENT_LOCATION = events_pb2.EventLocation(address="Near Null Island", lat=0.1, lng=0.2)


def create_event(
    *,
    token: str,
    title: str | None = "Dummy Title",
    content: str | None = "Dummy content.",
    photo_key: str | None = None,
    location: events_pb2.EventLocation | None = _DEFAULT_EVENT_LOCATION,
    # API accepts local times so don't take datetime, which are usually tz-aware.
    start_date_time: tuple[date, time] | None = None,
    end_date_time: tuple[date, time] | None = None,
    approve_by: Moderator | None = None,
) -> events_pb2.Event:
    if start_date_time is None:
        start_date_time = (today() + timedelta(days=1), time(12, 0))
    if end_date_time is None:
        end_datetime = datetime.combine(start_date_time[0], start_date_time[1]) + timedelta(hours=1)
        end_date_time = (end_datetime.date(), end_datetime.time())

    with events_session(token) as api:
        start_datetime_iso8601 = f"{start_date_time[0].isoformat()}T{start_date_time[1].isoformat()}"
        end_datetime_iso8601 = f"{end_date_time[0].isoformat()}T{end_date_time[1].isoformat()}"
        event: events_pb2.Event = api.CreateEvent(
            events_pb2.CreateEventReq(
                title=title,
                content=content,
                photo_key=photo_key,
                location=location,
                start_datetime_iso8601_local=start_datetime_iso8601,
                end_datetime_iso8601_local=end_datetime_iso8601,
            )
        )

    if approve_by is not None:
        approve_by.approve_event_occurrence(event.event_id)

    return event


def get_event(token: str, event_id: int) -> events_pb2.Event:
    with events_session(token) as api:
        event: events_pb2.Event = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        return event
