import html
import re
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

import grpc
import pytest
from sqlalchemy import select
from sqlalchemy_utils import refresh_materialized_view

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.crypto import b64decode
from couchers.db import session_scope
from couchers.i18n import LocalizationContext
from couchers.models import (
    Message,
    MessageType,
    RateLimitAction,
)
from couchers.proto import (
    api_pb2,
    auth_pb2,
    conversations_pb2,
    requests_pb2,
)
from couchers.proto.internal import unsubscribe_pb2
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_HOURS
from couchers.utils import create_coordinate, now, today
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector, email_fields, mock_notification_email
from tests.fixtures.sessions import api_session, auth_api_session, requests_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def valid_request_text(text: str = "Test request") -> str:
    """Pads a request text to a valid length."""
    # Request lengths are measured in utf-16 code units to match the frontend.
    utf16_length = len(text.encode("utf-16-le")) // 2
    if utf16_length >= HOST_REQUEST_MIN_LENGTH_UTF16:
        return text
    padding_length = HOST_REQUEST_MIN_LENGTH_UTF16 - utf16_length
    return text + ("_" * padding_length)  # Each "_" adds one utf16 code unit.


def test_create_request(db, moderator):
    user1, token1 = generate_user()
    hosting_city = "Morningside Heights, New York City"
    hosting_lat = 40.8086
    hosting_lng = -73.9616
    hosting_radius = 500
    user2, token2 = generate_user(
        city=hosting_city,
        geom=create_coordinate(hosting_lat, hosting_lng),
        geom_radius=hosting_radius,
    )

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    today_minus_2 = today() - timedelta(days=2)
    today_minus_3 = today() - timedelta(days=3)

    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user1.id,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_plus_3.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Can't request hosting from yourself."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=999,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_plus_3.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date=today_plus_3.isoformat(),
                    to_date=today_plus_2.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "From date can't be after to date."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date=today_minus_3.isoformat(),
                    to_date=today_plus_2.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "From date must be today or later."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_minus_2.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "From date can't be after to date."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date="2020-00-06",
                    to_date=today_minus_2.isoformat(),
                    text=valid_request_text(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid date."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_plus_3.isoformat(),
                    text="Too short.",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Host request cannot be shorter than 250 characters."

        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text(),
            )
        )
        host_request_id = res.host_request_id

    moderator.approve_host_request(host_request_id)

    with requests_session(token1) as api:
        host_requests = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True)).host_requests

        assert len(host_requests) == 1
        hr = host_requests[0]

        assert hr.latest_message.text.text == valid_request_text()

        assert hr.hosting_city == hosting_city
        assert round(hr.hosting_lat, 4) == hosting_lat
        assert round(hr.hosting_lng, 4) == hosting_lng
        assert hr.hosting_radius == hosting_radius

    today_ = today()
    today_plus_one_year = today_ + timedelta(days=365)
    today_plus_one_year_plus_2 = today_plus_one_year + timedelta(days=2)
    today_plus_one_year_plus_3 = today_plus_one_year + timedelta(days=3)
    with pytest.raises(grpc.RpcError) as e:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_one_year_plus_2.isoformat(),
                to_date=today_plus_one_year_plus_3.isoformat(),
                text=valid_request_text("Test from date after one year"),
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == "The start date must be within one year from today."

    with pytest.raises(grpc.RpcError) as e:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_one_year_plus_3.isoformat(),
                text=valid_request_text("Test to date one year after from date"),
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == "You cannot request to stay with someone for longer than one year."


def test_create_request_incomplete_profile(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, _ = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_plus_3.isoformat(),
                    text=valid_request_text(),
                )
            )
    assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
    assert e.value.details() == "You have to complete your profile before you can send a request."


def test_excessive_requests_are_reported(db):
    """Test that excessive host requests are first reported in a warning email and finally lead blocking of further requests."""
    user, token = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.host_request]
    with requests_session(token) as api:
        # Test warning email
        with mock_notification_email() as mock_email:
            for _ in range(rate_limit_definition.warning_limit):
                host_user, _ = generate_user()
                _ = api.CreateHostRequest(
                    requests_pb2.CreateHostRequestReq(
                        host_user_id=host_user.id,
                        from_date=today_plus_2.isoformat(),
                        to_date=today_plus_3.isoformat(),
                        text=valid_request_text(),
                    )
                )

            assert mock_email.call_count == 0
            host_user, _ = generate_user()
            _ = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2.isoformat(),
                    to_date=today_plus_3.isoformat(),
                    text=valid_request_text("Excessive test request"),
                )
            )
            assert mock_email.call_count == 1
            email = email_fields(mock_email).plain
            assert email.startswith(
                f"User {user.username} has sent {rate_limit_definition.warning_limit} host requests in the past {RATE_LIMIT_HOURS} hours."
            )

        # Test ban after exceeding HOST_REQUEST_HARD_LIMIT
        with mock_notification_email() as mock_email:
            for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
                host_user, _ = generate_user()
                _ = api.CreateHostRequest(
                    requests_pb2.CreateHostRequestReq(
                        host_user_id=host_user.id,
                        from_date=today_plus_2.isoformat(),
                        to_date=today_plus_3.isoformat(),
                        text=valid_request_text(),
                    )
                )

            assert mock_email.call_count == 0
            host_user, _ = generate_user()
            with pytest.raises(grpc.RpcError) as exc_info:
                _ = api.CreateHostRequest(
                    requests_pb2.CreateHostRequestReq(
                        host_user_id=host_user.id,
                        from_date=today_plus_2.isoformat(),
                        to_date=today_plus_3.isoformat(),
                        text=valid_request_text("Excessive test request"),
                    )
                )
            assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
            assert (
                exc_info.value.details()
                == "You have sent a lot of host requests in the past 24 hours. To avoid spam, you can't send any more for now."
            )

            assert mock_email.call_count == 1
            email = email_fields(mock_email).plain
            assert email.startswith(
                f"User {user.username} has sent {rate_limit_definition.hard_limit} host requests in the past {RATE_LIMIT_HOURS} hours."
            )
            assert "The user has been blocked from sending further host requests for now." in email


def add_message(db, text, author_id, conversation_id):
    with session_scope() as session:
        message = Message(
            conversation_id=conversation_id, author_id=author_id, text=text, message_type=MessageType.text
        )

        session.add(message)


def test_GetHostRequest(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that host request."

        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )

        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.latest_message.text.text == "Test message 1"


def test_ListHostRequests(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user3.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 2"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_1)
    moderator.approve_host_request(host_request_2)

    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert res.no_more
        assert len(res.host_requests) == 2

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == valid_request_text("Test request 1")
        assert res.host_requests[0].surfer_user_id == user1.id
        assert res.host_requests[0].host_user_id == user2.id
        assert res.host_requests[0].status == conversations_pb2.HOST_REQUEST_STATUS_PENDING

        add_message(db, "Test request 1 message 1", user2.id, host_request_1)
        add_message(db, "Test request 1 message 2", user2.id, host_request_1)
        add_message(db, "Test request 1 message 3", user2.id, host_request_1)

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.host_requests[0].latest_message.text.text == "Test request 1 message 3"

        host_request_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user1.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 3"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_3)

    add_message(db, "Test request 2 message 1", user1.id, host_request_2)
    add_message(db, "Test request 2 message 2", user3.id, host_request_2)

    with requests_session(token3) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == "Test request 2 message 2"

    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 1

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert len(res.host_requests) == 3


def test_ListHostRequests_pagination_regression(db, moderator):
    """
    ListHostRequests was skipping a request when getting multiple pages
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 2"),
            )
        ).host_request_id

        host_request_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 3"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_1)
    moderator.approve_host_request(host_request_2)
    moderator.approve_host_request(host_request_3)

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 3
        assert res.host_requests[0].latest_message.text.text == valid_request_text("Test request 3")
        assert res.host_requests[1].latest_message.text.text == valid_request_text("Test request 2")
        assert res.host_requests[2].latest_message.text.text == valid_request_text("Test request 1")

    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_2,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request 2",
            )
        )
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_1,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request 1",
            )
        )
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_3,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request 3",
            )
        )

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 3
        assert res.host_requests[0].latest_message.text.text == "Accepting host request 3"
        assert res.host_requests[1].latest_message.text.text == "Accepting host request 1"
        assert res.host_requests[2].latest_message.text.text == "Accepting host request 2"

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True, number=1))
        assert not res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == "Accepting host request 3"
        res = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(only_received=True, number=1, last_request_id=res.last_request_id)
        )
        assert not res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == "Accepting host request 1"
        res = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(only_received=True, number=1, last_request_id=res.last_request_id)
        )
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == "Accepting host request 2"


def test_ListHostRequests_active_filter(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

    moderator.approve_host_request(request_id)

    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
            )
        )

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 1
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_active=True))
        assert len(res.host_requests) == 0


def test_RespondHostRequests(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

    moderator.approve_host_request(request_id)

    # another user can't access
    with requests_session(token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that host request."

    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You are not the host of this request."

    with requests_session(token2) as api:
        # non existing id
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=9999, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # host can't confirm or cancel (host should accept/reject)
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't set the host request status to that."
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't set the host request status to that."

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED,
                text="Test rejection message",
            )
        )
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=request_id))
        assert res.messages[0].text.text == "Test rejection message"
        assert res.messages[1].WhichOneof("content") == "host_request_status_changed"
        assert res.messages[1].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_REJECTED
        # should be able to move from rejected -> accepted
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
            )
        )

    with requests_session(token1) as api:
        # can't make pending
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_PENDING
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't set the host request status to that."

        # can confirm then cancel
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED
            )
        )

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
            )
        )

        # can't confirm after having cancelled
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't set the host request status to that."

    # at this point there should be 7 messages
    # 2 for creation, 2 for the status change with message, 3 for the other status changed
    with requests_session(token1) as api:
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=request_id))
        assert len(res.messages) == 7
        assert res.messages[0].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
        assert res.messages[1].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED
        assert res.messages[2].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
        assert res.messages[4].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_REJECTED
        assert res.messages[6].WhichOneof("content") == "chat_created"


def test_get_host_request_messages(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        )
        conversation_id = res.host_request_id

    moderator.approve_host_request(conversation_id)

    add_message(db, "Test request 1 message 1", user1.id, conversation_id)
    add_message(db, "Test request 1 message 2", user1.id, conversation_id)
    add_message(db, "Test request 1 message 3", user1.id, conversation_id)

    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=conversation_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
            )
        )

        add_message(db, "Test request 1 message 4", user2.id, conversation_id)
        add_message(db, "Test request 1 message 5", user2.id, conversation_id)

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=conversation_id, status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED
            )
        )

    with requests_session(token1) as api:
        # 9 including initial message
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=conversation_id))
        assert len(res.messages) == 9
        assert res.no_more

        res = api.GetHostRequestMessages(
            requests_pb2.GetHostRequestMessagesReq(host_request_id=conversation_id, number=3)
        )
        assert not res.no_more
        assert len(res.messages) == 3
        assert res.messages[0].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_REJECTED
        assert res.messages[0].WhichOneof("content") == "host_request_status_changed"
        assert res.messages[1].text.text == "Test request 1 message 5"
        assert res.messages[2].text.text == "Test request 1 message 4"

        res = api.GetHostRequestMessages(
            requests_pb2.GetHostRequestMessagesReq(
                host_request_id=conversation_id,
                last_message_id=res.messages[2].message_id,
                number=6,
            )
        )
        assert res.no_more
        assert len(res.messages) == 6
        assert res.messages[0].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
        assert res.messages[0].WhichOneof("content") == "host_request_status_changed"
        assert res.messages[1].text.text == "Test request 1 message 3"
        assert res.messages[2].text.text == "Test request 1 message 2"
        assert res.messages[3].text.text == "Test request 1 message 1"
        assert res.messages[4].text.text == valid_request_text("Test request 1")
        assert res.messages[5].WhichOneof("content") == "chat_created"


def test_SendHostRequestMessage(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_id)

    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=999, text="Test message 1")
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text=""))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid message."

        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        assert res.messages[0].text.text == "Test message 1"
        assert res.messages[0].author_user_id == user1.id

    with requests_session(token3) as api:
        # other user can't send
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that host request."

    with requests_session(token2) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
        )
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        # including 2 for creation control message and message
        assert len(res.messages) == 4
        assert res.messages[0].text.text == "Test message 2"
        assert res.messages[0].author_user_id == user2.id

        # CAN send messages to a rejected, confirmed or cancelled request, and for accepted
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED
            )
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
        )

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
            )
        )

    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED
            )
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
        )

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
            )
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
        )


def test_get_updates(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test message 0"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_id)

    with requests_session(token1) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
        )
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Test message 3",
            )
        )

        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test message 4"),
            )
        )

        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        assert len(res.messages) == 6
        assert res.messages[0].text.text == "Test message 3"
        assert res.messages[1].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
        assert res.messages[2].text.text == "Test message 2"
        assert res.messages[3].text.text == "Test message 1"
        assert res.messages[4].text.text == valid_request_text("Test message 0")
        message_id_3 = res.messages[0].message_id
        message_id_cancel = res.messages[1].message_id
        message_id_2 = res.messages[2].message_id
        message_id_1 = res.messages[3].message_id
        message_id_0 = res.messages[4].message_id

        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=0))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        res = api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=message_id_1))
        assert res.no_more
        assert len(res.updates) == 5
        assert res.updates[0].message.text.text == "Test message 2"
        assert (
            res.updates[1].message.host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
        )
        assert res.updates[1].status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
        assert res.updates[2].message.text.text == "Test message 3"
        assert res.updates[3].message.WhichOneof("content") == "chat_created"
        assert res.updates[3].status == conversations_pb2.HOST_REQUEST_STATUS_PENDING
        assert res.updates[4].message.text.text == valid_request_text("Test message 4")

        res = api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=message_id_1, number=1))
        assert not res.no_more
        assert len(res.updates) == 1
        assert res.updates[0].message.text.text == "Test message 2"
        assert res.updates[0].status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED

    with requests_session(token3) as api:
        # other user can't access
        res = api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=message_id_1))
        assert len(res.updates) == 0


def test_archive_host_request(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test message 0"),
            )
        ).host_request_id

        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
        )

    moderator.approve_host_request(host_request_id)

    # happy path archiving host request
    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Test message 3",
            )
        )
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED

        # Verify is_archived is False before archiving
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert not res.is_archived

        api.SetHostRequestArchiveStatus(
            requests_pb2.SetHostRequestArchiveStatusReq(host_request_id=host_request_id, is_archived=True)
        )
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_archived=True))
        assert len(res.host_requests) == 1

        # Verify is_archived is True after archiving
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.is_archived


def test_mark_last_seen(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test message 0"),
            )
        ).host_request_id

        host_request_id_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test message 0a"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_id)
    moderator.approve_host_request(host_request_id_2)

    with requests_session(token1) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
        )
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Test message 3",
            )
        )

    moderator.approve_host_request(host_request_id)
    moderator.approve_host_request(host_request_id_2)

    # test Ping unseen host request count, should be automarked after sending
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_received_host_request_count == 0
        assert api.Ping(api_pb2.PingReq()).unseen_sent_host_request_count == 0

    with api_session(token2) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_received_host_request_count == 2
        assert api.Ping(api_pb2.PingReq()).unseen_sent_host_request_count == 0

    with requests_session(token2) as api:
        assert api.ListHostRequests(requests_pb2.ListHostRequestsReq()).host_requests[0].last_seen_message_id == 0

        api.MarkLastSeenHostRequest(
            requests_pb2.MarkLastSeenHostRequestReq(host_request_id=host_request_id, last_seen_message_id=3)
        )

        assert api.ListHostRequests(requests_pb2.ListHostRequestsReq()).host_requests[0].last_seen_message_id == 3

        with pytest.raises(grpc.RpcError) as e:
            api.MarkLastSeenHostRequest(
                requests_pb2.MarkLastSeenHostRequestReq(host_request_id=host_request_id, last_seen_message_id=1)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You can't unsee messages."

        # this will be used to test sent request notifications
        host_request_id_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user1.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Another test request"),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_id_3)

    with requests_session(token2) as api:
        # this should make id_2 all read
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id_2, text="Test")
        )

    with api_session(token2) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_received_host_request_count == 1
        assert api.Ping(api_pb2.PingReq()).unseen_sent_host_request_count == 0

    # make sure sent and received count for unseen notifications
    with requests_session(token1) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id_3, text="Test message")
        )

    with api_session(token2) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_received_host_request_count == 1
        assert api.Ping(api_pb2.PingReq()).unseen_sent_host_request_count == 1


def test_response_rate(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(delete_user=True)

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # deleted: not found
        with pytest.raises(grpc.RpcError) as e:
            api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # no requests: insufficient
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("insufficient_data")

        # send a request and back date it by 36 hours
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request"),
            )
        ).host_request_id
        moderator.approve_host_request(host_request_1)
        with session_scope() as session:
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request_1)
                .where(Message.message_type == MessageType.chat_created)
            ).scalar_one().time = now() - timedelta(hours=36)
            refresh_materialized_view(session, "user_response_rates")

        # still insufficient
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("insufficient_data")

        # send a request and back date it by 35 hours
        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request"),
            )
        ).host_request_id
        moderator.approve_host_request(host_request_2)
        with session_scope() as session:
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request_2)
                .where(Message.message_type == MessageType.chat_created)
            ).scalar_one().time = now() - timedelta(hours=35)
            refresh_materialized_view(session, "user_response_rates")

        # still insufficient
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("insufficient_data")

        # send a request and back date it by 34 hours
        host_request_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request"),
            )
        ).host_request_id
        moderator.approve_host_request(host_request_3)
        with session_scope() as session:
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request_3)
                .where(Message.message_type == MessageType.chat_created)
            ).scalar_one().time = now() - timedelta(hours=34)
            refresh_materialized_view(session, "user_response_rates")

        # now low
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("low")

    with requests_session(token2) as api:
        # accept a host req
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_2,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # now some w p33 = 35h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("some")
        assert res.some.response_time_p33.ToTimedelta() == timedelta(hours=35)

    with requests_session(token2) as api:
        # accept another host req
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_3,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # now most w p33 = 34h, p66 = 35h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("most")
        assert res.most.response_time_p33.ToTimedelta() == timedelta(hours=34)
        assert res.most.response_time_p66.ToTimedelta() == timedelta(hours=35)

    with requests_session(token2) as api:
        # accept last host req
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_1,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # now all w p33 = 34h, p66 = 35h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("almost_all")
        assert res.almost_all.response_time_p33.ToTimedelta() == timedelta(hours=34)
        assert res.almost_all.response_time_p66.ToTimedelta() == timedelta(hours=35)

        # send a request and back date it by 2 hours
        host_request_4 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request"),
            )
        ).host_request_id
        moderator.approve_host_request(host_request_4)
        with session_scope() as session:
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request_4)
                .where(Message.message_type == MessageType.chat_created)
            ).scalar_one().time = now() - timedelta(hours=2)
            refresh_materialized_view(session, "user_response_rates")

        # send a request and back date it by 4 hours
        host_request_5 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("Test request"),
            )
        ).host_request_id
        moderator.approve_host_request(host_request_5)
        with session_scope() as session:
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request_5)
                .where(Message.message_type == MessageType.chat_created)
            ).scalar_one().time = now() - timedelta(hours=4)
            refresh_materialized_view(session, "user_response_rates")

        # now some w p33 = 35h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("some")
        assert res.some.response_time_p33.ToTimedelta() == timedelta(hours=35)

    with requests_session(token2) as api:
        # accept host req
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_5,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # now most w p33 = 34h, p66 = 36h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("most")
        assert res.most.response_time_p33.ToTimedelta() == timedelta(hours=34)
        assert res.most.response_time_p66.ToTimedelta() == timedelta(hours=36)

    with requests_session(token2) as api:
        # accept host req
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_4,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting host request",
            )
        )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # now most w p33 = 4h, p66 = 35h
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("almost_all")
        assert res.almost_all.response_time_p33.ToTimedelta() == timedelta(hours=4)
        assert res.almost_all.response_time_p66.ToTimedelta() == timedelta(hours=35)


def test_request_notifications(db, push_collector: PushCollector, moderator):
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    host_loc_context = LocalizationContext.from_user(host)
    surfer_loc_context = LocalizationContext.from_user(surfer)

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

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
    assert e.recipient == host.email
    assert "host request" in e.subject.lower()
    assert host.name in e.plain
    assert host.name in e.html
    assert "quick decline" in e.plain.lower(), e.plain
    assert "quick decline" in e.html.lower()
    assert surfer.name in e.plain
    assert surfer.name in e.html
    assert host_loc_context.localize_date(today_plus_2) in e.plain
    assert host_loc_context.localize_date(today_plus_2) in e.html
    assert host_loc_context.localize_date(today_plus_3) in e.plain
    assert host_loc_context.localize_date(today_plus_3) in e.html
    assert "http://localhost:5001/img/thumbnail/" not in e.plain
    assert "http://localhost:5001/img/thumbnail/" in e.html
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.plain
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.html

    assert push_collector.pop_for_user(host.id, last=True).content.title == f"New host request from {surfer.name}"

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
    assert e.recipient == surfer.email
    assert "host request" in e.subject.lower()
    assert host.name in e.plain
    assert host.name in e.html
    assert surfer.name in e.plain
    assert surfer.name in e.html
    assert surfer_loc_context.localize_date(today_plus_2) in e.plain
    assert surfer_loc_context.localize_date(today_plus_2) in e.html
    assert surfer_loc_context.localize_date(today_plus_3) in e.plain
    assert surfer_loc_context.localize_date(today_plus_3) in e.html
    assert "http://localhost:5001/img/thumbnail/" not in e.plain
    assert "http://localhost:5001/img/thumbnail/" in e.html
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.plain
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.html

    assert push_collector.pop_for_user(surfer.id, last=True).content.title == f"{host.name} accepted your host request"


def test_quick_decline(db, push_collector: PushCollector, moderator):
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    host_loc_context = LocalizationContext.from_user(host)

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

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
    assert e.recipient == host.email
    assert "host request" in e.subject.lower()
    assert host.name in e.plain
    assert host.name in e.html
    assert "quick decline" in e.plain.lower(), e.plain
    assert "quick decline" in e.html.lower()
    assert surfer.name in e.plain
    assert surfer.name in e.html
    assert host_loc_context.localize_date(today_plus_2) in e.plain
    assert host_loc_context.localize_date(today_plus_2) in e.html
    assert host_loc_context.localize_date(today_plus_3) in e.plain
    assert host_loc_context.localize_date(today_plus_3) in e.html
    assert "http://localhost:5001/img/thumbnail/" not in e.plain
    assert "http://localhost:5001/img/thumbnail/" in e.html
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.plain
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.html

    assert push_collector.pop_for_user(host.id, last=True).content.title == f"New host request from {surfer.name}"

    # very ugly
    # http://localhost:3000/quick-link?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', email_fields(mock).html):
        if "payload" not in link:
            continue
        print(link)
        url_parts = urlparse(html.unescape(link))
        params = parse_qs(url_parts.query)
        print(params["payload"][0])
        payload = unsubscribe_pb2.UnsubscribePayload.FromString(b64decode(params["payload"][0]))
        if payload.HasField("host_request_quick_decline"):
            with auth_api_session() as (auth_api, metadata_interceptor):
                res = auth_api.Unsubscribe(
                    auth_pb2.UnsubscribeReq(
                        payload=b64decode(params["payload"][0]),
                        sig=b64decode(params["sig"][0]),
                    )
                )
                assert res.response == "Thank you for responding to the host request!"
            break
    else:
        raise Exception("Didn't find link")

    with requests_session(surfer_token) as api:
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=hr_id))
        assert res.status == conversations_pb2.HOST_REQUEST_STATUS_REJECTED


def test_host_req_feedback(db, moderator):
    host, host_token = generate_user(complete_profile=True)
    host2, host2_token = generate_user(complete_profile=True)
    host3, host3_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = today() + timedelta(days=2)
    today_plus_3 = today() + timedelta(days=3)

    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id
        hr2_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host2.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id
        hr3_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host3.id,
                from_date=today_plus_2.isoformat(),
                to_date=today_plus_3.isoformat(),
                text=valid_request_text("can i stay plz"),
            )
        ).host_request_id

    moderator.approve_host_request(hr_id)
    moderator.approve_host_request(hr2_id)
    moderator.approve_host_request(hr3_id)

    with requests_session(host_token) as api:
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=hr_id))
        assert not res.need_host_request_feedback

        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED,
            )
        )

        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=hr_id))
        assert res.need_host_request_feedback

    # surfer can't leave feedback
    with requests_session(surfer_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestFeedback(
                requests_pb2.SendHostRequestFeedbackReq(
                    host_request_id=hr_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that host request."

    with requests_session(host_token) as api:
        api.SendHostRequestFeedback(
            requests_pb2.SendHostRequestFeedbackReq(
                host_request_id=hr_id,
                host_request_quality=requests_pb2.HOST_REQUEST_QUALITY_LOW,
            )
        )
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=hr_id))
        assert not res.need_host_request_feedback

    # can't leave it twice
    with requests_session(host_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestFeedback(
                requests_pb2.SendHostRequestFeedbackReq(
                    host_request_id=hr_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You have already left feedback for this host request!"

        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=hr_id))
        assert not res.need_host_request_feedback

    with requests_session(host2_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr2_id, status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED
            )
        )
        # can't leave feedback on the wrong one
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestFeedback(
                requests_pb2.SendHostRequestFeedbackReq(
                    host_request_id=hr_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that host request."

        # null feedback is still feedback
        api.SendHostRequestFeedback(requests_pb2.SendHostRequestFeedbackReq(host_request_id=hr2_id))

    with requests_session(host3_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr3_id, status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED
            )
        )

        api.SendHostRequestFeedback(
            requests_pb2.SendHostRequestFeedbackReq(host_request_id=hr3_id, decline_reason="bad req")
        )
