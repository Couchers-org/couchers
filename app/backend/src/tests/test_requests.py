from google.protobuf import empty_pb2, wrappers_pb2
from datetime import datetime, timedelta

import grpc
import pytest
from pb import requests_pb2
from couchers import errors
from couchers.models import (Conversation, Message, HostRequest, HostRequestEvent,
                             HostRequestEventType)
from tests.test_fixtures import requests_session, db, generate_user, make_friends
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_


def test_create_request(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_minus_1 = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    today_minus_2 = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    with requests_session(db, token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                to_user_id=user1.id,
                from_date=today_plus_1,
                to_date=today_plus_2,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REQUEST_SELF

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                to_user_id=999,
                from_date=today_plus_1,
                to_date=today_plus_2,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id,
                from_date=today_minus_2,
                to_date=today_minus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_TO_BEFORE_TODAY

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id,
                from_date="2020-00-06",
                to_date=today_minus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_DATE

        res = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request"
        ))
        assert (api.ListSentHostRequests(requests_pb2.ListSentHostRequestsReq())
                .host_requests[0].latest_message.text == "Test request")


def add_message(db, text, author_id, conversation_id):
    session = db()

    message = Message(
        conversation_id=conversation_id,
        author_id=author_id,
        text=text
    )

    session.add(message)
    session.commit()
    session.close()


def test_list_requests(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    with requests_session(db, token1) as api:
        host_request_1 = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        )).host_request_id

        host_request_2 = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user3.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 2"
        )).host_request_id

        res = api.ListSentHostRequests(requests_pb2.ListSentHostRequestsReq())
        assert res.no_more
        assert len(res.host_requests) == 2

    with requests_session(db, token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text == "Test request 1"
        assert res.host_requests[0].from_user_id == user1.id
        assert res.host_requests[0].to_user_id == user2.id
        assert res.host_requests[0].status == requests_pb2.HOST_REQUEST_STATUS_PENDING

        add_message(db, "Test request 1 message 1", user2.id, host_request_1)
        add_message(db, "Test request 1 message 2", user2.id, host_request_1)
        add_message(db, "Test request 1 message 3", user2.id, host_request_1)

        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert res.host_requests[0].latest_message.text == "Test request 1 message 3"

    add_message(db, "Test request 2 message 1", user1.id, host_request_2)
    add_message(db, "Test request 2 message 2", user3.id, host_request_2)

    with requests_session(db, token3) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert res.no_more
        assert len(res.host_requests) == 1
        assert res.host_requests[0].latest_message.text == "Test request 2 message 2"

    with requests_session(db, token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert len(res.host_requests) == 0


def test_list_host_requests_active_filter(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

    with requests_session(db, token1) as api:
        request_id = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        )).host_request_id
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
        ))

    with requests_session(db, token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq())
        assert len(res.host_requests) == 1
        res = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(only_active=True))
        assert len(res.host_requests) == 0


def test_respond_host_requests(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

    with requests_session(db, token1) as api:
        request_id = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        )).host_request_id

    # another user can't access
    with requests_session(db, token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    with requests_session(db, token2) as api:
        # non existing id
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=9999,
                status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # host can't confirm or cancel (host should accept/reject)
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=requests_pb2.HOST_REQUEST_STATUS_CONFIRMED
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_REJECTED,
            text="Test rejection message"
        ))
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(
            host_request_id=request_id
        ))
        assert res.messages[0].text == "Test rejection message"
        # should be able to move from rejected -> accepted
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_ACCEPTED
        ))

    with requests_session(db, token1) as api:
        # can't make pending
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=requests_pb2.HOST_REQUEST_STATUS_PENDING
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

        # can confirm then cancel
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_CONFIRMED
        ))

        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
        ))

        # can't confirm after having cancelled
        with pytest.raises(grpc.RpcError) as e:
            api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=requests_pb2.HOST_REQUEST_STATUS_CONFIRMED
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

    # at this point there should be 5 host request event records
    session = db()
    events = session.query(HostRequestEvent).order_by(
        HostRequestEvent.id.desc()).all()
    assert len(events) == 5
    assert events[0].event_type == HostRequestEventType.status_change_cancelled
    assert events[1].event_type == HostRequestEventType.status_change_confirmed
    assert events[2].event_type == HostRequestEventType.status_change_accepted
    assert events[3].event_type == HostRequestEventType.status_change_rejected
    assert events[4].event_type == HostRequestEventType.created
    session.close()


def test_get_host_request_messages(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    with requests_session(db, token1) as api:
        res = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        ))
        request_id = res.host_request_id
        session = db()
        conversation_id = session.query(HostRequest.conversation_id).filter(HostRequest.id == request_id).scalar()
        session.close()

    add_message(db, "Test request 1 message 1", user1.id, conversation_id)
    add_message(db, "Test request 1 message 2", user1.id, conversation_id)
    add_message(db, "Test request 1 message 3", user1.id, conversation_id)

    with requests_session(db, token2) as api:
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_ACCEPTED
        ))

        add_message(db, "Test request 1 message 4", user2.id, conversation_id)
        add_message(db, "Test request 1 message 5", user2.id, conversation_id)

        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_REJECTED
        ))

    with requests_session(db, token1) as api:
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(
            host_request_id=request_id
        ))
        # 6 including initial message
        assert len(res.messages) == 6
        assert len(res.events) == 3
        assert res.no_more

        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(
            host_request_id=request_id,
            number=2
        ))
        assert not res.no_more
        assert len(res.messages) == 2
        assert len(res.events) == 1
        assert res.events[0].event_type == requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_REJECTED
        assert res.events[0].after_message_id == res.messages[0].message_id
        assert res.messages[0].text == "Test request 1 message 5"
        assert res.messages[1].text == "Test request 1 message 4"

        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(
            host_request_id=request_id,
            last_message_id=res.messages[1].message_id,
            number=4
        ))
        assert res.no_more
        assert len(res.messages) == 4
        assert len(res.events) == 2
        assert res.events[0].event_type == requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_ACCEPTED
        assert res.events[0].after_message_id == res.messages[0].message_id
        assert res.events[1].event_type == requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_CREATED
        assert res.events[1].after_message_id == 0
        assert res.messages[0].text == "Test request 1 message 3"
        assert res.messages[1].text == "Test request 1 message 2"
        assert res.messages[2].text == "Test request 1 message 1"
        assert res.messages[3].text == "Test request 1"

def test_send_message(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    with requests_session(db, token1) as api:
        host_request_id = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            to_user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        )).host_request_id

        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
                host_request_id=999,
                text="Test message 1"
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
            host_request_id=host_request_id,
            text="Test message 1"
        ))
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        assert res.messages[0].text == "Test message 1"
        assert res.messages[0].author_user_id == user1.id
    
    with requests_session(db, token3) as api:
        # other user can't send
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Test message 2"
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
    
    with requests_session(db, token2) as api:
        api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
            host_request_id=host_request_id,
            text="Test message 2"
        ))
        res = api.GetHostRequestMessages(requests_pb2.GetHostRequestMessagesReq(host_request_id=host_request_id))
        assert len(res.messages) == 3
        assert res.messages[0].text == "Test message 2"
        assert res.messages[0].author_user_id == user2.id

        # can't send messages to a rejected, confirmed or cancelled request, but can for accepted
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=host_request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_REJECTED
        ))
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Test message 3"
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED
        
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=host_request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_ACCEPTED
        ))
    
    with requests_session(db, token1) as api:
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=host_request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_CONFIRMED
        ))
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Test message 3"
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED

        
        api.RespondHostRequest(requests_pb2.RespondHostRequestReq(
            host_request_id=host_request_id,
            status=requests_pb2.HOST_REQUEST_STATUS_CANCELLED
        ))
        with pytest.raises(grpc.RpcError) as e:
            api.SendHostRequestMessage(requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Test message 3"
            ))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.HOST_REQUEST_CLOSED
