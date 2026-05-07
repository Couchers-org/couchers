from email.headerregistry import Address

from ics import Calendar, Event
from ics.grammar.parse import ContentLine

from couchers import urls
from couchers.config import config
from couchers.email.rendering import get_emails_i18next
from couchers.i18n import LocalizationContext
from couchers.proto.internal.jobs_pb2 import EmailAttachment
from couchers.proto.requests_pb2 import HostRequest


def create_host_request_attachment(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> EmailAttachment:
    ics = create_host_request_ics(host_request, other_name, hosting, loc_context)
    return create_ics_attachment(ics)


def create_host_request_ics(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> str:
    calendar = Calendar()
    # PRODID is mandatory and generally follows "-//[Organization]//[Product Name]//[Language]"
    calendar.creator = f"-//Couchers.org//Couchers//{loc_context.locale.upper()}"
    calendar.events.add(create_host_request_event(host_request, other_name, hosting, loc_context))
    return calendar.serialize()


def create_host_request_event(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> Event:
    """Creates an ics event for a host request."""

    event = Event()
    event.uid = get_host_request_event_uid(host_request.host_request_id)

    if hosting:
        event.name = get_emails_i18next().localize(
            "calendar_events.host_requests.title_host", loc_context.locale, {"name": other_name}
        )
    else:
        event.name = get_emails_i18next().localize(
            "calendar_events.host_requests.title_surfer", loc_context.locale, {"name": other_name}
        )

    event.begin = host_request.from_date
    event.end = host_request.to_date
    event.make_all_day()  # Shifts the end date by one day

    event.location = host_request.hosting_city
    event.url = urls.host_request(host_request_id=str(host_request.host_request_id))

    # Google Calendar™ will hide the URL if there is a location, so also include it in the description
    event.description = event.url

    return event


def create_host_request_cancellation_attachment(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> EmailAttachment:
    ics = create_host_request_cancellation_ics(host_request, other_name, hosting, loc_context)
    return create_ics_attachment(ics)


def create_host_request_cancellation_ics(
    host_request: HostRequest, other_name: str, hosting: bool, loc_context: LocalizationContext
) -> str:
    calendar = Calendar()
    calendar.method = "CANCEL"

    event = create_host_request_event(host_request, other_name, hosting, loc_context)
    event.name = get_emails_i18next().localize(
        "calendar_events.title_cancelled", loc_context.locale, {"title": event.name}
    )
    event.status = "CANCELLED"
    event.extra.append(ContentLine(name="SEQUENCE", value="1"))

    calendar.events.add(event)
    return calendar.serialize()


def create_ics_attachment(ics: str) -> EmailAttachment:
    return EmailAttachment(
        filename="host_request.ics",
        mime_type="text/calendar",
        data=ics.encode("utf-8"),
    )


def get_host_request_event_uid(host_request_id: int) -> str:
    uid_domain = Address(addr_spec=config["NOTIFICATION_EMAIL_ADDRESS"]).domain
    return f"host_request.{host_request_id}@{uid_domain}"
