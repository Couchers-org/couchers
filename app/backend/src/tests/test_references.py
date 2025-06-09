from datetime import timedelta
from unittest.mock import patch

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
from tests.test_fixtures import (
    email_fields,
    generate_user,
    make_user_block,
    mock_notification_email,
    references_session,
    requests_session,
)

TEST_HOST_REQUEST_LONG_TEXT = "Hello! I am a friendly traveler looking for a place to stay while visiting your city. I enjoy cultural exchanges and am am happy to share stories from my travels. I am clean, respectful, and can offer help around the house if needed. I look forward to hearing from you!"


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def create_host_request(
    session,
    surfer_user_id,
    host_user_id,
    host_request_age=timedelta(days=15),
    status=HostRequestStatus.confirmed,
    host_reason_didnt_meetup=None,
    surfer_reason_didnt_meetup=None,
):
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
            author_id=surfer_user_id,
            message_type=MessageType.chat_created,
        )
    )
    message = Message(
        time=fake_created + timedelta(seconds=2),
        conversation_id=conversation.id,
        author_id=surfer_user_id,
        text="Hi, I'm requesting to be hosted.",
        message_type=MessageType.text,
    )
    session.add(message)
    session.flush()
    host_request = HostRequest(
        conversation_id=conversation.id,
        surfer_user_id=surfer_user_id,
        host_user_id=host_user_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        surfer_last_seen_message_id=message.id,
        host_reason_didnt_meetup=host_reason_didnt_meetup,
        surfer_reason_didnt_meetup=surfer_reason_didnt_meetup,
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
    if host_request.surfer_user_id == from_user_id:
        reference.reference_type = ReferenceType.surfed
        reference.to_user_id = host_request.host_user_id
        assert from_user_id == host_request.surfer_user_id
    else:
        reference.reference_type = ReferenceType.hosted
        reference.to_user_id = host_request.surfer_user_id
        assert from_user_id == host_request.host_user_id
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
        ref7b = create_friend_reference(session, user1.id, user7.id, timedelta(days=9))
        ref6hidden, _ = create_host_reference(session, user6.id, user1.id, timedelta(days=5), surfing=False)
        ref8b, hr8 = create_host_reference(session, user8.id, user1.id, timedelta(days=3, seconds=20), surfing=False)
        ref8c, _ = create_host_reference(
            session, user1.id, user8.id, timedelta(days=3, seconds=10), host_request_id=hr8
        )
    with references_session(token2) as api:
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
        res = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id, page_size=5))
        assert [ref.reference_id for ref in res.references] == [ref8b, ref9, ref8, ref7, ref6]
        res = api.ListReferences(
            references_pb2.ListReferencesReq(to_user_id=user1.id, page_token=res.next_page_token, page_size=5)
        )
        assert [ref.reference_id for ref in res.references] == [ref5, ref4, ref3, ref2]
        assert not res.next_page_token
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
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=user1.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_FRIEND]
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref7b, ref4b]
        assert not res.next_page_token
        res = api.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=user1.id, reference_type_filter=[references_pb2.REFERENCE_TYPE_SURFED]
            )
        )
        assert [ref.reference_id for ref in res.references] == [ref8c, ref5b]
        assert not res.next_page_token
    with references_session(token7) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.ListReferences(
                references_pb2.ListReferencesReq(reference_type_filter=[references_pb2.REFERENCE_TYPE_SURFED])
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.NEED_TO_SPECIFY_AT_LEAST_ONE_USER
    with references_session(token5) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id, to_user_id=user2.id))
        assert [ref.reference_id for ref in res.references] == [ref2b]
        assert not res.next_page_token
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
    with session_scope() as session:
        user2 = session.execute(select(User).where(User.username == user2.username)).scalar_one()
        user2.is_banned = True
        session.commit()
    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 1
        assert len(refs_sent) == 1
    with session_scope() as session:
        user3 = session.execute(select(User).where(User.username == user3.username)).scalar_one()
        user3.is_deleted = True
        session.commit()
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


def test_WriteFriendReference_with_private_text(db, push_collector):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with references_session(token1) as api:
        with patch("couchers.email.queue_email") as mock1:
            with mock_notification_email() as mock2:
                api.WriteFriendReference(
                    references_pb2.WriteFriendReferenceReq(
                        to_user_id=user2.id,
                        text="They were nice!",
                        was_appropriate=True,
                        rating=0.6,
                        private_text="A bit of an odd ball, but a nice person nonetheless.",
                    )
                )
    assert mock1.call_count == 1
    assert mock2.call_count == 1
    e = email_fields(mock2)
    assert e.subject == f"[TEST] You've received a friend reference from {user1.name}!"
    assert e.recipient == user2.email
    push_collector.assert_user_has_single_matching(
        user2.id,
        title=f"You've received a friend reference from {user1.name}!",
        body="They were nice!",
    )


def test_host_request_states_references(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        hr1 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.pending)
        hr2 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.accepted)
        hr3 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.rejected)
        hr4 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.confirmed)
        hr5 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.cancelled)
    with references_session(token1) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr2,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr4,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )
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
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr3,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_FOR_REQUEST
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr5,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_FOR_REQUEST


def test_WriteHostRequestReference(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    with session_scope() as session:
        hr1 = create_host_request(session, user3.id, user1.id, timedelta(days=20))
        hr2 = create_host_request(session, user3.id, user1.id, timedelta(days=10), surfer_reason_didnt_meetup="No show")
        hr3 = create_host_request(session, user1.id, user3.id, timedelta(days=7))
        hr4 = create_host_request(session, user2.id, user1.id, timedelta(days=1), status=HostRequestStatus.pending)
        hr5 = create_host_request(session, user4.id, user1.id, timedelta(days=7), host_reason_didnt_meetup="")
        hr6 = create_host_request(session, user4.id, user1.id, timedelta(days=8))
    with references_session(token3) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )
    with references_session(token1) as api:
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
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr2,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )
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
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr5,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_INDICATED_DIDNT_MEETUP
        api.HostRequestIndicateDidntMeetup(
            references_pb2.HostRequestIndicateDidntMeetupReq(
                host_request_id=hr6,
                reason_didnt_meetup="No clue?",
            )
        )
        with pytest.raises(grpc.RpcError) as e:
            api.WriteHostRequestReference(
                references_pb2.WriteHostRequestReferenceReq(
                    host_request_id=hr6,
                    text="Shouldn't work...",
                    was_appropriate=True,
                    rating=0.9,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_WRITE_REFERENCE_INDICATED_DIDNT_MEETUP
    with references_session(token4) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr6,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )


def test_WriteHostRequestReference_private_text(db, push_collector):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        hr = create_host_request(session, user1.id, user2.id, timedelta(days=10))
    with references_session(token1) as api:
        with patch("couchers.email.queue_email") as mock1:
            with mock_notification_email() as mock2:
                api.WriteHostRequestReference(
                    references_pb2.WriteHostRequestReferenceReq(
                        host_request_id=hr,
                        text="Should work!",
                        was_appropriate=True,
                        rating=0.9,
                        private_text="Something",
                    )
                )
    assert mock1.call_count == 1
    assert mock2.call_count == 1
    e = email_fields(mock2)
    assert e.subject == f"[TEST] You've received a reference from {user1.name}!"
    assert e.recipient == user2.email
    push_collector.assert_user_has_single_matching(
        user2.id,
        title=f"You've received a reference from {user1.name}!",
        body="Please go and write a reference for them too. It's a nice gesture and helps us build a community together!",
    )


def test_AvailableWriteReferences_and_ListPendingReferencesToWrite(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(delete_user=True)
    user6, token6 = generate_user()
    user7, token7 = generate_user()
    user8, token8 = generate_user()
    user9, token9 = generate_user()
    user10, token10 = generate_user()
    user11, token11 = generate_user()
    make_user_block(user1, user6)
    make_user_block(user7, user1)
    with session_scope() as session:
        hr1 = create_host_request(session, user3.id, user1.id, timedelta(days=20))
        create_friend_reference(session, user1.id, user3.id, timedelta(days=15, seconds=70))
        _, hr2 = create_host_reference(session, user2.id, user1.id, timedelta(days=10, seconds=110), surfing=True)
        create_host_reference(session, user1.id, user2.id, timedelta(days=10, seconds=100), host_request_id=hr2)
        hr3 = create_host_request(session, user3.id, user1.id, timedelta(days=8))
        hr4 = create_host_request(session, user1.id, user4.id, timedelta(days=5))
        hr5 = create_host_request(session, user2.id, user1.id, timedelta(days=2), status=HostRequestStatus.pending)
        create_friend_reference(session, user1.id, user2.id, timedelta(days=1))
        create_host_request(session, user1.id, user5.id, timedelta(days=5))
        create_host_request(session, user1.id, user6.id, timedelta(days=5))
        create_host_request(session, user1.id, user7.id, timedelta(days=5))
        create_host_request(session, user8.id, user1.id, timedelta(days=11), host_reason_didnt_meetup="")
        create_host_request(
            session, user1.id, user9.id, timedelta(days=10), surfer_reason_didnt_meetup="They never showed up!"
        )
        hr6 = create_host_request(session, user1.id, user10.id, timedelta(days=4), host_reason_didnt_meetup="")
        hr7 = create_host_request(
            session, user11.id, user1.id, timedelta(days=3), surfer_reason_didnt_meetup="They never showed up!!"
        )
    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user7.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user6.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user1.id))
        assert not res.can_write_friend_reference
        assert len(res.available_write_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user2.id))
        assert not res.can_write_friend_reference
        assert len(res.available_write_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user3.id))
        assert not res.can_write_friend_reference
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr3
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=6) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=7)
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user4.id))
        assert res.can_write_friend_reference
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr4
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=9) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=10)
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user8.id))
        assert len(res.available_write_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user9.id))
        assert len(res.available_write_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user10.id))
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr6
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=10) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=11)
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user11.id))
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr7
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=11) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=12)
        res = api.ListPendingReferencesToWrite(empty_pb2.Empty())
        assert len(res.pending_references) == 4
        w = res.pending_references[0]
        assert w.host_request_id == hr3
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=6) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=7)
        w = res.pending_references[1]
        assert w.host_request_id == hr4
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=9) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=10)
        w = res.pending_references[2]
        assert w.host_request_id == hr6
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=10) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=11)
        w = res.pending_references[3]
        assert w.host_request_id == hr7
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=11) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=12)


@pytest.mark.parametrize("hs", ["host", "surfer"])
def test_regression_disappearing_refs(db, hs):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    req_start = (today() + timedelta(days=2)).isoformat()
    req_end = (today() + timedelta(days=3)).isoformat()
    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=req_start, to_date=req_end, text=TEST_HOST_REQUEST_LONG_TEXT
            )
        )
        host_request_id = res.host_request_id
        assert (
            api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
            .host_requests[0]
            .latest_message.text.text
            == TEST_HOST_REQUEST_LONG_TEXT
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
