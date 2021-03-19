from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import HostRequest, HostRequestStatus, Reference, ReferenceType, Conversation, Message, MessageType
from couchers.utils import now, to_aware_datetime, today
from pb import api_pb2, references_pb2
from tests.test_fixtures import api_session, db, generate_user, references_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def create_host_request(
    session, from_user_id, to_user_id, host_request_age=timedelta(days=15), status=HostRequestStatus.confirmed
):
    """
    Create a host request that's `host_request_age` old
    """
    from_date = today() - host_request_age - timedelta(days=2)
    to_date = today() - host_request_age
    fake_created = now() - host_request_age - timedelta(days=3)
    conversation = Conversation()
    session.add(conversation)
    session.flush()
    session.add(
        Message(
            time=fake_created + timedelta(seconds=1),
            conversation_id=conversation.id,
            author_id=from_user_id,
            message_type=MessageType.chat_created,
        )
    )
    message = Message(
        time=fake_created + timedelta(seconds=2),
        conversation_id=conversation.id,
        author_id=from_user_id,
        text="Hi, I'm requesting to be hosted.",
        message_type=MessageType.text,
    )
    session.add(message)
    session.flush()
    host_request = HostRequest(
        conversation_id=conversation.id,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        from_last_seen_message_id=message.id,
    )
    session.add(host_request)
    session.commit()
    # send_host_request_email(host_request)
    return host_request.conversation_id


def create_host_reference(session, from_user_id, to_user_id, reference_age, *, surfing=True, host_request_id=None):
    if host_request_id:
        actual_host_request_id = host_request_id
    else:
        if surfing:
            actual_host_request_id = host_request_id or create_host_request(
                session, from_user_id, to_user_id, reference_age - timedelta(days=1)
            )
        else:
            actual_host_request_id = host_request_id or create_host_request(
                session, to_user_id, from_user_id, reference_age - timedelta(days=1)
            )

    host_request = session.query(HostRequest).filter(HostRequest.conversation_id == actual_host_request_id).one()

    other_reference = (
        session.query(Reference)
        .filter(Reference.host_request_id == host_request.conversation_id)
        .filter(Reference.to_user_id == from_user_id)
        .one_or_none()
    )

    reference = Reference(
        from_user_id=from_user_id,
        host_request_id=host_request.conversation_id,
        text="Dummy request",
        rating=5,
        was_safe=True,
        visible_from=now() if other_reference else host_request.last_time_to_write_reference,
    )

    if host_request.from_user_id == from_user_id:
        reference.reference_type = ReferenceType.surfed
        reference.to_user_id = host_request.to_user_id
        assert from_user_id == host_request.from_user_id
    else:
        reference.reference_type = ReferenceType.hosted
        reference.to_user_id = host_request.from_user_id
        assert from_user_id == host_request.to_user_id

    session.add(reference)
    session.flush()

    # if both references are written, make them visible, otherwise send the other a message to write a reference
    if other_reference:
        # so we neatly get the same timestamp
        other_reference.visible_from = reference.visible_from

    session.commit()
    return reference.id, actual_host_request_id


"""
* List pagination
* List fails when not specifying at least one
* List gets all from/to
* List friend, hosting, surfing, and correct ordering
* List hides not yet visible
* Write friend reference
* Fails to write second friend reference
* Can't write for host request not yet complete
* Can write for complete host request < 2 weeks after it happened
* Can't write a second time for same host request
* Can't write for host request more than 2 weeks after
* Available write reference friend/non friend available
* Available write reference surfing, hosting
* Pending references to write
"""


def test_ListReferences(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()
    user7, token7 = generate_user()
    user8, token8 = generate_user()
    user9, token9 = generate_user()

    with session_scope() as session:
        # bidirectional references
        ref2, hr2 = create_host_reference(session, user1.id, user2.id, timedelta(days=15, seconds=60), surfing=True)
        ref2b, _ = create_host_reference(
            session, user2.id, user1.id, timedelta(days=15, seconds=61), host_request_id=hr2
        )

        ref3, _ = create_host_reference(session, user1.id, user3.id, timedelta(days=15, seconds=40), surfing=True)
        ref4, _ = create_host_reference(session, user1.id, user4.id, timedelta(days=15, seconds=50), surfing=True)

        ref5, hr5 = create_host_reference(session, user1.id, user5.id, timedelta(days=15, seconds=70), surfing=True)
        ref5b, _ = create_host_reference(
            session, user5.id, user1.id, timedelta(days=15, seconds=70), host_request_id=hr5
        )

        ref6, _ = create_host_reference(session, user1.id, user6.id, timedelta(days=15, seconds=10), surfing=True)
        ref7, _ = create_host_reference(session, user1.id, user7.id, timedelta(days=15, seconds=30), surfing=True)
        ref8, _ = create_host_reference(session, user1.id, user8.id, timedelta(days=15, seconds=80), surfing=True)
        ref9, _ = create_host_reference(session, user1.id, user9.id, timedelta(days=15, seconds=90), surfing=True)

    with references_session(token1) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq())


def test_WriteFriendReference(db):
    user1, token1 = generate_user()

    with references_session(token1) as api:
        res = api.WriteFriendReference(references_pb2.WriteFriendReferenceReq())


def test_WriteHostRequestReference(db):
    user1, token1 = generate_user()

    with references_session(token1) as api:
        res = api.WriteHostRequestReference(references_pb2.WriteHostRequestReferenceReq())


def test_AvailableWriteReferences(db):
    user1, token1 = generate_user()

    with references_session(token1) as api:
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq())


def test_ListPendingReferencesToWrite(db):
    user1, token1 = generate_user()

    with references_session(token1) as api:
        res = api.ListPendingReferencesToWrite(references_pb2.google())


def test_references(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    alltypes = set(
        [
            references_pb2.ReferenceType.REFERENCE_TYPE_FRIEND,
            references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED,
            references_pb2.ReferenceType.REFERENCE_TYPE_SURFED,
        ]
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
        to_user_id=user2.id, reference_type=references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED, text="ok"
    )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.REFERENCE_ALREADY_GIVEN

    # Nonexisting user
    req = references_pb2.WriteReferenceReq(
        to_user_id=0x7FFFFFFFFFFFFFFF, reference_type=references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED, text="ok"
    )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

    # yourself
    req = references_pb2.WriteReferenceReq(
        to_user_id=user1.id, reference_type=references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED, text="ok"
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
