from google.protobuf import empty_pb2, wrappers_pb2
from datetime import datetime, timedelta

import grpc
import pytest
from pb import requests_pb2
from couchers import errors
from couchers.models import Message, HostRequest, Conversation
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
                user_id=user1.id,
                from_date=today_plus_1,
                to_date=today_plus_2,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REQUEST_SELF
        
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                user_id=999,
                from_date=today_plus_1,
                to_date=today_plus_2,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_FROM_AFTER_TO
        
        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                user_id=user2.id,
                from_date=today_minus_2,
                to_date=today_minus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.DATE_TO_BEFORE_TODAY

        with pytest.raises(grpc.RpcError) as e:
            api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
                user_id=user2.id,
                from_date="2020-00-06",
                to_date=today_minus_1,
                text="Test request"
            ))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_DATE

        res = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request"
        ))
        assert res.host_request.latest_message.text == "Test request"

def test_list_requests(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    with requests_session(db, token1) as api:
        host_request_1 = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 1"
        )).host_request.host_request_id
        
        host_request_2 = api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            user_id=user3.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request 2"
        )).host_request.host_request_id

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
        assert res.host_requests[0].conversation_id > 0

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
