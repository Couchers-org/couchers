"""Filling in a user's data export, whose format is proto/internal/user_data_export.proto."""

import enum
from collections.abc import Collection, Iterable
from datetime import date, datetime
from typing import Any

from google.protobuf.wrappers_pb2 import BoolValue, DoubleValue, Int32Value
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased, joinedload, selectinload
from sqlalchemy.sql import or_

from couchers import urls
from couchers.helpers.references import where_references_not_hidden_by_reciprocity
from couchers.models import (
    AccountDeletionReason,
    ActivenessProbe,
    ClusterSubscription,
    Comment,
    Discussion,
    Event,
    EventOccurrence,
    EventOccurrenceAttendee,
    EventOrganizer,
    EventSubscription,
    FriendRelationship,
    FriendStatus,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    HostRequestFeedback,
    InviteCode,
    Invoice,
    Message,
    ModNote,
    Page,
    PhotoGallery,
    PhotoGalleryItem,
    PostalVerificationAttempt,
    PublicTrip,
    Reference,
    Reply,
    StrongVerificationAttempt,
    Upload,
    User,
    UserBlock,
    UserSession,
)
from couchers.proto.internal import user_data_export_pb2
from couchers.sql import users_visible_to_each_other, where_moderated_content_visible_to_user_column
from couchers.utils import Timestamp_from_datetime, get_coordinates

EXPORT_FORMAT_VERSION = 1


def _ts(value: datetime | None) -> Any:
    return Timestamp_from_datetime(value) if value is not None else None


def _date(value: date | None) -> str | None:
    return value.isoformat() if value is not None else None


def _enum(value: enum.Enum | None) -> str | None:
    return value.name if value is not None else None


def _bool(value: bool | None) -> BoolValue | None:
    return BoolValue(value=value) if value is not None else None


def _int32(value: int | None) -> Int32Value | None:
    return Int32Value(value=value) if value is not None else None


def _double(value: float | None) -> DoubleValue | None:
    return DoubleValue(value=value) if value is not None else None


class _UserRefs:
    def __init__(self, session: Session, user: User):
        self.session = session
        self.user = user
        self.usernames: dict[int, str | None] = {user.id: user.username}

    def prefetch(self, user_ids: Iterable[int | None]) -> None:
        """Resolve a batch of users in one query, so the per-id lookups below don't each cost a round trip."""
        missing = {user_id for user_id in user_ids if user_id is not None and user_id not in self.usernames}
        if not missing:
            return
        self_user = aliased(User)
        other_user = aliased(User)
        found: dict[int, str] = {
            row.id: row.username
            for row in self.session.execute(
                select(other_user.id, other_user.username)
                .select_from(other_user)
                .join(self_user, self_user.id == self.user.id)
                .where(other_user.id.in_(missing))
                .where(users_visible_to_each_other(self_user=self_user, other_user=other_user))
            )
        }
        for user_id in missing:
            self.usernames[user_id] = found.get(user_id)

    def _username(self, user_id: int) -> str | None:
        if user_id not in self.usernames:
            self.prefetch([user_id])
        return self.usernames[user_id]

    def is_visible(self, user_id: int) -> bool:
        return self._username(user_id) is not None

    def get(self, user_id: int | None) -> user_data_export_pb2.UserRef | None:
        if user_id is None:
            return None
        username = self._username(user_id)
        return user_data_export_pb2.UserRef(user_id=user_id, username=f"@{username}" if username else None)

    def get_blockee(self, user_id: int) -> user_data_export_pb2.UserRef:
        username = self.session.execute(
            select(User.username).where(User.id == user_id).where(User.is_visible)
        ).scalar_one_or_none()
        return user_data_export_pb2.UserRef(user_id=user_id, username=f"@{username}" if username else None)


def _account(user: User) -> user_data_export_pb2.Account:
    lat, lng = user.coordinates
    return user_data_export_pb2.Account(
        user_id=user.id,
        username=user.username,
        email=user.email,
        name=user.name,
        birthdate=_date(user.birthdate),
        gender=user.gender,
        pronouns=user.pronouns,
        phone=user.phone,
        phone_is_verified=user.phone_is_verified,
        phone_verified=_ts(user.phone_verification_verified),
        pending_email_change=user.new_email,
        joined=_ts(user.joined),
        profile_last_updated=_ts(user.profile_last_updated),
        city=user.city,
        hometown=user.hometown,
        latitude=_double(lat),
        longitude=_double(lng),
        location_radius=user.geom_radius,
        ui_language_preference=user.ui_language_preference,
        accepted_tos_version=user.accepted_tos,
        accepted_community_guidelines_version=user.accepted_community_guidelines,
        do_not_email=user.do_not_email,
        opt_out_of_newsletter=user.opt_out_of_newsletter,
        digest_frequency_seconds=_int32(
            int(user.digest_frequency.total_seconds()) if user.digest_frequency is not None else None
        ),
        onboarding_emails_sent=user.onboarding_emails_sent,
        last_donated=_ts(user.last_donated),
        heard_about_couchers=user.heard_about_couchers,
        signup_motivations=user.signup_motivations or [],
        signed_up_with_invite_code=user.invite_code_id,
        profile_url=urls.user_link(username=user.username),
    )


def _profile(user: User) -> user_data_export_pb2.Profile:
    return user_data_export_pb2.Profile(
        about_me=user.about_me,
        things_i_like=user.things_i_like,
        occupation=user.occupation,
        education=user.education,
        additional_information=user.additional_information,
        hosting_status=_enum(user.hosting_status),
        meetup_status=_enum(user.meetup_status),
        languages=[ability.language_code for ability in user.language_abilities],
        regions_visited=[region.code for region in user.regions_visited],
        regions_lived=[region.code for region in user.regions_lived],
        badges=[
            user_data_export_pb2.Badge(badge_id=badge.badge_id, awarded=_ts(badge.created)) for badge in user.badges
        ],
    )


def _home(user: User) -> user_data_export_pb2.Home:
    return user_data_export_pb2.Home(
        about_place=user.about_place,
        max_guests=_int32(user.max_guests),
        last_minute=_bool(user.last_minute),
        has_pets=_bool(user.has_pets),
        accepts_pets=_bool(user.accepts_pets),
        pet_details=user.pet_details,
        has_kids=_bool(user.has_kids),
        accepts_kids=_bool(user.accepts_kids),
        kid_details=user.kid_details,
        has_housemates=_bool(user.has_housemates),
        housemate_details=user.housemate_details,
        wheelchair_accessible=_bool(user.wheelchair_accessible),
        smoking_allowed=_enum(user.smoking_allowed),
        smokes_at_home=_bool(user.smokes_at_home),
        drinking_allowed=_bool(user.drinking_allowed),
        drinks_at_home=_bool(user.drinks_at_home),
        other_host_info=user.other_host_info,
        sleeping_arrangement=_enum(user.sleeping_arrangement),
        sleeping_details=user.sleeping_details,
        area=user.area,
        house_rules=user.house_rules,
        parking=_bool(user.parking),
        parking_details=_enum(user.parking_details),
        camping_ok=_bool(user.camping_ok),
    )


def _photos(session: Session, user: User) -> user_data_export_pb2.Photos:
    galleries = (
        session.execute(
            select(PhotoGallery)
            .where(PhotoGallery.owner_user_id == user.id)
            .options(selectinload(PhotoGallery.photos).joinedload(PhotoGalleryItem.upload))
            .order_by(PhotoGallery.id)
        )
        .scalars()
        .unique()
        .all()
    )
    uploads = (
        session.execute(select(Upload).where(Upload.creator_user_id == user.id).order_by(Upload.created, Upload.key))
        .scalars()
        .all()
    )
    return user_data_export_pb2.Photos(
        galleries=[
            user_data_export_pb2.Gallery(
                is_profile_gallery=gallery.id == user.profile_gallery_id,
                created=_ts(gallery.created),
                last_updated=_ts(gallery.last_updated),
                photos=[
                    user_data_export_pb2.GalleryPhoto(
                        caption=photo.caption,
                        position=photo.position,
                        created=_ts(photo.created),
                        url=photo.upload.full_url,
                    )
                    for photo in gallery.photos
                ],
            )
            for gallery in galleries
        ],
        uploads=[
            user_data_export_pb2.UploadedFile(
                credit=upload.credit,
                created=_ts(upload.created),
                url=upload.full_url,
            )
            for upload in uploads
        ],
    )


def _friend_relationships(session: Session, user: User, status: FriendStatus) -> list[FriendRelationship]:
    # As ListFriends/ListFriendRequests scope them: nothing about rejected or cancelled requests,
    # since how the other party responded is theirs and the app never shows it.
    statement = where_moderated_content_visible_to_user_column(select(FriendRelationship), FriendRelationship, user.id)
    statement = statement.where(FriendRelationship.status == status).where(
        or_(FriendRelationship.from_user_id == user.id, FriendRelationship.to_user_id == user.id)
    )
    return list(session.execute(statement.order_by(FriendRelationship.id)).scalars())


def _other_user_id(relationship: FriendRelationship, user: User) -> int:
    return relationship.to_user_id if relationship.from_user_id == user.id else relationship.from_user_id


def _friends(session: Session, user: User, refs: _UserRefs) -> list[user_data_export_pb2.Friend]:
    relationships = _friend_relationships(session, user, FriendStatus.accepted) + _friend_relationships(
        session, user, FriendStatus.pending
    )
    refs.prefetch(_other_user_id(relationship, user) for relationship in relationships)
    out = []
    for relationship in relationships:
        other_user_id = _other_user_id(relationship, user)
        if not refs.is_visible(other_user_id):
            continue
        sent = relationship.from_user_id == user.id
        pending = relationship.status == FriendStatus.pending
        out.append(
            user_data_export_pb2.Friend(
                user=refs.get(other_user_id),
                status=("request_sent" if sent else "request_received") if pending else "friends",
                time_sent=_ts(relationship.time_sent) if pending and sent else None,
            )
        )
    return out


def _blocked_users(session: Session, user: User, refs: _UserRefs) -> list[user_data_export_pb2.BlockedUser]:
    blocks = (
        session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user.id).order_by(UserBlock.id))
        .scalars()
        .all()
    )
    return [
        user_data_export_pb2.BlockedUser(
            user=refs.get_blockee(block.blocked_user_id), time_blocked=_ts(block.time_blocked)
        )
        for block in blocks
    ]


def _references(session: Session, user: User, refs: _UserRefs) -> user_data_export_pb2.References:
    written = list(
        session.execute(select(Reference).where(Reference.from_user_id == user.id).order_by(Reference.id)).scalars()
    )

    # Received ones are someone else's writing, so they're scoped exactly as ListReferences scopes
    # them: moderation-visible, and not still hidden by the reciprocal-reference rule.
    received_statement = where_moderated_content_visible_to_user_column(select(Reference), Reference, user.id)
    received_statement = where_references_not_hidden_by_reciprocity(received_statement)
    received = list(
        session.execute(received_statement.where(Reference.to_user_id == user.id).order_by(Reference.id)).scalars()
    )

    refs.prefetch([reference.to_user_id for reference in written])
    refs.prefetch([reference.from_user_id for reference in received])

    return user_data_export_pb2.References(
        written=[
            user_data_export_pb2.ReferenceWritten(
                to_user=refs.get(reference.to_user_id),
                reference_type=_enum(reference.reference_type),
                time=_ts(reference.time),
                text=reference.text,
            )
            for reference in written
        ],
        received=[
            user_data_export_pb2.ReferenceReceived(
                from_user=refs.get(reference.from_user_id),
                reference_type=_enum(reference.reference_type),
                time=_ts(reference.time.replace(hour=0, minute=0, second=0, microsecond=0)),
                text=reference.text,
            )
            for reference in received
            if refs.is_visible(reference.from_user_id)
        ],
    )


def _messages_by_conversation(
    session: Session, refs: _UserRefs, conversation_ids: Collection[int]
) -> dict[int, list[Message]]:
    """All the messages for a set of conversations in one query, rather than one query per conversation."""
    by_conversation: dict[int, list[Message]] = {}
    if not conversation_ids:
        return by_conversation
    messages = list(
        session.execute(
            select(Message).where(Message.conversation_id.in_(conversation_ids)).order_by(Message.id)
        ).scalars()
    )
    refs.prefetch(message.author_id for message in messages)
    refs.prefetch(message.target_id for message in messages)
    for message in messages:
        by_conversation.setdefault(message.conversation_id, []).append(message)
    return by_conversation


def _visible_messages(messages: list[Message], user: User, refs: _UserRefs) -> list[Message]:
    return [message for message in messages if message.author_id == user.id or refs.is_visible(message.author_id)]


def _chat_message(message: Message, refs: _UserRefs) -> user_data_export_pb2.ChatMessage:
    return user_data_export_pb2.ChatMessage(
        author=refs.get(message.author_id),
        time=_ts(message.time),
        message_type=_enum(message.message_type),
        text=message.text,
        target=refs.get(message.target_id),
        host_request_status_target=_enum(message.host_request_status_target),
    )


def _host_requests(session: Session, user: User, refs: _UserRefs) -> list[user_data_export_pb2.HostRequest]:
    statement = where_moderated_content_visible_to_user_column(select(HostRequest), HostRequest, user.id)
    host_requests = list(
        session.execute(
            statement.where(or_(HostRequest.surfer_user_id == user.id, HostRequest.host_user_id == user.id))
            .options(joinedload(HostRequest.conversation))
            .order_by(HostRequest.conversation_id)
        ).scalars()
    )
    refs.prefetch(host_request.surfer_user_id for host_request in host_requests)
    refs.prefetch(host_request.host_user_id for host_request in host_requests)
    messages_by_conversation = _messages_by_conversation(
        session, refs, [host_request.conversation_id for host_request in host_requests]
    )
    feedback_by_request: dict[int, list[HostRequestFeedback]] = {}
    for item in (
        session.execute(
            select(HostRequestFeedback)
            .where(HostRequestFeedback.from_user_id == user.id)
            .order_by(HostRequestFeedback.id)
        )
        .scalars()
        .all()
    ):
        feedback_by_request.setdefault(item.host_request_id, []).append(item)

    out = []
    for host_request in host_requests:
        messages = messages_by_conversation.get(host_request.conversation_id, [])
        is_initiator = host_request.initiator_user_id == user.id
        out.append(
            user_data_export_pb2.HostRequest(
                role="surfer" if host_request.surfer_user_id == user.id else "host",
                surfer=refs.get(host_request.surfer_user_id),
                host=refs.get(host_request.host_user_id),
                status=_enum(host_request.status),
                from_date=_date(host_request.from_date),
                to_date=_date(host_request.to_date),
                hosting_city=host_request.hosting_city,
                created=_ts(host_request.conversation.created),
                my_reason_didnt_meetup=(
                    host_request.initiator_reason_didnt_meetup
                    if is_initiator
                    else host_request.recipient_reason_didnt_meetup
                ),
                my_feedback=[
                    user_data_export_pb2.HostRequestFeedback(
                        time=_ts(item.time),
                        request_quality=_enum(item.request_quality),
                        decline_reason=item.decline_reason,
                    )
                    for item in feedback_by_request.get(host_request.conversation_id, [])
                ],
                messages=[_chat_message(message, refs) for message in _visible_messages(messages, user, refs)],
            )
        )
    return out


def _group_chats(session: Session, user: User, refs: _UserRefs) -> list[user_data_export_pb2.GroupChat]:
    subscriptions_by_chat: dict[int, list[GroupChatSubscription]] = {}
    for subscription in (
        session.execute(
            select(GroupChatSubscription)
            .where(GroupChatSubscription.user_id == user.id)
            .order_by(GroupChatSubscription.id)
        )
        .scalars()
        .all()
    ):
        subscriptions_by_chat.setdefault(subscription.group_chat_id, []).append(subscription)

    visible_chat_ids = set(
        session.execute(
            where_moderated_content_visible_to_user_column(select(GroupChat.conversation_id), GroupChat, user.id).where(
                GroupChat.conversation_id.in_(subscriptions_by_chat)
            )
        ).scalars()
    )

    group_chats = {
        group_chat.conversation_id: group_chat
        for group_chat in session.execute(
            select(GroupChat)
            .where(GroupChat.conversation_id.in_(visible_chat_ids))
            .options(joinedload(GroupChat.conversation))
        ).scalars()
    }
    refs.prefetch(group_chat.creator_id for group_chat in group_chats.values())
    messages_by_conversation = _messages_by_conversation(session, refs, visible_chat_ids)

    out = []
    for chat_id, chat_subscriptions in sorted(subscriptions_by_chat.items()):
        if chat_id not in visible_chat_ids:
            continue
        group_chat = group_chats[chat_id]
        messages = messages_by_conversation.get(chat_id, [])
        # rejoining a chat doesn't hand them the backlog from while they were out of it
        windows = [(subscription.joined, subscription.left) for subscription in chat_subscriptions]
        in_window = [
            message
            for message in messages
            if any(joined <= message.time and (left is None or message.time <= left) for joined, left in windows)
        ]
        visible = _visible_messages(in_window, user, refs)
        out.append(
            user_data_export_pb2.GroupChat(
                title=group_chat.title,
                created=_ts(group_chat.conversation.created),
                creator=refs.get(group_chat.creator_id),
                messages=[_chat_message(message, refs) for message in visible],
            )
        )
    return out


def _occurrence(
    occurrence: EventOccurrence, attendee_status: str | None = None
) -> user_data_export_pb2.EventOccurrence:
    coordinates = get_coordinates(occurrence.geom)
    lat, lng = coordinates if coordinates else (None, None)
    return user_data_export_pb2.EventOccurrence(
        title=occurrence.event.title,
        content=occurrence.content,
        address=occurrence.address,
        latitude=_double(lat),
        longitude=_double(lng),
        timezone=occurrence.timezone,
        start=_ts(occurrence.during.lower),
        end=_ts(occurrence.during.upper),
        is_cancelled=occurrence.is_cancelled,
        is_deleted=occurrence.is_deleted,
        created=_ts(occurrence.created),
        url=urls.event_link(occurrence_id=occurrence.id, slug=occurrence.event.slug),
        attendee_status=attendee_status,
    )


def _events(session: Session, user: User) -> user_data_export_pb2.Events:
    created = (
        session.execute(
            select(EventOccurrence)
            .where(EventOccurrence.creator_user_id == user.id)
            .options(joinedload(EventOccurrence.event))
            .order_by(EventOccurrence.id)
        )
        .scalars()
        .all()
    )
    # ListMyEvents scopes all of organizing/subscribed/attending by occurrence visibility
    visible_event_ids = where_moderated_content_visible_to_user_column(
        select(EventOccurrence.event_id), EventOccurrence, user.id
    )
    organizing = (
        session.execute(
            select(Event)
            .join(EventOrganizer, EventOrganizer.event_id == Event.id)
            .where(EventOrganizer.user_id == user.id)
            .where(Event.id.in_(visible_event_ids))
            .order_by(Event.id)
        )
        .scalars()
        .all()
    )
    attending_statement = where_moderated_content_visible_to_user_column(
        select(EventOccurrence, EventOccurrenceAttendee.attendee_status), EventOccurrence, user.id
    )
    attending = session.execute(
        attending_statement.join(EventOccurrenceAttendee, EventOccurrenceAttendee.occurrence_id == EventOccurrence.id)
        .where(EventOccurrenceAttendee.user_id == user.id)
        .options(joinedload(EventOccurrence.event))
        .order_by(EventOccurrence.id)
    ).all()
    subscribed = (
        session.execute(
            select(Event)
            .join(EventSubscription, EventSubscription.event_id == Event.id)
            .where(EventSubscription.user_id == user.id)
            .where(Event.id.in_(visible_event_ids))
            .order_by(Event.id)
        )
        .scalars()
        .all()
    )

    return user_data_export_pb2.Events(
        created=[_occurrence(occurrence) for occurrence in created],
        organizing=[user_data_export_pb2.EventRef(title=event.title) for event in organizing],
        attending=[
            _occurrence(occurrence, attendee_status=_enum(attendee_status)) for occurrence, attendee_status in attending
        ],
        subscribed=[user_data_export_pb2.EventRef(title=event.title) for event in subscribed],
    )


def _thread_contexts(session: Session, thread_ids: set[int]) -> dict[int, user_data_export_pb2.ThreadContext]:
    if not thread_ids:
        return {}
    contexts: dict[int, user_data_export_pb2.ThreadContext] = {}
    for discussion_id, thread_id, title in session.execute(
        select(Discussion.id, Discussion.thread_id, Discussion.title).where(Discussion.thread_id.in_(thread_ids))
    ):
        contexts[thread_id] = user_data_export_pb2.ThreadContext(type="discussion", title=title)
    for event_id, thread_id, title in session.execute(
        select(Event.id, Event.thread_id, Event.title).where(Event.thread_id.in_(thread_ids))
    ):
        contexts[thread_id] = user_data_export_pb2.ThreadContext(type="event", title=title)
    for (thread_id,) in session.execute(select(Page.thread_id).where(Page.thread_id.in_(thread_ids))):
        contexts[thread_id] = user_data_export_pb2.ThreadContext(type="page")
    return contexts


def _discussions(session: Session, user: User) -> user_data_export_pb2.Discussions:
    discussions = (
        session.execute(select(Discussion).where(Discussion.creator_user_id == user.id).order_by(Discussion.id))
        .scalars()
        .all()
    )
    comments = (
        session.execute(select(Comment).where(Comment.author_user_id == user.id).order_by(Comment.id)).scalars().all()
    )
    replies = session.execute(
        select(Reply, Comment.thread_id)
        .join(Comment, Comment.id == Reply.comment_id)
        .where(Reply.author_user_id == user.id)
        .order_by(Reply.id)
    ).all()

    contexts = _thread_contexts(
        session, {comment.thread_id for comment in comments} | {thread_id for _, thread_id in replies}
    )

    return user_data_export_pb2.Discussions(
        created=[
            user_data_export_pb2.DiscussionCreated(
                title=discussion.title,
                content=discussion.content,
                created=_ts(discussion.created),
                last_edited=_ts(discussion.last_edited),
                deleted=_ts(discussion.deleted),
                url=urls.discussion_link(discussion_id=str(discussion.id), slug=discussion.slug),
            )
            for discussion in discussions
        ],
        comments=[
            user_data_export_pb2.Comment(
                posted_in=contexts.get(comment.thread_id),
                content=comment.content,
                created=_ts(comment.created),
                last_edited=_ts(comment.last_edited),
                deleted=_ts(comment.deleted),
            )
            for comment in comments
        ],
        replies=[
            user_data_export_pb2.Reply(
                posted_in=contexts.get(thread_id),
                content=reply.content,
                created=_ts(reply.created),
                last_edited=_ts(reply.last_edited),
                deleted=_ts(reply.deleted),
            )
            for reply, thread_id in replies
        ],
    )


def _communities(session: Session, user: User) -> list[user_data_export_pb2.CommunityMembership]:
    subscriptions = (
        session.execute(
            select(ClusterSubscription)
            .where(ClusterSubscription.user_id == user.id)
            .options(joinedload(ClusterSubscription.cluster))
            .order_by(ClusterSubscription.id)
        )
        .scalars()
        .all()
    )
    return [
        user_data_export_pb2.CommunityMembership(
            name=subscription.cluster.name,
        )
        for subscription in subscriptions
    ]


def _public_trips(session: Session, user: User) -> list[user_data_export_pb2.PublicTrip]:
    trips = (
        session.execute(select(PublicTrip).where(PublicTrip.user_id == user.id).order_by(PublicTrip.id)).scalars().all()
    )
    return [
        user_data_export_pb2.PublicTrip(
            from_date=_date(trip.from_date),
            to_date=_date(trip.to_date),
            description=trip.description,
            status=_enum(trip.status),
            same_gender_only=trip.same_gender_only,
            created=_ts(trip.created),
        )
        for trip in trips
    ]


def _donations(session: Session, user: User) -> list[user_data_export_pb2.Invoice]:
    invoices = session.execute(select(Invoice).where(Invoice.user_id == user.id).order_by(Invoice.id)).scalars().all()
    return [
        user_data_export_pb2.Invoice(
            created=_ts(invoice.created),
            amount=invoice.amount,
            invoice_type=_enum(invoice.invoice_type),
            receipt_url=invoice.stripe_receipt_url,
        )
        for invoice in invoices
    ]


def _verification(session: Session, user: User) -> user_data_export_pb2.Verification:
    strong = (
        session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == user.id)
            .order_by(StrongVerificationAttempt.id)
        )
        .scalars()
        .all()
    )
    postal = (
        session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.user_id == user.id)
            .order_by(PostalVerificationAttempt.id)
        )
        .scalars()
        .all()
    )
    return user_data_export_pb2.Verification(
        strong_verification=[
            user_data_export_pb2.StrongVerificationAttempt(
                created=_ts(attempt.created),
                status=_enum(attempt.status),
                passport_date_of_birth=_date(attempt.passport_date_of_birth),
                passport_sex=_enum(attempt.passport_sex),
                passport_expiry_date=_date(attempt.passport_expiry_date),
                passport_nationality=attempt.passport_nationality,
                passport_last_three_document_chars=attempt.passport_last_three_document_chars,
            )
            for attempt in strong
        ],
        postal_verification=[
            user_data_export_pb2.PostalVerificationAttempt(
                created=_ts(attempt.created),
                status=_enum(attempt.status),
                address_line_1=attempt.address_line_1,
                address_line_2=attempt.address_line_2,
                city=attempt.city,
                state=attempt.state,
                postal_code=attempt.postal_code,
                country_code=attempt.country_code,
                address_confirmed=_ts(attempt.address_confirmed_at),
                postcard_sent=_ts(attempt.postcard_sent_at),
                verified=_ts(attempt.verified_at),
            )
            for attempt in postal
        ],
    )


def _logins(session: Session, user: User) -> list[user_data_export_pb2.Login]:
    sessions = (
        session.execute(select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created))
        .scalars()
        .all()
    )
    return [
        user_data_export_pb2.Login(
            created=_ts(user_session.created),
            last_seen=_ts(user_session.last_seen),
            logged_out=_ts(user_session.deleted),
            ip_address=user_session.ip_address,
            user_agent=user_session.user_agent,
        )
        for user_session in sessions
    ]


def generate_user_data_export(session: Session, user: User, generated: datetime) -> user_data_export_pb2.UserDataExport:
    refs = _UserRefs(session, user)

    mod_notes = session.execute(select(ModNote).where(ModNote.user_id == user.id).order_by(ModNote.id)).scalars().all()
    probes = (
        session.execute(select(ActivenessProbe).where(ActivenessProbe.user_id == user.id).order_by(ActivenessProbe.id))
        .scalars()
        .all()
    )
    deletion_reasons = (
        session.execute(
            select(AccountDeletionReason)
            .where(AccountDeletionReason.user_id == user.id)
            .order_by(AccountDeletionReason.id)
        )
        .scalars()
        .all()
    )
    invite_codes = (
        session.execute(select(InviteCode).where(InviteCode.creator_user_id == user.id).order_by(InviteCode.created))
        .scalars()
        .all()
    )

    return user_data_export_pb2.UserDataExport(
        export_format_version=EXPORT_FORMAT_VERSION,
        generated=_ts(generated),
        account=_account(user),
        profile=_profile(user),
        home=_home(user),
        photos=_photos(session, user),
        friends=_friends(session, user, refs),
        blocked_users=_blocked_users(session, user, refs),
        references=_references(session, user, refs),
        host_requests=_host_requests(session, user, refs),
        group_chats=_group_chats(session, user, refs),
        events=_events(session, user),
        discussions=_discussions(session, user),
        communities=_communities(session, user),
        public_trips=_public_trips(session, user),
        donations=_donations(session, user),
        verification=_verification(session, user),
        logins=_logins(session, user),
        mod_notes_received=[
            user_data_export_pb2.ModNoteReceived(
                created=_ts(note.created),
                acknowledged=_ts(note.acknowledged),
                content=note.note_content,
            )
            for note in mod_notes
        ],
        activeness_probes=[
            user_data_export_pb2.ActivenessProbe(
                probe_initiated=_ts(probe.probe_initiated),
                responded=_ts(probe.responded),
                response=_enum(probe.response),
            )
            for probe in probes
        ],
        account_deletion_reasons=[
            user_data_export_pb2.AccountDeletionReason(created=_ts(reason.created), reason=reason.reason)
            for reason in deletion_reasons
        ],
        invite_codes_created=[
            user_data_export_pb2.InviteCode(code=code.id, created=_ts(code.created), disabled=_ts(code.disabled))
            for code in invite_codes
        ],
    )
