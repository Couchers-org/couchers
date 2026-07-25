from datetime import UTC, datetime
from email.headerregistry import Address
from typing import Literal
from zoneinfo import ZoneInfo

from ics import Calendar, Event, Geo
from ics.grammar.parse import ContentLine  # type: ignore[import-untyped]

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

    event = Event()
    event.uid = _event_uid(host_request.host_request_id, kind="host_request")
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

    event.name = _final_title(
        title,
        loc_context,
        is_cancelled=host_request.status == messages_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
    )

    # Our to_date is inclusive, iCalendar's DTEND is exclusive (for full-day events)
    # make_all_day will adjust the end date by one day accordingly.
    event.begin = host_request.from_date
    event.end = host_request.to_date
    event.make_all_day()

    event.location = host_request.hosting_city
    event.url = urls.host_request(host_request_id=str(host_request.host_request_id))

    # Google Calendar™ will hide the URL if there is a location, so also include it in the description
    event.description = event.url

    if host_request.status == messages_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        event.status = "CANCELLED"

    return event


def create_event_ics_calendar(event: events_pb2.Event, loc_context: LocalizationContext) -> Calendar:
    ics_event = create_event_ics_event(event, loc_context)

    # METHOD:PUBLISH means this is part of a stream of calendar event information.
    # It allows for later cancellation, and doesn't expose accept/decline functionality.
    return ics_event_to_calendar(ics_event, "PUBLISH", loc_context)


def create_event_ics_event(event: events_pb2.Event, loc_context: LocalizationContext) -> Event:
    """Creates an ics event for a host request."""

    ics_event = Event()
    ics_event.uid = _event_uid(event.event_id, kind="event")
    ics_event.name = _final_title(event.title, loc_context, is_cancelled=event.is_cancelled)

    last_update_datetime = to_aware_datetime(event.created if event.last_edited.seconds == 0 else event.last_edited)
    ics_event.last_modified = last_update_datetime
    _set_sequence_timestamp(ics_event, last_update_datetime)

    _set_datetime_with_timezone(ics_event, "DTSTART", to_aware_datetime(event.start_time, event.timezone))
    _set_datetime_with_timezone(ics_event, "DTEND", to_aware_datetime(event.end_time, event.timezone))

    ics_event.location = event.location.address
    ics_event.geo = Geo(event.location.lat, event.location.lng)
    url = urls.event_link(occurrence_id=event.event_id, slug=event.slug)
    ics_event.url = url
    # Google Calendar™ will hide the URL if there is a location, so also include it in the description
    ics_event.description = markdown_to_plaintext(event.content) + "\n\n" + url

    if event.is_cancelled:
        ics_event.status = "CANCELLED"

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
    event.extra.append(ContentLine(name="SEQUENCE", value=str(timestamp)))


def _set_datetime_with_timezone(event: Event, name: str, dt: datetime) -> None:
    """
    Adds a property whose value is a datetime with a timezone.
    Working around that ics's native Event.begin/end properties don't encode the timezone.
    """
    datetime_format = "%Y%m%dT%H%M%S"
    params: dict[str, list[str]] = {}
    value: str
    if isinstance(dt.tzinfo, ZoneInfo) and dt.tzinfo.key != "Etc/UTC":
        params["TZID"] = [dt.tzinfo.key]
        value = dt.strftime(datetime_format)
    else:
        value = dt.astimezone(UTC).strftime(datetime_format) + "Z"
    event.extra.append(ContentLine(name, params, value=value))


def ics_event_to_calendar(event: Event, method: str | None, loc_context: LocalizationContext) -> Calendar:
    # PRODID is mandatory and generally follows "-//[Organization]//[Product Name]//[Language]"
    calendar = Calendar(creator=f"-//Couchers.org//Couchers//{loc_context.locale.upper()}")
    if method:
        calendar.method = method
    calendar.events.add(event)
    return calendar


def ics_calendar_to_attachment(calendar: Calendar, filename: str) -> EmailPart:
    data = calendar.serialize().encode("utf-8")
    content_disposition = f'attachment; filename="{filename}"'
    content_type = 'text/calendar; charset="utf-8"'
    if calendar.method:
        # The SMTP Content-Type "method" parameter must match the value in the ics file.
        # AI recommends avoiding quotes on this parameter for backwards compatibility with old email clients.
        content_type += f"; method={calendar.method}"

    return EmailPart(data=data, content_disposition=content_disposition, content_type=content_type)
