import re
from datetime import UTC, datetime, timedelta

import ics
import pytest

from couchers.email.calendar_events import create_event_ics_calendar, create_host_request_ics_calendar
from couchers.i18n.context import LocalizationContext
from couchers.proto import events_pb2, messages_pb2, requests_pb2
from couchers.utils import Timestamp_from_datetime, today
from tests.fixtures.db import generate_user
from tests.fixtures.misc import EmailCollector, Moderator
from tests.fixtures.sessions import requests_session
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_host_request_ics_content():
    host_request = requests_pb2.HostRequest(
        host_request_id=42, from_date="2000-01-01", to_date="2000-01-02", hosting_city="New York"
    )

    ics: str = create_host_request_ics_calendar(
        host_request, other_name="Bob", hosting=True, loc_context=LocalizationContext.en_utc()
    ).serialize()
    assert _assert_ics_matches_pattern(
        ics,
        """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
SEQUENCE:***
DTSTART;VALUE=DATE:20000101
DTEND;VALUE=DATE:20000103
DESCRIPTION:***/42
LOCATION:New York
SUMMARY:Hosting Bob
UID:host_request.42@***
URL:***/42
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """,
    )


def test_host_request_cancelled_ics_content():
    host_request = requests_pb2.HostRequest(
        host_request_id=42,
        from_date="2000-01-01",
        to_date="2000-01-02",
        hosting_city="New York",
        status=messages_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
    )

    ics: str = create_host_request_ics_calendar(
        host_request, other_name="Bob", hosting=True, loc_context=LocalizationContext.en_utc()
    ).serialize()
    assert _assert_ics_matches_pattern(
        ics,
        """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
SEQUENCE:***
DTSTART;VALUE=DATE:20000101
DTEND;VALUE=DATE:20000103
DESCRIPTION:***/42
LOCATION:New York
STATUS:CANCELLED
SUMMARY:Cancelled: Hosting Bob
UID:host_request.42@***
URL:***/42
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """,
    )


def test_event_ics_content():
    event = events_pb2.Event(
        event_id=42,
        title="Event Title",
        slug="event-slug",
        content="Event description",
        start_time=Timestamp_from_datetime(datetime(2000, 1, 1, 12, 0, tzinfo=UTC)),
        end_time=Timestamp_from_datetime(datetime(2000, 1, 2, 12, 0, tzinfo=UTC)),
        location=events_pb2.EventLocation(address="City, Country", lat=0.1, lng=0.1),
    )

    ics: str = create_event_ics_calendar(event, loc_context=LocalizationContext.en_utc()).serialize()
    assert _assert_ics_matches_pattern(
        ics,
        """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
SEQUENCE:***
DTSTART;20000101T120000Z
DTEND;20000102T120000Z
DESCRIPTION:Event description
LOCATION:City, Country
STATUS:CANCELLED
SUMMARY:Event Title
UID:event.42@***
URL:***/42
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """,
    )


def _assert_ics_matches_pattern(actual: str, expected_pattern: str) -> str:
    actual = actual.replace("\r\n", "\n").strip()
    expected_pattern = expected_pattern.strip()

    expected_pattern = re.escape(expected_pattern).replace("\*\*\*", ".*?")
    return re.fullmatch(expected_pattern, actual)


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
                status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
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
                status=messages_pb2.HOST_REQUEST_STATUS_CONFIRMED,
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
                status=messages_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Cancelling host request",
            )
        )

    email = email_collector.pop_for_recipient(host.email, last=True)
    assert "cancel" in email.subject and surfer.name in email.subject
    ics_event = _get_email_ics_attachment_calendar_event(email)
    assert _get_ics_event_sequence(ics_event) == 1
    assert ics_event.status == "CANCELLED"


def test_host_request_attachments_disabled(db, email_collector: EmailCollector, feature_flags, moderator: Moderator):
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

    moderator.approve_host_request(hr_id)

    email_collector.pop_for_recipient(host.email, last=True)

    # Host accepts: normally the surfer would get a calendar attachment, but the flag is off
    with requests_session(host_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    email = email_collector.pop_for_recipient(surfer.email, last=True)
    assert "accept" in email.subject and host.name in email.subject
    assert not email.attachments


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
