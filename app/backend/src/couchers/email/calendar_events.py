from email.headerregistry import Address

from ics import Calendar, Event
from ics.grammar.parse import ContentLine  # type: ignore[import-untyped]

from couchers import urls
from couchers.config import config
from couchers.email.locales import get_emails_i18next
from couchers.i18n import LocalizationContext
from couchers.proto.internal.jobs_pb2 import EmailPart
from couchers.proto.requests_pb2 import HostRequest

HOST_REQUEST_ICS_FILENAME = "host_request.ics"


def create_host_request_attachment(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> EmailPart:
    calendar = create_host_request_calendar(host_request, other_name, hosting, loc_context)
    return calendar_to_attachment(calendar, HOST_REQUEST_ICS_FILENAME)


def create_host_request_calendar(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> Calendar:
    event = create_host_request_event(host_request, other_name, hosting, loc_context)

    # METHOD:PUBLISH means this is part of a stream of calendar event information.
    # It allows for later cancellation, and doesn't expose accept/decline functionality.
    return event_to_calendar(event, "PUBLISH", loc_context)


def create_host_request_event(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext, sequence: int = 0
) -> Event:
    """Creates an ics event for a host request."""

    event = Event()
    event.uid = get_host_request_event_uid(host_request.host_request_id)

    # Explicitly allow later sequencing of a cancellation with SEQUENCE:1
    event.extra.append(ContentLine(name="SEQUENCE", value=str(sequence)))

    if hosting:
        event.name = loc_context.localize_string(
            "calendar_events.host_requests.title_host", i18next=get_emails_i18next(), substitutions={"name": other_name}
        )
    else:
        event.name = loc_context.localize_string(
            "calendar_events.host_requests.title_surfer",
            i18next=get_emails_i18next(),
            substitutions={"name": other_name},
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

    return event


def create_host_request_cancellation_attachment(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> EmailPart:
    calendar = create_host_request_cancellation_calendar(host_request, other_name, hosting, loc_context)
    return calendar_to_attachment(calendar, HOST_REQUEST_ICS_FILENAME)


def create_host_request_cancellation_calendar(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> Calendar:
    event = create_host_request_event(host_request, other_name, hosting, loc_context, sequence=1)
    event.name = loc_context.localize_string(
        "calendar_events.title_cancelled", i18next=get_emails_i18next(), substitutions={"title": event.name}
    )
    event.status = "CANCELLED"

    # METHOD:PUBLISH means this is part of a stream of calendar event information.
    # Gmail™ will immediately remove the event from the user's calendar.
    # METHOD:CANCEL might leave the event in cancelled state or not work.
    return event_to_calendar(event, "PUBLISH", loc_context)


def event_to_calendar(event: Event, method: str | None, loc_context: LocalizationContext) -> Calendar:
    # PRODID is mandatory and generally follows "-//[Organization]//[Product Name]//[Language]"
    calendar = Calendar(creator=f"-//Couchers.org//Couchers//{loc_context.locale.upper()}")
    if method:
        calendar.method = method
    calendar.events.add(event)
    return calendar


def calendar_to_attachment(calendar: Calendar, filename: str) -> EmailPart:
    data = calendar.serialize().encode("utf-8")
    content_disposition = f'attachment; filename="{filename}"'
    content_type = 'text/calendar; charset="utf-8"'
    if calendar.method:
        # The SMTP Content-Type "method" parameter must match the value in the ics file.
        # AI recommends avoiding quotes on this parameter for backwards compatibility with old email clients.
        content_type += f"; method={calendar.method}"

    return EmailPart(data=data, content_disposition=content_disposition, content_type=content_type)


def get_host_request_event_uid(host_request_id: int) -> str:
    uid_domain = Address(addr_spec=config.NOTIFICATION_EMAIL_ADDRESS).domain
    return f"host_request.{host_request_id}@{uid_domain}"
