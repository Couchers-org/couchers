"""
Builders for host requests in the past and the references written about them, written straight to the database.
"""

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.models import (
    Conversation,
    HostRequest,
    HostRequestStatus,
    Message,
    MessageType,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Reference,
    ReferenceType,
)
from couchers.moderation.utils import create_moderation
from couchers.utils import create_coordinate, now, today
from tests.fixtures.public_trips import add_public_trip


def create_host_request(
    session: Session,
    surfer_user_id: int,
    host_user_id: int,
    host_request_age: timedelta = timedelta(days=15),
    status: HostRequestStatus = HostRequestStatus.confirmed,
    host_reason_didnt_meetup: str | None = None,
    surfer_reason_didnt_meetup: str | None = None,
    is_offer: bool = False,
) -> int:
    """
    Create a host request that's `host_request_age` old

    If `is_offer`, it's an offer on a public trip, so the host initiated it and the surfer received it.
    """
    from_date = today() - host_request_age - timedelta(days=2)
    to_date = today() - host_request_age
    fake_created = now() - host_request_age - timedelta(days=3)

    if is_offer:
        initiator_user_id, recipient_user_id = host_user_id, surfer_user_id
        initiator_reason, recipient_reason = host_reason_didnt_meetup, surfer_reason_didnt_meetup
    else:
        initiator_user_id, recipient_user_id = surfer_user_id, host_user_id
        initiator_reason, recipient_reason = surfer_reason_didnt_meetup, host_reason_didnt_meetup

    public_trip_id = add_public_trip(session, surfer_user_id, from_date, to_date) if is_offer else None

    conversation = Conversation()
    session.add(conversation)
    session.flush()

    msg1 = Message(
        conversation_id=conversation.id,
        author_id=initiator_user_id,
        message_type=MessageType.chat_created,
    )
    msg1.time = fake_created + timedelta(seconds=1)
    session.add(msg1)

    msg2 = Message(
        conversation_id=conversation.id,
        author_id=initiator_user_id,
        text="Hi, I'm requesting to be hosted." if not is_offer else "Hi, I'd love to host you.",
        message_type=MessageType.text,
    )
    msg2.time = fake_created + timedelta(seconds=2)
    session.add(msg2)
    session.flush()

    moderation_state = create_moderation(
        session,
        ModerationObjectType.host_request,
        conversation.id,
        initiator_user_id,
    )

    host_request = HostRequest(
        conversation_id=conversation.id,
        initiator_user_id=initiator_user_id,
        recipient_user_id=recipient_user_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        initiator_last_seen_message_id=msg2.id,
        recipient_reason_didnt_meetup=recipient_reason,
        initiator_reason_didnt_meetup=initiator_reason,
        hosting_city="Test City",
        hosting_location=create_coordinate(0, 0),
        hosting_radius=10,
        moderation_state_id=moderation_state.id,
        public_trip_id=public_trip_id,
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
