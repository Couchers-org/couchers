from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import (
    Conversation,
    HostRequest,
    HostRequestStatus,
    Message,
    MessageType,
    Reference,
    ReferenceType,
    User,
)
from couchers.sql import couchers_select as select
from couchers.utils import now, to_aware_datetime, today
from proto import conversations_pb2, references_pb2, requests_pb2
from tests.test_fixtures import (  # noqa
    db,
    generate_user,
    make_user_block,
    references_session,
    requests_session,
    testconfig,
)


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
    return host_request.conversation_id


def create_host_reference(session, from_user_id, to_user_id, reference_age, *, surfing=True, host_request_id=None):
    if host_request_id:
        actual_host_request_id = host_request_id
    else:
        if surfing:
            actual_host_request_id = host_request_id or create_host_request(
                session, from_user_id, to_user_id, reference_age + timedelta(days=1)
            )
        else:
            actual_host_request_id = host_request_id or create_host_request(
                session, to_user_id, from_user_id, reference_age + timedelta(days=1)
            )

    host_request = session.execute(
        select(HostRequest).where(HostRequest.conversation_id == actual_host_request_id)
    ).scalar_one()

    reference = Reference(
        time=now() - reference_age,
        from_user_id=from_user_id,
        host_request_id=host_request.conversation_id,
        text="Dummy reference",
        rating=0.5,
        was_appropriate=True,
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
    session.commit()
    return reference.id, actual_host_request_id


def create_friend_reference(session, from_user_id, to_user_id, reference_age):
    reference = Reference(
        time=now() - reference_age,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        reference_type=ReferenceType.friend,
        text="Test friend request",
        rating=0.4,
        was_appropriate=True,
    )
    session.add(reference)
    session.commit()
    return reference.id


def test_ListPagination(db):
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
        ref2, hr2 = create_host_reference(session, user2.id, user1.id, timedelta(days=16, seconds=110), surfing=True)
        ref2b, _ = create_host_reference(
            session, user1.id, user2.id, timedelta(days=16, seconds=100), host_request_id=hr2
        )

        ref3, _ = create_host_reference(session, user3.id, user1.id, timedelta(days=16, seconds=90), surfing=False)
        ref4, _ = create_host_reference(session, user4.id, user1.id, timedelta(days=16, seconds=80), surfing=True)
        ref4b = create_friend_reference(session, user1.id, user4.id, timedelta(days=16, seconds=70))

        ref5, hr5 = create_host_reference(session, user5.id, user1.id, timedelta(days=16, seconds=60), surfing=False)
        ref5b, _ = create_host_reference(
            session, user1.id, user5.id, timedelta(days=16, seconds=50), host_request_id=hr5
        )

        ref6, _ = create_host_reference(session, user6.id, user1.id, timedelta(days=16, seconds=40), surfing=True)

        ref7 = create_friend_reference(session, user7.id, user1.id, timedelta(days=16, seconds=30))

        ref8, _ = create_host_reference(session, user8.id, user1.id, timedelta(days=16, seconds=20), surfing=False)
        ref9, _ = create_host_reference(session, user9.id, user1.id, timedelta(days=16, seconds=10), surfing=False)

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
        assert e.value.details() == errors.NEED_TO_SPECIFY_AT_LEAST_ONE_USER

    with references_session(token5) as api:
        # from user1 to user2
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id, to_user_id=user2.id))
        assert [ref.reference_id for ref in res.references] == [ref2b]
        assert not res.next_page_token

        # from user5 to user1
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user5.id, to_user_id=user1.id))
        assert [ref.reference_id for ref in res.references] == [ref5]
        assert not res.next_page_token


def test_ListReference_banned_deleted_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with session_scope() as session:
        create_friend_reference(session, user2.id, user1.id, timedelta(days=15))
        create_friend_reference(session, user3.id, user1.id, timedelta(days=16))
        create_friend_reference(session, user1.id, user2.id, timedelta(days=15))
        create_friend_reference(session, user1.id, user3.id, timedelta(days=16))

    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 2
        assert len(refs_sent) == 2

    # ban user2
    with session_scope() as session:
        user2 = session.execute(select(User).where(User.username == user2.username)).scalar_one()
        user2.is_banned = True
        session.commit()

    # reference to and from banned user is hidden
    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 1
        assert len(refs_sent) == 1

    # delete user3
    with session_scope() as session:
        user3 = session.execute(select(User).where(User.username == user3.username)).scalar_one()
        user3.is_deleted = True
        session.commit()

    # doesn't change; references to and from deleted users remain
    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 1
        assert len(refs_sent) == 1


def test_WriteFriendReference(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with references_session(token1) as api:
        # can write normal friend reference
        res = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id,
                text="A test reference",
                was_appropriate=True,
                rating=0.5,
            )
        )
        assert res.from_user_id == user1.id
        assert res.to_user_id == user2.id
        assert res.reference_type == references_pb2.REFERENCE_TYPE_FRIEND
        assert res.text == "A test reference"
        assert now() - timedelta(hours=24) <= to_aware_datetime(res.written_time) <= now()
        assert not res.host_request_id

    with references_session(token3) as api:
        # check it shows up
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=user1.id, to_user_id=user2.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_FRIEND]
            )
        )
        assert len(res.references) == 1
        ref = res.references[0]
        assert ref.from_user_id == user1.id
        assert ref.to_user_id == user2.id
        assert ref.reference_type == references_pb2.REFERENCE_TYPE_FRIEND
        assert ref.text == "A test reference"
        assert now() - timedelta(hours=24) <= to_aware_datetime(ref.written_time) <= now()
        assert not ref.host_request_id

    with references_session(token1) as api:
        # can't write a second friend reference
        with pytest.raises(grpc.RpcError) as e:
            api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(
                    to_user_id=user2.id,
                    text="A test reference",
                    was_appropriate=True,
                    rating=0.5,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.REFERENCE_ALREADY_GIVEN

    with references_session(token2) as api:
        # can't write a reference about yourself
        with pytest.raises(grpc.RpcError) as e:
            api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(
                    to_user_id=user2.id,
                    text="I'm really awesome",
                    was_appropriate=True,
                    rating=1.0,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_REFER_SELF


def test_WriteFriendReference_with_empty_text(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(to_user_id=user2.id, text="  ", was_appropriate=True, rating=0.8)
            )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == errors.REFERENCE_NO_TEXT


def test_WriteHostRequestReference(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with session_scope() as session:
        # too old
        hr1 = create_host_request(session, user3.id, user1.id, timedelta(days=20))
        # valid host req
        hr2 = create_host_request(session, user3.id, user1.id, timedelta(days=10))
        # valid surfing req
        hr3 = create_host_request(session, user1.id, user3.id, timedelta(days=7))
        # not yet complete
        hr4 = create_host_request(session, user2.id, user1.id, timedelta(days=1), status=HostRequestStatus.accepted)

    with references_session(token3) as api:
        # can write for this one
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )

    with references_session(token1) as api:
        # can't write reference for a HR that's not yet finished
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr4,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_FOR_REQUEST

        # can't write reference that's more than 2 weeks old
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr1,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_FOR_REQUEST

        # can write for this one
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr2,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )

        # but can't write a second one for the same one
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr2,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.REFERENCE_ALREADY_GIVEN

        # can write for this one too
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )


def test_AvailableWriteReferences_and_ListPendingReferencesToWrite(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(make_invisible=True)
    user6, token6 = generate_user()
    user7, token7 = generate_user()
    make_user_block(user1, user6)
    make_user_block(user7, user1)

    with session_scope() as session:
        # too old
        hr1 = create_host_request(session, user3.id, user1.id, timedelta(days=20))

        # already wrote friend ref to user3
        create_friend_reference(session, user1.id, user3.id, timedelta(days=15, seconds=70))

        # already given
        _, hr2 = create_host_reference(session, user2.id, user1.id, timedelta(days=10, seconds=110), surfing=True)
        create_host_reference(session, user1.id, user2.id, timedelta(days=10, seconds=100), host_request_id=hr2)

        # valid hosted
        hr3 = create_host_request(session, user3.id, user1.id, timedelta(days=8))

        # valid surfed
        hr4 = create_host_request(session, user1.id, user4.id, timedelta(days=5))

        # not yet complete
        hr5 = create_host_request(session, user2.id, user1.id, timedelta(days=2), status=HostRequestStatus.accepted)

        # already wrote friend ref to user2
        create_friend_reference(session, user1.id, user2.id, timedelta(days=1))

        # user5 deleted, reference won't show up as pending
        create_host_request(session, user1.id, user5.id, timedelta(days=5))

        # user6 blocked, reference won't show up as pending
        create_host_request(session, user1.id, user6.id, timedelta(days=5))

        # user7 blocking, reference won't show up as pending
        create_host_request(session, user1.id, user7.id, timedelta(days=5))

    with references_session(token1) as api:
        # can't write reference for invisible user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # can't write reference for blocking user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user7.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # can't write reference for blocked user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user6.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # can't write anything to myself
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
        assert not res.can_write_friend_reference
        assert len(res.available_write_references) == 0

        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
        # can't write friend ref to user2
        assert not res.can_write_friend_reference
        # none we can write for user2
        assert len(res.available_write_references) == 0

        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user3.id))
        # can't write friend ref to user3
        assert not res.can_write_friend_reference
        # can write one reference because we hosted user3
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr3
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=6) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=7)

        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user4.id))
        # can write friend ref to user4
        assert res.can_write_friend_reference
        # can write one reference because we surfed with user4
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr4
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=9) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=10)

        # finally check the general list
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 2
        w = res.pending_references[0]
        assert w.host_request_id == hr3
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=6) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=7)
        w = res.pending_references[1]
        assert w.host_request_id == hr4
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=9) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=10)


@pytest.mark.parametrize("hs", ["host", "surfer"])
def test_regression_disappearing_refs(db, hs):
    """
    Roughly the reproduction steps are:
    * Send a host request, then have both host and surfer accept
    * Wait for it to elapse (or hack it with SQL like what you told me to do)
    * On the surfer account, leave a reference
    * Then on the host account, the option to leave a reference is then not available
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    req_start = (today() + timedelta(days=2)).isoformat()
    req_end = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=req_start, to_date=req_end, text="Test request"
            )
        )
        host_request_id = res.host_request_id
        assert (
            api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
            .host_requests[0]
            .latest_message.text.text
            == "Test request"
        )

    with requests_session(token2) as api:
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

    with references_session(token1) as api:
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
        assert len(res.available_write_references) == 0

    with references_session(token2) as api:
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
        assert len(res.available_write_references) == 0

    # hack the time backwards
    hack_req_start = today() - timedelta(days=10) + timedelta(days=2)
    hack_req_end = today() - timedelta(days=10) + timedelta(days=3)
    with session_scope() as session:
        host_request = session.execute(select(HostRequest)).scalar_one()
        assert host_request.conversation_id == host_request_id
        host_request.from_date = hack_req_start
        host_request.to_date = hack_req_end

    with references_session(token1) as api:
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 1
        assert res.pending_references[0].host_request_id == host_request_id
        assert res.pending_references[0].reference_type == references_pb2.REFERENCE_TYPE_SURFED

        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
        assert len(res.available_write_references) == 1
        assert res.available_write_references[0].host_request_id == host_request_id
        assert res.available_write_references[0].reference_type == references_pb2.REFERENCE_TYPE_SURFED

    with references_session(token2) as api:
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 1
        assert res.pending_references[0].host_request_id == host_request_id
        assert res.pending_references[0].reference_type == references_pb2.REFERENCE_TYPE_HOSTED

        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
        assert len(res.available_write_references) == 1
        assert res.available_write_references[0].host_request_id == host_request_id
        assert res.available_write_references[0].reference_type == references_pb2.REFERENCE_TYPE_HOSTED

    if hs == "host":
        with references_session(token2) as api:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=host_request_id,
                    text="Good stuff",
                    was_appropriate=True,
                    rating=0.86,
                )
            )

        with references_session(token2) as api:
            res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
            assert len(res.pending_references) == 0

            res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
            assert len(res.available_write_references) == 0

        with references_session(token1) as api:
            res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
            assert len(res.pending_references) == 1
            assert res.pending_references[0].host_request_id == host_request_id
            assert res.pending_references[0].reference_type == references_pb2.REFERENCE_TYPE_SURFED

            res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
            assert len(res.available_write_references) == 1
            assert res.available_write_references[0].host_request_id == host_request_id
            assert res.available_write_references[0].reference_type == references_pb2.REFERENCE_TYPE_SURFED
    else:
        with references_session(token1) as api:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=host_request_id,
                    text="Good stuff",
                    was_appropriate=True,
                    rating=0.86,
                )
            )

        with references_session(token1) as api:
            res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
            assert len(res.pending_references) == 0

            res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
            assert len(res.available_write_references) == 0

        with references_session(token2) as api:
            res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
            assert len(res.pending_references) == 1
            assert res.pending_references[0].host_request_id == host_request_id
            assert res.pending_references[0].reference_type == references_pb2.REFERENCE_TYPE_HOSTED

            res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
            assert len(res.available_write_references) == 1
            assert res.available_write_references[0].host_request_id == host_request_id
            assert res.available_write_references[0].reference_type == references_pb2.REFERENCE_TYPE_HOSTED
