from datetime import timedelta

import grpc
import pytest
from sqlalchemy.sql import select

from couchers import errors
from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_view
from couchers.models import Message, MessageType
from couchers.templates.v2 import v2date
from couchers.utils import now, today
from proto import api_pb2, conversations_pb2, requests_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    db,
    email_fields,
    generate_user,
    mock_notification_email,
    push_collector,
    requests_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    today_minus_2 = (today() - timedelta(days=2)).isoformat()
    today_minus_3 = (today() - timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REQUEST_SELF

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=999, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id, from_date=today_plus_3, to_date=today_plus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id, from_date=today_minus_3, to_date=today_plus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_BEFORE_TODAY

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id, from_date=today_plus_2, to_date=today_minus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id, from_date="2020-00-06", to_date=today_minus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_DATE

        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        )
        assert (
            api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
            .host_requests[0]
            .latest_message.text.text
            == "Test request"
        )

    today_ = today()
    today_plus_one_year = today_ + timedelta(days=365)
    today_plus_one_year_plus_2 = (today_plus_one_year + timedelta(days=2)).isoformat()
    today_plus_one_year_plus_3 = (today_plus_one_year + timedelta(days=3)).isoformat()
    with pytest.raises(grpc.RpcError) as e:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_one_year_plus_2,
                to_date=today_plus_one_year_plus_3,
                text="Test from date after one year",
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == errors.DATE_FROM_AFTER_ONE_YEAR

    with pytest.raises(grpc.RpcError) as e:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_one_year_plus_3,
                text="Test to date one year after from date",
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == errors.DATE_TO_AFTER_ONE_YEAR


def test_create_request_incomplete_profile(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, _ = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
    assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
    assert e.value.details() == errors.INCOMPLETE_PROFILE_SEND_REQUEST


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
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.HOST_REQUEST_NOT_FOUND

        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )

        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.latest_message.text.text == "Test message 1"


def test_ListHostRequests(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user3.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 2"
            )
        ).host_request_id

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert res.no_more
        assert len(res.host_requests) == 2

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text.text == "Test request 1"
        assert res.host_requests[0].surfer_user_id == user1.id
        assert res.host_requests[0].host_user_id == user2.id
        assert res.host_requests[0].status == conversations_pb2.HOST_REQUEST_STATUS_PENDING

        add_message(db, "Test request 1 message 1", user2.id, host_request_1)
        add_message(db, "Test request 1 message 2", user2.id, host_request_1)
        add_message(db, "Test request 1 message 3", user2.id, host_request_1)

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.host_requests[0].latest_message.text.text == "Test request 1 message 3"

        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 3"
            )
        )

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


def test_ListHostRequests_pagination_regression(db):
    """
    ListHostRequests was skipping a request when getting multiple pages
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 2"
            )
        ).host_request_id

        host_request_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 3"
            )
        ).host_request_id

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.no_more
        assert len(res.host_requests) == 3
        assert res.host_requests[0].latest_message.text.text == "Test request 3"
        assert res.host_requests[1].latest_message.text.text == "Test request 2"
        assert res.host_requests[2].latest_message.text.text == "Test request 1"

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


def test_ListHostRequests_active_filter(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id
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


def test_RespondHostRequests(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

    # another user can't access
    with requests_session(token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.HOST_REQUEST_NOT_FOUND

    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.NOT_THE_HOST

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
        assert e.value.details() == errors.INVALID_HOST_REQUEST_STATUS
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.INVALID_HOST_REQUEST_STATUS

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
        assert e.value.details() == errors.INVALID_HOST_REQUEST_STATUS

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
        assert e.value.details() == errors.INVALID_HOST_REQUEST_STATUS

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


def test_get_host_request_messages(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        )
        conversation_id = res.host_request_id

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
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=conversation_id))
        # 9 including initial message
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
                host_request_id=conversation_id, last_message_id=res.messages[2].message_id, number=6
            )
        )
        assert res.no_more
        assert len(res.messages) == 6
        assert res.messages[0].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
        assert res.messages[0].WhichOneof("content") == "host_request_status_changed"
        assert res.messages[1].text.text == "Test request 1 message 3"
        assert res.messages[2].text.text == "Test request 1 message 2"
        assert res.messages[3].text.text == "Test request 1 message 1"
        assert res.messages[4].text.text == "Test request 1"
        assert res.messages[5].WhichOneof("content") == "chat_created"


def test_SendHostRequestMessage(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=999, text="Test message 1")
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text=""))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_MESSAGE

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
        assert e.value.details() == errors.HOST_REQUEST_NOT_FOUND

    with requests_session(token2) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 2")
        )
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        # including 2 for creation control message and message
        assert len(res.messages) == 4
        assert res.messages[0].text.text == "Test message 2"
        assert res.messages[0].author_user_id == user2.id

        # can't send messages to a rejected, confirmed or cancelled request, but can for accepted
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED
            )
        )
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED

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
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED


def test_get_updates(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0"
            )
        ).host_request_id

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
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 4"
            )
        )

        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        assert len(res.messages) == 6
        assert res.messages[0].text.text == "Test message 3"
        assert res.messages[1].host_request_status_changed.status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
        assert res.messages[2].text.text == "Test message 2"
        assert res.messages[3].text.text == "Test message 1"
        assert res.messages[4].text.text == "Test message 0"
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
        assert res.updates[4].message.text.text == "Test message 4"

        res = api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=message_id_1, number=1))
        assert not res.no_more
        assert len(res.updates) == 1
        assert res.updates[0].message.text.text == "Test message 2"
        assert res.updates[0].status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED

    with requests_session(token3) as api:
        # other user can't access
        res = api.GetHostRequestUpdates(requests_pb2.GetHostRequestUpdatesReq(newest_message_id=message_id_1))
        assert len(res.updates) == 0


def test_mark_last_seen(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0"
            )
        ).host_request_id

        host_request_id_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0a"
            )
        ).host_request_id

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
        assert e.value.details() == errors.CANT_UNSEE_MESSAGES

        # this will be used to test sent request notifications
        host_request_id_3 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Another test request"
            )
        ).host_request_id

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


def test_response_rate(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(delete_user=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(token1) as api:
        # deleted: not found
        with pytest.raises(grpc.RpcError) as e:
            api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # no requests: insufficient
        res = api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user2.id))
        assert res.HasField("insufficient_data")

        # send a request and back date it by 36 hours
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id
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
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id
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
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id
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
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id
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
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id
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


def test_request_notifications(db, push_collector):
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(surfer_token) as api:
        with mock_notification_email() as mock:
            hr_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text="can i stay plz",
                )
            ).host_request_id

    mock.assert_called_once()
    e = email_fields(mock)
    assert e.recipient == host.email
    assert "host request" in e.subject.lower()
    assert host.name in e.plain
    assert host.name in e.html
    assert surfer.name in e.plain
    assert surfer.name in e.html
    assert v2date(today_plus_2, host) in e.plain
    assert v2date(today_plus_2, host) in e.html
    assert v2date(today_plus_3, host) in e.plain
    assert v2date(today_plus_3, host) in e.html
    assert "http://localhost:5001/img/thumbnail/" not in e.plain
    assert "http://localhost:5001/img/thumbnail/" in e.html
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.plain
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.html

    push_collector.assert_user_has_single_matching(
        host.id,
        title=f"{surfer.name} sent you a host request",
    )

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
    assert v2date(today_plus_2, surfer) in e.plain
    assert v2date(today_plus_2, surfer) in e.html
    assert v2date(today_plus_3, surfer) in e.plain
    assert v2date(today_plus_3, surfer) in e.html
    assert "http://localhost:5001/img/thumbnail/" not in e.plain
    assert "http://localhost:5001/img/thumbnail/" in e.html
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.plain
    assert f"http://localhost:3000/messages/request/{hr_id}" in e.html

    push_collector.assert_user_has_single_matching(
        surfer.id,
        title=f"{host.name} accepted your host request",
    )
