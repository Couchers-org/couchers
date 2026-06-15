from datetime import date, datetime, timedelta

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views_rapid
from couchers.models import (
    Conversation,
    FriendRelationship,
    FriendStatus,
    HostRequest,
    HostRequestStatus,
    Message,
    MessageType,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Reference,
    ReferenceType,
    User,
)
from couchers.moderation.utils import create_moderation
from couchers.proto import api_pb2, conversations_pb2, moderation_pb2, references_pb2, requests_pb2
from couchers.utils import create_coordinate, now, to_aware_datetime, today
from tests.fixtures.db import generate_user, make_friends, make_user_block
from tests.fixtures.misc import EmailCollector, PushCollector
from tests.fixtures.sessions import (
    account_session,
    api_session,
    real_moderation_session,
    references_session,
    requests_session,
)
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def create_host_request(
    session: Session,
    surfer_user_id: int,
    host_user_id: int,
    host_request_age: timedelta = timedelta(days=15),
    status: HostRequestStatus = HostRequestStatus.confirmed,
    host_reason_didnt_meetup: str | None = None,
    surfer_reason_didnt_meetup: str | None = None,
) -> int:
    """
    Create a host request that's `host_request_age` old
    """
    from_date = today() - host_request_age - timedelta(days=2)
    to_date = today() - host_request_age
    fake_created = now() - host_request_age - timedelta(days=3)
    conversation = Conversation()
    session.add(conversation)
    session.flush()

    msg1 = Message(
        conversation_id=conversation.id,
        author_id=surfer_user_id,
        message_type=MessageType.chat_created,
    )
    msg1.time = fake_created + timedelta(seconds=1)
    session.add(msg1)

    msg2 = Message(
        conversation_id=conversation.id,
        author_id=surfer_user_id,
        text="Hi, I'm requesting to be hosted.",
        message_type=MessageType.text,
    )
    msg2.time = fake_created + timedelta(seconds=2)
    session.add(msg2)
    session.flush()

    moderation_state = create_moderation(
        session,
        ModerationObjectType.host_request,
        conversation.id,
        surfer_user_id,
    )

    host_request = HostRequest(
        conversation_id=conversation.id,
        initiator_user_id=surfer_user_id,
        recipient_user_id=host_user_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        initiator_last_seen_message_id=msg2.id,
        recipient_reason_didnt_meetup=host_reason_didnt_meetup,
        initiator_reason_didnt_meetup=surfer_reason_didnt_meetup,
        hosting_city="Test City",
        hosting_location=create_coordinate(0, 0),
        hosting_radius=10,
        moderation_state_id=moderation_state.id,
    )
    session.add(host_request)
    session.commit()
    return host_request.conversation_id


def create_host_request_by_date(
    session: Session,
    surfer_user_id: int,
    host_user_id: int,
    from_date: date,
    to_date: date,
    status: HostRequestStatus,
    host_sent_request_reminders: int,
    last_sent_request_reminder_time: datetime,
) -> int:
    conversation = Conversation()
    session.add(conversation)
    session.flush()

    msg1 = Message(
        conversation_id=conversation.id,
        author_id=surfer_user_id,
        message_type=MessageType.chat_created,
    )
    msg1.time = from_date + timedelta(seconds=1)  # type: ignore[assignment]
    session.add(msg1)

    # Unused for now, but every host request must have a message.
    msg2 = Message(
        conversation_id=conversation.id,
        author_id=surfer_user_id,
        text="Hi, I'm requesting to be hosted.",
        message_type=MessageType.text,
    )
    msg2.time = from_date + timedelta(seconds=2)  # type: ignore[assignment]
    session.add(msg2)
    session.flush()

    moderation_state = create_moderation(
        session,
        ModerationObjectType.host_request,
        conversation.id,
        surfer_user_id,
    )

    host_request = HostRequest(
        conversation_id=conversation.id,
        initiator_user_id=surfer_user_id,
        recipient_user_id=host_user_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        hosting_city="Test City",
        hosting_location=create_coordinate(0, 0),
        hosting_radius=10,
        moderation_state_id=moderation_state.id,
    )
    host_request.recipient_sent_request_reminders = host_sent_request_reminders
    host_request.last_sent_request_reminder_time = last_sent_request_reminder_time

    session.add(host_request)
    session.commit()
    return host_request.conversation_id


def create_host_reference(
    session: Session,
    from_user_id: int,
    to_user_id: int,
    reference_age: timedelta,
    *,
    surfing: bool = True,
    host_request_id: int | None = None,
) -> tuple[int, int]:
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

    if host_request.initiator_user_id == from_user_id:
        reference_type = ReferenceType.surfed
        to_user_id = host_request.recipient_user_id
        assert from_user_id == host_request.initiator_user_id
    else:
        reference_type = ReferenceType.hosted
        to_user_id = host_request.initiator_user_id
        assert from_user_id == host_request.recipient_user_id

    moderation_state = ModerationState(
        object_type=ModerationObjectType.reference,
        object_id=0,  # placeholder, set after Reference flush
        visibility=ModerationVisibility.visible,
    )
    session.add(moderation_state)
    session.flush()

    reference = Reference(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        host_request_id=host_request.conversation_id,
        text="Dummy reference",
        rating=0.5,
        was_appropriate=True,
        reference_type=reference_type,
        moderation_state_id=moderation_state.id,
    )
    reference.time = now() - reference_age

    session.add(reference)
    session.flush()
    moderation_state.object_id = reference.id
    session.commit()
    return reference.id, actual_host_request_id


def create_friend_reference(session: Session, from_user_id: int, to_user_id: int, reference_age: timedelta) -> int:
    moderation_state = ModerationState(
        object_type=ModerationObjectType.reference,
        object_id=0,  # placeholder, set after Reference flush
        visibility=ModerationVisibility.visible,
    )
    session.add(moderation_state)
    session.flush()

    reference = Reference(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        reference_type=ReferenceType.friend,
        text="Test friend request",
        rating=0.4,
        was_appropriate=True,
        moderation_state_id=moderation_state.id,
    )
    reference.time = now() - reference_age
    session.add(reference)
    session.flush()
    moderation_state.object_id = reference.id
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
        assert e.value.details() == "You need to specify at least one user."

    with references_session(token5) as api:
        # from user1 to user2
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id, to_user_id=user2.id))
        assert [ref.reference_id for ref in res.references] == [ref2b]
        assert not res.next_page_token

        # from user5 to user1
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user5.id, to_user_id=user1.id))
        assert [ref.reference_id for ref in res.references] == [ref5]
        assert not res.next_page_token


def test_num_references_matches_visible_list(db):
    # Regression test: the reference count (User.num_references) must not include references that
    # are still hidden by the reciprocal-reference rule, otherwise the count leaks the existence
    # of a hidden reference and disagrees with what ListReferences shows.
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        # user2 wrote user1 a reference for a recent stay; the 2-week window is still open and
        # user1 has not written their reciprocal reference yet, so this reference is hidden.
        create_host_reference(session, user2.id, user1.id, timedelta(days=3), surfing=False)

    with references_session(token2) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id))
        assert len(res.references) == 0

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        # count must agree with the (empty) list, not leak the hidden reference
        assert res.num_references == 0

    with session_scope() as session:
        host_request_id = session.execute(select(HostRequest.conversation_id)).scalar_one()
        # user1 writes the reciprocal reference: now both references become visible
        create_host_reference(session, user1.id, user2.id, timedelta(days=2), host_request_id=host_request_id)

    with references_session(token2) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id))
        assert len(res.references) == 1

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert res.num_references == 1


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
        session.execute(update(User).where(User.username == user2.username).values(banned_at=func.now()))

    # reference to and from banned user is hidden
    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 1
        assert len(refs_sent) == 1

    # delete user3
    with session_scope() as session:
        session.execute(update(User).where(User.username == user3.username).values(deleted_at=func.now()))

    # doesn't change; references to and from deleted users remain
    with references_session(token1) as api:
        refs_rec = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user1.id)).references
        refs_sent = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
        assert len(refs_rec) == 1
        assert len(refs_sent) == 1


def test_WriteFriendReference(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    # Make user1 and user2 friends
    make_friends(user1, user2)

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

    moderator.approve_reference(res.reference_id)

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
        assert e.value.details() == "Reference already given."

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
        assert e.value.details() == "You can't refer yourself."


def test_WriteFriendReference_with_empty_text(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with references_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(to_user_id=user2.id, text="  ", was_appropriate=True, rating=0.8)
            )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
    assert e.value.details() == "The text of a reference must not be empty"


def test_WriteFriendReference_with_private_text(
    db, email_collector: EmailCollector, push_collector: PushCollector, moderator
):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # Make users friends
    make_friends(user1, user2)

    with references_session(token1) as api:
        ref = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id,
                text="They were nice!",
                was_appropriate=True,
                rating=0.6,
                private_text="A bit of an odd ball, but a nice person nonetheless.",
            )
        )
        # Approve before patches/jobs exit so the pending notification is delivered while mocked.
        moderator.approve_reference(ref.reference_id)

    # make sure an email was sent to the user receiving the ref as well as the mods
    email_collector.pop_for_reports(last=True)
    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert email.subject == f"[TEST] You've received a friend reference from {user1.name}!"
    assert email.recipient == user2.email

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == f"New friend reference from {user1.name}"
    assert push.content.body == "They were nice!"


def test_WriteFriendReference_requires_friendship(db):
    """Test that users must be friends to write friend references"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # Try to write friend reference without being friends
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
        assert e.value.details() == "You can only write friend references for confirmed friends."

    # Now make them friends
    make_friends(user1, user2)

    # Should now be able to write a reference
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

    # Test the unfriending scenario: delete the friendship
    with session_scope() as session:
        # Change the friendship status to cancelled (simulating unfriending)
        session.execute(
            update(FriendRelationship)
            .where(FriendRelationship.from_user_id == user1.id, FriendRelationship.to_user_id == user2.id)
            .values(status=FriendStatus.cancelled)
        )

    # Try to write another friend reference after unfriending
    # (Note: This assumes user1 didn't already write a reference, or we test with user2 writing to user1)
    with references_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(
                    to_user_id=user1.id,
                    text="Another test reference",
                    was_appropriate=True,
                    rating=0.8,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You can only write friend references for confirmed friends."


def test_host_request_states_references(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        # can't write ref
        hr1 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.pending)
        # can write ref
        hr2 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.accepted)
        # can't write ref
        hr3 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.rejected)
        # can write ref
        hr4 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.confirmed)
        # can't write ref
        hr5 = create_host_request(session, user2.id, user1.id, timedelta(days=10), status=HostRequestStatus.cancelled)

    # Approve host requests so both participants can see them
    moderator.approve_host_request(hr1)
    moderator.approve_host_request(hr2)
    moderator.approve_host_request(hr3)
    moderator.approve_host_request(hr4)
    moderator.approve_host_request(hr5)

    with references_session(token1) as api:
        # pending
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr2,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )

        # accepted
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr4,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )

        # rejected
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
        assert e.value.details() == "You can't write a reference for that host request, or it wasn't found."

        # confirmed
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
        assert e.value.details() == "You can't write a reference for that host request, or it wasn't found."

        # cancelled
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
        assert e.value.details() == "You can't write a reference for that host request, or it wasn't found."


def test_WriteHostRequestReference(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    with session_scope() as session:
        # too old
        hr1 = create_host_request(session, user3.id, user1.id, timedelta(days=20))
        # valid host req, surfer said we didn't show up but we can still write a req
        hr2 = create_host_request(session, user3.id, user1.id, timedelta(days=10), surfer_reason_didnt_meetup="No show")
        # valid surfing req
        hr3 = create_host_request(session, user1.id, user3.id, timedelta(days=7))
        # not yet complete
        hr4 = create_host_request(session, user2.id, user1.id, timedelta(days=1), status=HostRequestStatus.pending)
        # we indicated we didn't meet
        hr5 = create_host_request(session, user4.id, user1.id, timedelta(days=7), host_reason_didnt_meetup="")
        # we will indicate we didn't meet
        hr6 = create_host_request(session, user4.id, user1.id, timedelta(days=8))

    # Approve host requests so both participants can see them
    moderator.approve_host_request(hr1)
    moderator.approve_host_request(hr2)
    moderator.approve_host_request(hr3)
    moderator.approve_host_request(hr4)
    moderator.approve_host_request(hr5)
    moderator.approve_host_request(hr6)

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
        assert e.value.details() == "You can't write a reference for that host request, or it wasn't found."

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
        assert e.value.details() == "You can't write a reference for that host request, or it wasn't found."

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
        assert e.value.details() == "Reference already given."

        # can write for this one too
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )

        # can't write reference for a HR that we indicated we didn't show up
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
        assert (
            e.value.details()
            == "You can't write a reference for that host request because you indicated that you didn't meet up."
        )

        # can't write reference for a HR that we indicate we didn't show up for
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
        assert (
            e.value.details()
            == "You can't write a reference for that host request because you indicated that you didn't meet up."
        )

    with references_session(token4) as api:
        # they can still write one
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr6,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
            )
        )


def test_WriteHostRequestReference_private_text(
    db, email_collector: EmailCollector, push_collector: PushCollector, moderator
):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        hr = create_host_request(session, user1.id, user2.id, timedelta(days=10))
    moderator.approve_host_request(hr)

    with references_session(token1) as api:
        ref = api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr,
                text="Should work!",
                was_appropriate=True,
                rating=0.9,
                private_text="Something",
            )
        )
        # Approve before patches/jobs exit so the pending notification is delivered while mocked.
        moderator.approve_reference(ref.reference_id)

    # make sure an email was sent to the user receiving the ref as well as the mods
    email_collector.pop_for_reports(last=True)
    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert email.subject == f"[TEST] You've received a reference from {user1.name}!"
    assert email.recipient == user2.email

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == f"New reference from {user1.name}"
    assert push.content.body == f"{user1.name} left you a reference, now it's your turn to write theirs!"


def test_GetHostRequestReferenceStatus(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # user1 writes; RPC returns has_given True
    with session_scope() as session:
        hr1 = create_host_request(session, user1.id, user2.id, timedelta(days=7))
    moderator.approve_host_request(hr1)
    with references_session(token1) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr1, text="Great stay!", was_appropriate=True, rating=0.9
            )
        )
        res = api.GetHostRequestReferenceStatus(references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr1))
        assert res.has_given is True

    # false: no reference written yet
    with session_scope() as session:
        hr2 = create_host_request(session, user1.id, user2.id, timedelta(days=7))
    moderator.approve_host_request(hr2)
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr2))
        assert res.has_given is False

    # false: other user wrote a reference
    with session_scope() as session:
        hr3 = create_host_request(session, user1.id, user2.id, timedelta(days=7))
    moderator.approve_host_request(hr3)
    with references_session(token2) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=hr3, text="Lovely guest!", was_appropriate=True, rating=0.95
            )
        )
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr3))
        assert res.has_given is False

    # false: nonexistent host request id
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(references_pb2.GetHostRequestReferenceStatusReq(host_request_id=999999))
        assert res.has_given is False

    # Additional status flags
    with session_scope() as session:
        # expired (too old)
        hr_expired = create_host_request(session, user2.id, user1.id, timedelta(days=20))
        # current user (host) indicated didn't meet up
        hr_didnt_stay_host = create_host_request(
            session, user2.id, user1.id, timedelta(days=10), host_reason_didnt_meetup=""
        )
        # other user (surfer) indicated didn't meet up
        hr_other_didnt_stay = create_host_request(
            session, user2.id, user1.id, timedelta(days=10), surfer_reason_didnt_meetup="No show"
        )

    moderator.approve_host_request(hr_expired)
    moderator.approve_host_request(hr_didnt_stay_host)
    moderator.approve_host_request(hr_other_didnt_stay)

    # expired: is_expired true, can_write false, didnt_stay false
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(
            references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr_expired)
        )
        assert res.has_given is False
        assert res.is_expired is True
        assert res.can_write is False
        assert res.didnt_stay is False

    # current user indicated didn't meet up: didnt_stay true, can_write false, not expired
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(
            references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr_didnt_stay_host)
        )
        assert res.has_given is False
        assert res.is_expired is False
        assert res.didnt_stay is True
        assert res.can_write is False

    # other party indicated didn't meet up: didnt_stay false, can_write true (within window), not expired
    with references_session(token1) as api:
        res = api.GetHostRequestReferenceStatus(
            references_pb2.GetHostRequestReferenceStatusReq(host_request_id=hr_other_didnt_stay)
        )
        assert res.has_given is False
        assert res.is_expired is False
        assert res.didnt_stay is False
        assert res.can_write is True


def test_AvailableWriteReferences_and_ListPendingReferencesToWrite(db, moderator):
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
        hr5 = create_host_request(session, user2.id, user1.id, timedelta(days=2), status=HostRequestStatus.pending)

        # already wrote friend ref to user2
        create_friend_reference(session, user1.id, user2.id, timedelta(days=1))

        # user5 deleted, reference won't show up as pending
        hr_user5 = create_host_request(session, user1.id, user5.id, timedelta(days=5))

        # user6 blocked, reference won't show up as pending
        hr_user6 = create_host_request(session, user1.id, user6.id, timedelta(days=5))

        # user7 blocking, reference won't show up as pending
        hr_user7 = create_host_request(session, user1.id, user7.id, timedelta(days=5))

        # hosted but we indicated we didn't meet up, no reason; should not show up
        hr_user8 = create_host_request(session, user8.id, user1.id, timedelta(days=11), host_reason_didnt_meetup="")

        # surfed but we indicated we didn't meet up, has reason; should not show up
        hr_user9 = create_host_request(
            session, user1.id, user9.id, timedelta(days=10), surfer_reason_didnt_meetup="They never showed up!"
        )

        # surfed but they indicated we didn't meet up, no reason; should show up
        hr6 = create_host_request(session, user1.id, user10.id, timedelta(days=4), host_reason_didnt_meetup="")

        # hosted but they indicated we didn't meet up, has reason; should show up
        hr7 = create_host_request(
            session, user11.id, user1.id, timedelta(days=3), surfer_reason_didnt_meetup="They never showed up!!"
        )

    # Approve all host requests so both participants can see them
    moderator.approve_host_request(hr1)
    moderator.approve_host_request(hr2)
    moderator.approve_host_request(hr3)
    moderator.approve_host_request(hr4)
    moderator.approve_host_request(hr5)
    moderator.approve_host_request(hr_user5)
    moderator.approve_host_request(hr_user6)
    moderator.approve_host_request(hr_user7)
    moderator.approve_host_request(hr_user8)
    moderator.approve_host_request(hr_user9)
    moderator.approve_host_request(hr6)
    moderator.approve_host_request(hr7)

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with references_session(token1) as api:
        # can't write reference for invisible user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # can't write reference for blocking user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user7.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # can't write reference for blocked user
        with pytest.raises(grpc.RpcError) as e:
            api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user6.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

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

        # can't write a req if we indicated we didn't meet up
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user8.id))
        assert len(res.available_write_references) == 0
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user9.id))
        assert len(res.available_write_references) == 0

        # can still write ref if the other person indicated we didn't meet up
        # surfed with them
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user10.id))
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr6
        assert w.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert now() + timedelta(days=10) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=11)
        # hosted them
        res = api.AvailableWriteReferences(references_pb2.AvailableWriteReferencesReq(to_user_id=user11.id))
        assert len(res.available_write_references) == 1
        w = res.available_write_references[0]
        assert w.host_request_id == hr7
        assert w.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert now() + timedelta(days=11) <= to_aware_datetime(w.time_expires) <= now() + timedelta(days=12)

        # finally check the general list
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

    with account_session(token1) as account:
        reminders = account.GetReminders(empty_pb2.Empty()).reminders
        assert [reminder.WhichOneof("reminder") for reminder in reminders] == [
            "write_reference_reminder",
            "write_reference_reminder",
            "write_reference_reminder",
            "write_reference_reminder",
        ]
        assert reminders[0].write_reference_reminder.host_request_id == hr3
        assert reminders[0].write_reference_reminder.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert reminders[0].write_reference_reminder.other_user.user_id == user3.id
        assert reminders[1].write_reference_reminder.host_request_id == hr4
        assert reminders[1].write_reference_reminder.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert reminders[1].write_reference_reminder.other_user.user_id == user4.id
        assert reminders[2].write_reference_reminder.host_request_id == hr6
        assert reminders[2].write_reference_reminder.reference_type == references_pb2.REFERENCE_TYPE_SURFED
        assert reminders[2].write_reference_reminder.other_user.user_id == user10.id
        assert reminders[3].write_reference_reminder.host_request_id == hr7
        assert reminders[3].write_reference_reminder.reference_type == references_pb2.REFERENCE_TYPE_HOSTED
        assert reminders[3].write_reference_reminder.other_user.user_id == user11.id


@pytest.mark.parametrize("hs", ["host", "surfer"])
def test_regression_disappearing_refs(db, hs, moderator):
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
                host_user_id=user2.id, from_date=req_start, to_date=req_end, text=valid_request_text()
            )
        )
        host_request_id = res.host_request_id

        moderator.approve_host_request(host_request_id)

        assert (
            api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
            .host_requests[0]
            .latest_message.text.text
            == valid_request_text()
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

    refresh_materialized_views_rapid(empty_pb2.Empty())

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


def test_WriteFriendReference_creates_shadowed_moderation_state(db):
    """New friend references start out shadowed and are not visible to non-authors."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)

    with references_session(token1) as api:
        ref = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id, text="Nice friend", was_appropriate=True, rating=0.9
            )
        )

    with session_scope() as session:
        reference = session.execute(select(Reference).where(Reference.id == ref.reference_id)).scalar_one()
        assert reference.moderation_state.visibility == ModerationVisibility.shadowed
        assert reference.moderation_state.object_type == ModerationObjectType.reference
        assert reference.moderation_state.object_id == reference.id

    # Author can see their own shadowed reference.
    with references_session(token1) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id))
        assert [r.reference_id for r in res.references] == [ref.reference_id]

    # Non-author user cannot see it while shadowed.
    with references_session(token3) as api:
        res = api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user2.id))
        assert [r.reference_id for r in res.references] == []


def test_reference_hidden_via_ums_disappears_from_listings(db, moderator):
    """Hiding a reference through UMS removes it from listings, including for the author."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)

    with references_session(token1) as api:
        ref = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id, text="Visible for now", was_appropriate=True, rating=0.9
            )
        )
    moderator.approve_reference(ref.reference_id)

    with references_session(token3) as api:
        assert api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user2.id)).references

    # Hide the reference via the moderation API.
    with real_moderation_session(moderator.token) as mod_api:
        state_res = mod_api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_REFERENCE,
                object_id=ref.reference_id,
            )
        )
        mod_api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_res.moderation_state.moderation_state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="test",
            )
        )

    # Hidden references are invisible to the author and to other users.
    with references_session(token1) as api:
        assert not api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references
    with references_session(token3) as api:
        assert not api.ListReferences(references_pb2.ListReferencesReq(to_user_id=user2.id)).references
