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
    _assert_ics_matches_pattern(
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
    _assert_ics_matches_pattern(
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
        created=Timestamp_from_datetime(datetime(2000, 1, 1, 0, 0, tzinfo=UTC)),
        start_time=Timestamp_from_datetime(datetime(2000, 1, 2, 12, 0, tzinfo=UTC)),
        end_time=Timestamp_from_datetime(datetime(2000, 1, 3, 12, 0, tzinfo=UTC)),
        location=events_pb2.EventLocation(address="City, Country", lat=0.1, lng=0.1),
        timezone="Etc/GMT-1",  # Confusingly represents GMT+1, no DST
    )

    ics: str = create_event_ics_calendar(event, loc_context=LocalizationContext.en_utc()).serialize()
    _assert_ics_matches_pattern(
        ics,
        """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
UID:event.42@***
SEQUENCE:***
SUMMARY:Event Title
DESCRIPTION:Event description***/event/42/event-slug
DTSTART;TZID=Etc/GMT-1:20000102T130000
DTEND;TZID=Etc/GMT-1:20000103T130000
LAST-MODIFIED:20000101T000000Z
LOCATION:City\\, Country
GEO:0.100000;0.100000
URL:***/event/42/event-slug
END:VEVENT
METHOD:PUBLISH
END:VCALENDAR
    """,
    )


def _assert_ics_matches_pattern(actual: str, expected_pattern: str) -> str:
    """Assert that an ics file's content matches a pattern that includes "***" wildcards."""
    # Normalize whitespace
    actual = actual.replace("\r\n", "\n").strip()
    expected_pattern = expected_pattern.strip()

    # The ics library writes properties in an order that's hard to make sense of, and not important.
    # So approximate by sorting lines, and test them one at a time so we know which one fails.
    actual_lines = sorted(actual.splitlines())
    expected_pattern_lines = sorted(expected_pattern.splitlines())
    for actual_line, expected_pattern_line in zip(actual_lines, expected_pattern_lines, strict=True):
        # Convert the expected pattern from *** wildcards to a regex
        expected_line_regex = re.escape(expected_pattern_line).replace("\\*\\*\\*", ".*?")
        assert re.fullmatch(expected_line_regex, actual_line)


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
    accepted_ics_event = _get_email_ics_attachment_calendar_event(email)
    assert not accepted_ics_event.status
    assert accepted_ics_event.begin.date() == from_date
    assert accepted_ics_event.end.date() == (to_date + timedelta(days=1))
    assert accepted_ics_event.name == f"Surfing with {host.name}"
    assert accepted_ics_event.location == host.city

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
    confirmed_ics_event = _get_email_ics_attachment_calendar_event(email)
    assert not confirmed_ics_event.status
    assert confirmed_ics_event.name == f"Hosting {surfer.name}"

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
    cancelled_ics_event = _get_email_ics_attachment_calendar_event(email)
    # Ideally the sequence number are strictly ascending, but they are based on timestamps so in tests they could be equal.
    assert (_get_ics_event_sequence(cancelled_ics_event) or 0) >= (_get_ics_event_sequence(accepted_ics_event) or 0)
    assert cancelled_ics_event.status == "CANCELLED"


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
