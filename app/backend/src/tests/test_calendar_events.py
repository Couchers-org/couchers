import re
from datetime import timedelta

import ics
import pytest

from couchers.email.calendar_events import create_host_request_ics
from couchers.i18n.context import LocalizationContext
from couchers.proto import conversations_pb2, requests_pb2
from couchers.proto.requests_pb2 import HostRequest
from couchers.utils import today
from tests.fixtures.db import generate_user
from tests.fixtures.misc import email_fields, mock_notification_email
from tests.fixtures.sessions import requests_session
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ics_content():
    host_request = HostRequest(
        host_request_id=42, from_date="2000-01-01", to_date="2000-01-02", hosting_city="New York"
    )

    ics = create_host_request_ics(
        host_request, other_name="Bob", hosting=True, loc_context=LocalizationContext.en_utc()
    )
    ics = ics.replace("\r\n", "\n")

    # Strip the domain in the UID, which depends on environment variables
    ics = re.sub(
        r"^UID:.*@(.*)$", lambda match: match[0].removesuffix(match[1]) + "<stripped>", ics, flags=re.MULTILINE
    )

    # Strip the domain in the URL and DESCRIPTION, which depends on environment variables
    ics = re.sub(r"^(DESCRIPTION|URL):(.*)/(\d+)", r"\1:<stripped>/\3", ics, flags=re.MULTILINE)

    assert (
        ics
        == """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couchers.org//Couchers//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20000101
DTEND;VALUE=DATE:20000103
DESCRIPTION:<stripped>/42
LOCATION:New York
SUMMARY:Hosting Bob
UID:host_request.42@<stripped>
URL:<stripped>/42
END:VEVENT
END:VCALENDAR
    """.strip()
    )


def test_host_request_attachments(db, moderator):
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    # Send the host request, no calendar attachment yet
    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id

    with mock_notification_email() as mock:
        moderator.approve_host_request(hr_id)

    mock.assert_called_once()
    e = email_fields(mock)
    assert not e.attachments

    # Host accepts, surfer gets a calendar attachment
    with requests_session(host_token) as api:
        with mock_notification_email() as mock:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                    text="Accepting host request",
                )
            )

    ics_event = _get_email_ics_attachment_calendar_event(mock)
    assert not ics_event.status
    assert ics_event.name == f"Hosting {surfer.name}"

    # Surfer confirms, hosts gets a calendar attachment
    with requests_session(surfer_token) as api:
        with mock_notification_email() as mock:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRM,
                    text="Confirming host request",
                )
            )

    ics_event = _get_email_ics_attachment_calendar_event(mock)
    assert not ics_event.status
    assert ics_event.name == f"Surfing with {host.name}"

    # Host cancels, surfer gets a calendar attachment
    with requests_session(surfer_token) as api:
        with mock_notification_email() as mock:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                    text="Cancelling host request",
                )
            )

    ics_event = _get_email_ics_attachment_calendar_event(mock)
    assert ics_event.status == "CANCELLED"


def _get_email_ics_attachment_calendar_event(mock) -> ics.Event:
    e = email_fields(mock)
    assert len(e.attachments or []) == 1
    ics_attachment = e.attachments[0]
    assert ics_attachment.filename.endswith(".ics")
    ics_calendar = ics.Calendar(ics_attachment.data.decode("utf-8"))
    assert len(ics_calendar.events) == 1
    return ics_calendar.events[0]
