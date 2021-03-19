from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import Conversation, HostRequest, HostRequestStatus, Message, MessageType, Reference, ReferenceType
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
        time=now() - reference_age,
        from_user_id=from_user_id,
        host_request_id=host_request.conversation_id,
        text="Dummy reference",
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


def create_friend_reference(session, from_user_id, to_user_id, reference_age):
    reference = Reference(
        time=now() - reference_age,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        reference_type=ReferenceType.friend,
        text="Test friend request",
        rating=4,
        was_safe=True,
        visible_from=now(),
    )
    session.add(reference)
    session.commit()
    return reference.id


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


def test_list_pagination(db):
    """
    * List pagination
    * List fails when not specifying at least one
    * List gets all from/to
    * List friend, hosting, surfing, and correct ordering
    * List hides not yet visible
    """
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
        ref2, hr2 = create_host_reference(session, user2.id, user1.id, timedelta(days=15, seconds=110), surfing=True)
        ref2b, _ = create_host_reference(
            session, user1.id, user2.id, timedelta(days=15, seconds=100), host_request_id=hr2
        )

        ref3, _ = create_host_reference(session, user3.id, user1.id, timedelta(days=15, seconds=90), surfing=False)
        ref4, _ = create_host_reference(session, user4.id, user1.id, timedelta(days=15, seconds=80), surfing=True)
        ref4b = create_friend_reference(session, user1.id, user4.id, timedelta(days=15, seconds=70))

        ref5, hr5 = create_host_reference(session, user5.id, user1.id, timedelta(days=15, seconds=60), surfing=False)
        ref5b, _ = create_host_reference(
            session, user1.id, user5.id, timedelta(days=15, seconds=50), host_request_id=hr5
        )

        ref6, _ = create_host_reference(session, user6.id, user1.id, timedelta(days=15, seconds=40), surfing=True)

        ref7 = create_friend_reference(session, user7.id, user1.id, timedelta(days=15, seconds=30))

        ref8, _ = create_host_reference(session, user8.id, user1.id, timedelta(days=15, seconds=20), surfing=False)
        ref9, _ = create_host_reference(session, user9.id, user1.id, timedelta(days=15, seconds=10), surfing=False)

        # should be visible even under 2 weeks
        ref7b = create_friend_reference(session, user1.id, user7.id, timedelta(days=9))

        # hidden because it's less than 2 weeks
        ref6hidden, _ = create_host_reference(session, user6.id, user1.id, timedelta(days=5), surfing=False)

        # visible because both were written
        ref8b, hr8 = create_host_reference(session, user8.id, user1.id, timedelta(days=3, seconds=20), surfing=False)
        ref8c, _ = create_host_reference(
            session, user1.id, user8.id, timedelta(days=3, seconds=10), host_request_id=hr8
        )

        # note that visibility tests don't really test real logic

    # these check the right refs are in the right requests and appear in the right order (latest first)

    with references_session(token2) as api:
        # written by user1
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id, page_size=2))
        assert [ref.reference_id for ref in res.references] == [ref8c, ref7b]

        res = api.ListReferences(
            references_pb2.ListReferencesReq(from_user_id=user1.id, page_token=res.next_page_token, page_size=2)
        )
        assert [ref.reference_id for ref in res.references] == [ref5b, ref4b]

        res = api.ListReferences(
            references_pb2.ListReferencesReq(from_user_id=user1.id, page_token=res.next_page_token, page_size=2)
        )
        assert [ref.reference_id for ref in res.references] == [ref2b]
        assert not res.next_page_token

        # received by user1
        res = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id, page_size=5))
        assert [ref.reference_id for ref in res.references] == [ref8b, ref9, ref8, ref7, ref6]

        res = api.ListReferences(
            references_pb2.ListReferencesReq(to_user_id=user1.id, page_token=res.next_page_token, page_size=5)
        )
        assert [ref.reference_id for ref in res.references] == [ref5, ref4, ref3, ref2]
        assert not res.next_page_token

        # same thing but with filters
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                to_user_id=user1.id,
                reference_type_filter=[
                    references_pb2.REFERENCE_TYPE_HOSTED,
                    references_pb2.REFERENCE_TYPE_SURFED,
                    references_pb2.REFERENCE_TYPE_FRIEND,
                ],
                page_size=5,
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref8b, ref9, ref8, ref7, ref6]

        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                to_user_id=user1.id,
                reference_type_filter=[
                    references_pb2.REFERENCE_TYPE_HOSTED,
                    references_pb2.REFERENCE_TYPE_SURFED,
                    references_pb2.REFERENCE_TYPE_FRIEND,
                ],
                page_token=res.next_page_token,
                page_size=5,
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref5, ref4, ref3, ref2]
        assert not res.next_page_token

        # received hosting references
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                to_user_id=user1.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_HOSTED], page_size=3
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref8b, ref9, ref8]

        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                to_user_id=user1.id,
                reference_type_filter=[references_pb2.REFERENCE_TYPE_HOSTED],
                page_token=res.next_page_token,
                page_size=3,
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref5, ref3]
        assert not res.next_page_token

        # written friend references
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=user1.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_FRIEND]
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref7b, ref4b]
        assert not res.next_page_token

        # written surfing references
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=user1.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_SURFED]
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref8c, ref5b]
        assert not res.next_page_token

    with references_session(token7) as api:
        # need to set at least one of from or to user
        with pytest.raises(grpc.RpcError) as e:
            api.ListReferences(
                references_pb2.ListReferencesReq(reference_type_filter=[references_pb2.REFERENCE_TYPE_SURFED])
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.NEED_TO_SPECIFY_AT_LEAT_ONE_USER_ID

    with references_session(token5) as api:
        # from user1 to user2
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id, to_user_id=user2.id))
        assert [ref.reference_id for ref in res.references] == [ref2b]
        assert not res.next_page_token

        # from user5 to user1
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user5.id, to_user_id=user1.id))
        assert [ref.reference_id for ref in res.references] == [ref5]
        assert not res.next_page_token


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
