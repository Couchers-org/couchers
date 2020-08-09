from google.protobuf import empty_pb2, wrappers_pb2
from datetime import datetime, timedelta

import grpc
import pytest
from pb import requests_pb2
from couchers import errors
from tests.test_fixtures import requests_session, db, generate_user, make_friends


def test_create_request(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    today_plus_1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%M-%d")
    today_plus_2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%M-%d")
    today_minus_1 = (datetime.now() - timedelta(days=1)).strftime("%Y-%M-%d")
    today_minus_2 = (datetime.now() - timedelta(days=2)).strftime("%Y-%M-%d")
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

        api.CreateHostRequest(requests_pb2.CreateHostRequestReq(
            user_id=user2.id,
            from_date=today_plus_1,
            to_date=today_plus_2,
            text="Test request"
        ))

def test_list_requests(db):
    assert False
