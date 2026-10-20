from datetime import date, datetime, timedelta
from email.headerregistry import Address
from typing import Literal
from zoneinfo import ZoneInfo

from icalendar import Calendar, Event

from couchers import urls
from couchers.config import config
from couchers.email.locales import get_emails_i18next
from couchers.i18n import LocalizationContext
from couchers.markup import markdown_to_plaintext
from couchers.proto import events_pb2, messages_pb2, requests_pb2
from couchers.proto.internal.jobs_pb2 import EmailPart
from couchers.utils import now, to_aware_datetime

HOST_REQUEST_ICS_FILENAME = "host_request.ics"


def create_host_request_attachment(
    host_request: requests_pb2.HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> EmailPart:
    calendar = create_host_request_ics_calendar(host_request, other_name, hosting, loc_context)
    return ics_calendar_to_attachment(calendar, HOST_REQUEST_ICS_FILENAME)


def create_host_request_ics_calendar(
    host_request: requests_pb2.HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> Calendar:
    event = create_host_request_ics_event(host_request, other_name, hosting, loc_context)

    # METHOD:PUBLISH means this is part of a stream of calendar event information.
    # It allows for later cancellation, and doesn't expose accept/decline functionality.
    # METHOD:CANCEL might leave the event in cancelled state or not work.
    return ics_event_to_calendar(event, "PUBLISH", loc_context)


def create_host_request_ics_event(
    host_request: requests_pb2.HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> Event:
    """Creates an ics event for a host request."""

    event = Event()  # type: ignore[no-untyped-call]
    event.add("uid", _event_uid(host_request.host_request_id, kind="host_request"))
    _set_sequence_timestamp(event, now())

    title: str
    if hosting:
        title = loc_context.localize_string(
            "calendar_events.host_requests.title_host", i18next=get_emails_i18next(), substitutions={"name": other_name}
        )
    else:
        title = loc_context.localize_string(
            "calendar_events.host_requests.title_surfer",
            i18next=get_emails_i18next(),
            substitutions={"name": other_name},
        )

    event.add(
        "summary",
        _final_title(
            title,
            loc_context,
            is_cancelled=host_request.status == messages_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
        ),
    )

    # Our to_date is inclusive, iCalendar's DTEND is exclusive (for full-day events), hence the +1 day.
    event.add("dtstart", date.fromisoformat(host_request.from_date))
    event.add("dtend", date.fromisoformat(host_request.to_date) + timedelta(days=1))

    event.add("location", host_request.hosting_city)
    url = urls.host_request(host_request_id=str(host_request.host_request_id))
    event.add("url", url)

    # Google Calendar™ will hide the URL if there is a location, so also include it in the description
    event.add("description", url)

    if host_request.status == messages_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        event.add("status", "CANCELLED")

    return event


def create_event_ics_calendar(event: events_pb2.Event, loc_context: LocalizationContext) -> Calendar:
    ics_event = create_event_ics_event(event, loc_context)

    # METHOD:PUBLISH means this is part of a stream of calendar event information.
    # It allows for later cancellation, and doesn't expose accept/decline functionality.
    return ics_event_to_calendar(ics_event, "PUBLISH", loc_context)


def create_event_ics_event(event: events_pb2.Event, loc_context: LocalizationContext) -> Event:
    """Creates an ics event for a host request."""

    ics_event = Event()  # type: ignore[no-untyped-call]
    ics_event.add("uid", _event_uid(event.event_id, kind="event"))
    ics_event.add("summary", _final_title(event.title, loc_context, is_cancelled=event.is_cancelled))

    last_update_datetime = to_aware_datetime(event.created if event.last_edited.seconds == 0 else event.last_edited)
    ics_event.add("last-modified", last_update_datetime)
    _set_sequence_timestamp(ics_event, last_update_datetime)

    timezone = ZoneInfo(event.timezone)
    ics_event.add("dtstart", to_aware_datetime(event.start_time).astimezone(timezone))
    ics_event.add("dtend", to_aware_datetime(event.end_time).astimezone(timezone))

    ics_event.add("location", event.location.address)
    ics_event.add("geo", (event.location.lat, event.location.lng))
    url = urls.event_link(occurrence_id=event.event_id, slug=event.slug)
    ics_event.add("url", url)
    # Google Calendar™ will hide the URL if there is a location, so also include it in the description
    ics_event.add("description", markdown_to_plaintext(event.content) + "\n\n" + url)

    if event.is_cancelled:
        ics_event.add("status", "CANCELLED")

    return ics_event


def _final_title(title: str, loc_context: LocalizationContext, *, is_cancelled: bool) -> str:
    if is_cancelled:
        title = loc_context.localize_string(
            "calendar_events.title_cancelled", i18next=get_emails_i18next(), substitutions={"title": title}
        )
    return title


def _event_uid(item_id: int, *, kind: Literal["host_request"] | Literal["event"]) -> str:
    uid_domain = Address(addr_spec=config.NOTIFICATION_EMAIL_ADDRESS).domain
    return f"{kind}.{item_id}@{uid_domain}"


def _set_sequence_timestamp(event: Event, dt: datetime) -> None:
    # SEQUENCE is 32-bit, so only support second granularity to avoid overflows
    # A better implementation would need to reply on a stored sequence number.
    timestamp = round(dt.timestamp())
    event.add("sequence", timestamp)


def ics_event_to_calendar(event: Event, method: str | None, loc_context: LocalizationContext) -> Calendar:
    calendar = Calendar()  # type: ignore[no-untyped-call]
    # PRODID is mandatory and generally follows "-//[Organization]//[Product Name]//[Language]"
    calendar.add("prodid", f"-//Couchers.org//Couchers//{loc_context.preferred_locale.upper()}")
    calendar.add("version", "2.0")
    if method:
        calendar.add("method", method)
    calendar.add_component(event)
    return calendar


def ics_calendar_to_attachment(calendar: Calendar, filename: str) -> EmailPart:
    data = calendar.to_ical()
    content_disposition = f'attachment; filename="{filename}"'
    content_type = 'text/calendar; charset="utf-8"'
    method = calendar.get("method")
    if method:
        # The SMTP Content-Type "method" parameter must match the value in the ics file.
        # AI recommends avoiding quotes on this parameter for backwards compatibility with old email clients.
        content_type += f"; method={method}"

    return EmailPart(data=data, content_disposition=content_disposition, content_type=content_type)
