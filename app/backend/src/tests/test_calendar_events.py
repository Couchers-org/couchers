import re
from datetime import timedelta

import ics
import pytest

from couchers.email.calendar_events import create_host_request_calendar, create_host_request_cancellation_calendar
from couchers.i18n.context import LocalizationContext
from couchers.proto import conversations_pb2, requests_pb2
from couchers.proto.requests_pb2 import HostRequest
from couchers.utils import today
from tests.fixtures.db import generate_user
from tests.fixtures.misc import EmailCollector, Moderator
from tests.fixtures.sessions import requests_session
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_initial_ics_content():
    host_request = HostRequest(
        host_request_id=42, from_date="2000-01-01", to_date="2000-01-02", hosting_city="New York"
    )

    ics: str = create_host_request_calendar(
        host_request, other_name="Bob", hosting=True, loc_context=LocalizationContext.en_utc()
    ).serialize()
    assert _normalize_ics(ics) == _normalize_ics("""
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
SEQUENCE:0
DTSTART;VALUE=DATE:20000101
DTEND;VALUE=DATE:20000103
DESCRIPTION:<stripped>/42
LOCATION:New York
SUMMARY:Hosting Bob
UID:host_request.42@<stripped>
URL:<stripped>/42
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """)


def test_cancellation_ics_content():
    host_request = HostRequest(
        host_request_id=42, from_date="2000-01-01", to_date="2000-01-02", hosting_city="New York"
    )

    ics: str = create_host_request_cancellation_calendar(
        host_request, other_name="Bob", hosting=True, loc_context=LocalizationContext.en_utc()
    ).serialize()
    assert _normalize_ics(ics) == _normalize_ics("""
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
SEQUENCE:1
DTSTART;VALUE=DATE:20000101
DTEND;VALUE=DATE:20000103
DESCRIPTION:<stripped>/42
LOCATION:New York
STATUS:CANCELLED
SUMMARY:Cancelled: Hosting Bob
UID:host_request.42@<stripped>
URL:<stripped>/42
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """)


def _normalize_ics(ics: str) -> str:
    # Normalize whitespace:
    # - The ics library produces '\r\n', in-code literals are '\n'
    # - In-code literals have start/end newlines and indentation.
    ics = ics.replace("\r\n", "\n").strip()

    # Strip the domain in the UID, which depends on environment variables
    ics = re.sub(
        r"^UID:.*@(.*)$", lambda match: match[0].removesuffix(match[1]) + "<stripped>", ics, flags=re.MULTILINE
    )

    # Strip the domain in the URL and DESCRIPTION, which depends on environment variables
    ics = re.sub(r"^(DESCRIPTION|URL):(.*)/(\d+)", r"\1:<stripped>/\3", ics, flags=re.MULTILINE)

    return ics


def test_host_request_attachments(db, email_collector: EmailCollector, moderator: Moderator):
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    from_date = today() + timedelta(days=2)
    to_date = today() + timedelta(days=3)

    # Send the host request, no calendar attachment yet
    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host.id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id

    moderator.approve_host_request(hr_id)

    email = email_collector.pop_for_recipient(host.email, last=True)
    assert "request" in email.subject and surfer.name in email.subject
    assert not email.attachments

    # Host accepts, surfer gets a calendar attachment
    with requests_session(host_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    email = email_collector.pop_for_recipient(surfer.email, last=True)
    assert "accept" in email.subject and host.name in email.subject
    ics_event = _get_email_ics_attachment_calendar_event(email)
    assert _get_ics_event_sequence(ics_event) == 0
    assert not ics_event.status
    assert ics_event.begin.date() == from_date
    assert ics_event.end.date() == (to_date + timedelta(days=1))
    assert ics_event.name == f"Surfing with {host.name}"
    assert ics_event.location == host.city

    # Surfer confirms, host gets a calendar attachment
    with requests_session(surfer_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
                text="Confirming host request",
            )
        )

    email = email_collector.pop_for_recipient(host.email, last=True)
    assert "confirm" in email.subject and surfer.name in email.subject
    ics_event = _get_email_ics_attachment_calendar_event(email)
    assert _get_ics_event_sequence(ics_event) == 0
    assert not ics_event.status
    assert ics_event.name == f"Hosting {surfer.name}"

    # Surfer cancels, host gets a calendar attachment
    with requests_session(surfer_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Cancelling host request",
            )
        )

    email = email_collector.pop_for_recipient(host.email, last=True)
    assert "cancel" in email.subject and surfer.name in email.subject
    ics_event = _get_email_ics_attachment_calendar_event(email)
    assert _get_ics_event_sequence(ics_event) == 1
    assert ics_event.status == "CANCELLED"


def test_host_request_attachments_disabled(db, feature_flags, moderator: Moderator):
    feature_flags.set("email_ics_attachments_enabled", False)

    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    from_date = today() + timedelta(days=2)
    to_date = today() + timedelta(days=3)

    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host.id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id

    with mock_notification_email():
        moderator.approve_host_request(hr_id)

    # Host accepts: normally the surfer would get a calendar attachment, but the flag is off
    with requests_session(host_token) as api:
        with mock_notification_email() as mock:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                    text="Accepting host request",
                )
            )

    e = email_fields(mock)
    assert "accept" in e.subject and host.name in e.subject
    assert not e.attachments


def _get_email_ics_attachment_calendar_event(e) -> ics.Event:
    assert len(e.attachments or []) == 1
    ics_attachment = e.attachments[0]
    assert ics_attachment.content_type.startswith("text/calendar")
    ics_calendar = ics.Calendar(ics_attachment.data.decode("utf-8"))
    assert f"method={ics_calendar.method}" in ics_attachment.content_type
    assert len(ics_calendar.events) == 1
    return next(iter(ics_calendar.events))


def _get_ics_event_sequence(event: ics.Event) -> int | None:
    for x in event.extra:
        if x.name == "SEQUENCE":
            return int(x.value)
    return None
