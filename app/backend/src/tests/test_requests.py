from datetime import timedelta

import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.models import Message, MessageType
from couchers.utils import now
from pb import api_pb2, conversations_pb2, requests_pb2
from tests.test_fixtures import api_session, db, generate_user, requests_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    today_minus_2 = (now() - timedelta(days=2)).strftime("%Y-%m-%d")
    today_minus_3 = (now() - timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REQUEST_SELF

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=999, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user2.id, from_date=today_plus_3, to_date=today_plus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user2.id, from_date=today_minus_3, to_date=today_plus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_BEFORE_TODAY

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user2.id, from_date=today_plus_2, to_date=today_minus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user2.id, from_date="2020-00-06", to_date=today_minus_2, text="Test request"
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_DATE

        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        )
        assert (
            api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
            .host_requests[0]
            .latest_message.text.text
            == "Test request"
        )

    today = now().date()
    today_plus_one_year = today.replace(year=today.year + 1)
    today_plus_one_year_plus_2 = (today_plus_one_year + timedelta(days=2)).isoformat()
    today_plus_one_year_plus_3 = (today_plus_one_year + timedelta(days=3)).isoformat()
    with pytest.raises(grpc.RpcError) as e:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id,
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
                to_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_one_year_plus_3,
                text="Test to date one year after from date",
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == errors.DATE_TO_AFTER_ONE_YEAR


def add_message(db, text, author_id, conversation_id):
    with session_scope() as session:
        message = Message(
            conversation_id=conversation_id, author_id=author_id, text=text, message_type=MessageType.text
        )

        session.add(message)


def test_get_host_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 1")
        )

        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.latest_message.text.text == "Test message 1"


def test_list_requests(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        host_request_1 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
            )
        ).host_request_id

        host_request_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user3.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 2"
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
        assert res.host_requests[0].from_user_id == user1.id
        assert res.host_requests[0].to_user_id == user2.id
        assert res.host_requests[0].status == conversations_pb2.HOST_REQUEST_STATUS_PENDING

        add_message(db, "Test request 1 message 1", user2.id, host_request_1)
        add_message(db, "Test request 1 message 2", user2.id, host_request_1)
        add_message(db, "Test request 1 message 3", user2.id, host_request_1)

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert res.host_requests[0].latest_message.text.text == "Test request 1 message 3"

        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 3"
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


def test_list_host_requests_active_filter(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
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


def test_respond_host_requests(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")

    with requests_session(token1) as api:
        request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
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
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=request_id, status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

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
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
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


def test_send_message(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request 1"
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
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(
                requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Test message 3")
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED

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
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0"
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
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 4"
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
    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0"
            )
        ).host_request_id

        host_request_id_2 = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test message 0a"
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
                to_user_id=user1.id, from_date=today_plus_2, to_date=today_plus_3, text="Another test request"
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
