from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.utils import now, to_aware_datetime
from pb import api_pb2, references_pb2
from tests.test_fixtures import api_session, db, generate_user, references_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_references(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    alltypes = set(
        [references_pb2.ReferenceType.FRIEND, references_pb2.ReferenceType.HOSTED, references_pb2.ReferenceType.SURFED]
    )
    # write all three reference types
    for typ in alltypes:
        req = references_pb2.WriteReferenceReq(to_user_id=user2.id, reference_type=typ, text="kinda weird sometimes")
        with references_session(token1) as api:
            res = api.WriteReference(req)
        assert isinstance(res, empty_pb2.Empty)

    # See what I have written. Paginate it.
    seen_types = set()
    for i in range(3):
        req = references_pb2.GetGivenReferencesReq(from_user_id=user1.id, number=1, start_at=i)
        with references_session(token1) as api:
            res = api.GetGivenReferences(req)
        assert res.total_matches == 3
        assert len(res.references) == 1
        assert res.references[0].from_user_id == user1.id
        assert res.references[0].to_user_id == user2.id
        assert res.references[0].text == "kinda weird sometimes"
        assert abs(to_aware_datetime(res.references[0].written_time) - now()) <= timedelta(days=32)
        assert res.references[0].reference_type not in seen_types
        seen_types.add(res.references[0].reference_type)
    assert seen_types == alltypes

    # See what user2 have received. Paginate it.
    seen_types = set()
    for i in range(3):
        req = references_pb2.GetReceivedReferencesReq(to_user_id=user2.id, number=1, start_at=i)
        with references_session(token1) as api:
            res = api.GetReceivedReferences(req)
        assert res.total_matches == 3
        assert len(res.references) == 1
        assert res.references[0].from_user_id == user1.id
        assert res.references[0].to_user_id == user2.id
        assert res.references[0].text == "kinda weird sometimes"
        assert res.references[0].reference_type not in seen_types
        seen_types.add(res.references[0].reference_type)
    assert seen_types == alltypes

    # Check available types
    with references_session(token1) as api:
        res = api.AvailableWriteReferenceTypes(references_pb2.AvailableWriteReferenceTypesReq(to_user_id=user2.id))
    assert res.reference_types == []

    with references_session(token2) as api:
        res = api.AvailableWriteReferenceTypes(references_pb2.AvailableWriteReferenceTypesReq(to_user_id=user1.id))
    assert set(res.reference_types) == alltypes

    # Forbidden to write a second reference of the same type
    req = references_pb2.WriteReferenceReq(
        to_user_id=user2.id, reference_type=references_pb2.ReferenceType.HOSTED, text="ok"
    )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.REFERENCE_ALREADY_GIVEN

    # Nonexisting user
    req = references_pb2.WriteReferenceReq(
        to_user_id=0x7FFFFFFFFFFFFFFF, reference_type=references_pb2.ReferenceType.HOSTED, text="ok"
    )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

    # yourself
    req = references_pb2.WriteReferenceReq(
        to_user_id=user1.id, reference_type=references_pb2.ReferenceType.HOSTED, text="ok"
    )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REFER_SELF

    with api_session(token2) as api:
        # test the number of references in GetUser and Ping
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert res.num_references == 3

        res = api.Ping(api_pb2.PingReq())
        assert res.user.num_references == 3
