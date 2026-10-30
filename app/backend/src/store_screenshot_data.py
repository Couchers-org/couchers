"""
Seeds realistic data for the app store screenshots (see app/mobile/scripts/store-screenshots).

Builds on the regular dummy data, which must already be loaded (it provides the parent communities). Safe to re-run:
each run brings the database in line with data/store_screenshots.json, creating what's missing, updating what changed,
retiring stays and events that are no longer in the file, and moving dates so stays and events are always upcoming.

Usage (from app/): docker compose exec -e PROMETHEUS_MULTIPROC_DIR=/tmp backend python src/store_screenshot_data.py [--names '{"ines_s": "Ana"}']
"""

import argparse
import json
import logging
import os
from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from psycopg.types.range import TimestamptzRange
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from couchers.config import config
from couchers.crypto import hash_password
from couchers.db import session_scope
from couchers.helpers.clusters import CHILD_NODE_TYPE
from couchers.models import (
    AttendeeStatus,
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Comment,
    Conversation,
    Discussion,
    Event,
    EventOccurrence,
    EventOccurrenceAttendee,
    EventOrganizer,
    EventSubscription,
    FriendRelationship,
    FriendStatus,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    HostRequest,
    HostRequestStatus,
    LanguageAbility,
    LanguageFluency,
    Message,
    MessageType,
    ModerationObjectType,
    ModerationVisibility,
    Node,
    Page,
    PageType,
    PageVersion,
    PhotoGallery,
    PhotoGalleryItem,
    Reference,
    ReferenceType,
    RegionLived,
    RegionVisited,
    SleepingArrangement,
    Thread,
    Upload,
    User,
)
from couchers.moderation.utils import create_moderation
from couchers.proto.api_pb2 import HostingStatus
from couchers.servicers.api import hostingstatus2sql
from couchers.utils import create_coordinate, create_polygon_lng_lat, now, to_multi, today
from dummy_data import _add_dummy_user

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "store_screenshots.json")
DEMO_PASSWORD = "store-screenshots"
EMAIL_DOMAIN = "screenshots.couchers.invalid"


# the screenshot script puts the matching images in the media server's uploads folder
def avatar_filename(username: str) -> str:
    return f"store-{username}.jpg"


def cover_filename(cover: str) -> str:
    return f"store-event-{cover}.jpg"


def _user(session: Session, username: str) -> User:
    return session.execute(select(User).where(User.username == username)).scalar_one()


def _official_cluster(session: Session, name: str) -> Cluster:
    cluster = session.execute(
        select(Cluster).where(Cluster.name == name).where(Cluster.is_official_cluster)
    ).scalar_one_or_none()
    if not cluster:
        raise RuntimeError(f"Community {name!r} not found, load the regular dummy data first")
    return cluster


def _make_visible(session: Session, object_type: ModerationObjectType, object_id: Any, creator_user_id: int) -> int:
    moderation_state = create_moderation(session, object_type, object_id, creator_user_id)
    moderation_state.visibility = ModerationVisibility.visible
    session.flush()
    return moderation_state.id


def _seeded_user_ids(session: Session) -> list[int]:
    return list(session.execute(select(User.id).where(User.email.like(f"%@{EMAIL_DOMAIN}"))).scalars())


# ---------- people ----------


def _sync_users(session: Session, data: dict[str, Any], names: dict[str, str]) -> None:
    for user_data in data["users"]:
        username = user_data["username"]
        user = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user:
            user = _add_dummy_user(
                session, {**user_data, "email": f"{username}@{EMAIL_DOMAIN}", "community_standing": 0.9}
            )
            user.hashed_password = hash_password(DEMO_PASSWORD)
            gallery = PhotoGallery(owner_user_id=user.id)
            session.add(gallery)
            session.flush()
            user.profile_gallery_id = gallery.id
            avatar_key = f"store-{username}-avatar"
            session.add(Upload(key=avatar_key, filename=avatar_filename(username), creator_user_id=user.id))
            session.add(PhotoGalleryItem(gallery_id=gallery.id, upload_key=avatar_key, position=0))

        location = user_data["location"]
        user.name = names.get(username, user_data["name"])
        user.gender = user_data["gender"]
        user.occupation = user_data["occupation"]
        user.about_me = user_data["about_me"]
        user.about_place = user_data["about_place"]
        user.city = location["city"]
        user.geom = create_coordinate(location["lat"], location["lng"])
        user.hosting_status = hostingstatus2sql[HostingStatus.Value(user_data["hosting_status"])]  # type: ignore[assignment]
        user.last_active = now()
        # completes the "My home" section, so there's no reminder to fill it in
        user.max_guests = 2
        user.sleeping_arrangement = SleepingArrangement.common

        for model in (LanguageAbility, RegionVisited, RegionLived):
            session.execute(delete(model).where(model.user_id == user.id))
        for language, fluency in user_data["languages"]:
            session.add(LanguageAbility(user_id=user.id, language_code=language, fluency=LanguageFluency[fluency]))
        for region in user_data["regions_visited"]:
            session.add(RegionVisited(user_id=user.id, region_code=region))
        for region in user_data["regions_lived"]:
            session.add(RegionLived(user_id=user.id, region_code=region))
        session.flush()


def _sync_friendships(session: Session, data: dict[str, Any]) -> None:
    for username1, username2 in data["friendships"]:
        from_user, to_user = _user(session, username1), _user(session, username2)
        if session.execute(
            select(FriendRelationship).where(
                or_(
                    (FriendRelationship.from_user_id == from_user.id) & (FriendRelationship.to_user_id == to_user.id),
                    (FriendRelationship.from_user_id == to_user.id) & (FriendRelationship.to_user_id == from_user.id),
                )
            )
        ).first():
            continue

        def create_friend_relationship(
            moderation_state_id: int, from_user: User = from_user, to_user: User = to_user
        ) -> int:
            relationship = FriendRelationship(
                from_user_id=from_user.id,
                to_user_id=to_user.id,
                status=FriendStatus.accepted,
                moderation_state_id=moderation_state_id,
            )
            session.add(relationship)
            session.flush()
            return relationship.id

        _make_visible(session, ModerationObjectType.friend_request, create_friend_relationship, from_user.id)


# ---------- community ----------


def _ensure_home_community(session: Session, data: dict[str, Any]) -> Cluster:
    home = data["home_community"]
    location = create_coordinate(home["location"]["lat"], home["location"]["lng"])
    existing = session.execute(
        select(Cluster).where(Cluster.name == home["name"]).where(Cluster.is_official_cluster)
    ).scalar_one_or_none()
    if existing:
        # the page location centres the map at the top of the community page
        page_version = session.execute(
            select(PageVersion)
            .join(Page, Page.id == PageVersion.page_id)
            .where(Page.owner_cluster_id == existing.id)
            .where(Page.type == PageType.main_page)
            .order_by(PageVersion.id.desc())
            .limit(1)
        ).scalar_one()
        page_version.geom = location
        page_version.address = home["location"]["address"]
        return existing

    parent_node = session.execute(
        select(Node).where(Node.id == _official_cluster(session, home["parent"]).parent_node_id)
    ).scalar_one()
    node = Node(
        geom=to_multi(create_polygon_lng_lat(home["coordinates"])),
        parent_node_id=parent_node.id,
        node_type=CHILD_NODE_TYPE[parent_node.node_type],
    )
    session.add(node)
    session.flush()
    cluster = Cluster(
        name=home["name"], description=home["description"], parent_node_id=node.id, is_official_cluster=True
    )
    session.add(cluster)
    session.flush()
    thread = Thread()
    session.add(thread)
    session.flush()
    admin = _user(session, data["community_members"][1])
    page = Page(
        parent_node_id=node.id,
        creator_user_id=admin.id,
        owner_cluster_id=cluster.id,
        type=PageType.main_page,
        thread_id=thread.id,
    )
    session.add(page)
    session.flush()
    session.add(
        PageVersion(
            page_id=page.id,
            editor_user_id=admin.id,
            title=home["name"],
            content=home["content"],
            geom=location,
            address=home["location"]["address"],
        )
    )
    session.flush()
    return cluster


def _community_and_parents(session: Session, cluster: Cluster) -> list[Cluster]:
    clusters = [cluster]
    node = session.execute(select(Node).where(Node.id == cluster.parent_node_id)).scalar_one()
    while node.parent_node_id:
        node = session.execute(select(Node).where(Node.id == node.parent_node_id)).scalar_one()
        clusters.append(
            session.execute(
                select(Cluster).where(Cluster.parent_node_id == node.id).where(Cluster.is_official_cluster)
            ).scalar_one()
        )
    return clusters


def _sync_community_members(session: Session, data: dict[str, Any], home: Cluster) -> None:
    clusters = _community_and_parents(session, home)
    cluster_ids = [cluster.id for cluster in clusters]
    for username in data["community_members"]:
        user = _user(session, username)
        for cluster in clusters:
            if not session.execute(
                select(ClusterSubscription)
                .where(ClusterSubscription.user_id == user.id)
                .where(ClusterSubscription.cluster_id == cluster.id)
            ).first():
                session.add(ClusterSubscription(user_id=user.id, cluster_id=cluster.id, role=ClusterRole.member))
        # people only belong to their current home community, not ones from older versions of the data
        session.execute(
            delete(ClusterSubscription)
            .where(ClusterSubscription.user_id == user.id)
            .where(ClusterSubscription.cluster_id.not_in(cluster_ids))
        )
    session.flush()


def _sync_discussions(session: Session, data: dict[str, Any], home: Cluster) -> None:
    for discussion_data in data["discussions"]:
        discussion = session.execute(
            select(Discussion)
            .where(Discussion.owner_cluster_id == home.id)
            .where(Discussion.title == discussion_data["title"])
        ).scalar_one_or_none()
        if not discussion:
            creator = _user(session, discussion_data["creator"])
            thread = Thread()
            session.add(thread)
            session.flush()

            def create_discussion(
                moderation_state_id: int,
                creator: User = creator,
                discussion_data: Any = discussion_data,
                thread: Thread = thread,
            ) -> int:
                discussion = Discussion(
                    title=discussion_data["title"],
                    content=discussion_data["content"],
                    creator_user_id=creator.id,
                    owner_cluster_id=home.id,
                    thread_id=thread.id,
                    moderation_state_id=moderation_state_id,
                )
                session.add(discussion)
                session.flush()
                return discussion.id

            _make_visible(session, ModerationObjectType.discussion, create_discussion, creator.id)
            discussion = session.execute(select(Discussion).where(Discussion.thread_id == thread.id)).scalar_one()
        discussion.created = now() - timedelta(minutes=discussion_data["minutes_ago"])

        for comment_data in discussion_data["comments"]:
            author = _user(session, comment_data["author"])
            comment = session.execute(
                select(Comment)
                .where(Comment.thread_id == discussion.thread_id)
                .where(Comment.content == comment_data["text"])
            ).scalar_one_or_none()
            if not comment:

                def create_comment(
                    moderation_state_id: int,
                    author: User = author,
                    comment_data: Any = comment_data,
                    thread_id: int = discussion.thread_id,
                ) -> int:
                    comment = Comment(
                        thread_id=thread_id,
                        author_user_id=author.id,
                        content=comment_data["text"],
                        moderation_state_id=moderation_state_id,
                    )
                    session.add(comment)
                    session.flush()
                    return comment.id

                moderation_state_id = _make_visible(session, ModerationObjectType.comment, create_comment, author.id)
                comment = session.execute(
                    select(Comment).where(Comment.moderation_state_id == moderation_state_id)
                ).scalar_one()
            comment.created = now() - timedelta(minutes=comment_data["minutes_ago"])
        session.flush()


# ---------- conversations ----------


def _add_messages(session: Session, conversation_id: int, messages: list[dict[str, Any]]) -> Message:
    last = None
    for message in messages:
        if "status_change" in message:
            last = Message(
                conversation_id=conversation_id,
                author_id=_user(session, message["author"]).id,
                message_type=MessageType.host_request_status_changed,
                host_request_status_target=HostRequestStatus[message["status_change"]],
            )
        else:
            last = Message(
                conversation_id=conversation_id,
                author_id=_user(session, message["author"]).id,
                message_type=MessageType.text,
                text=message["text"],
            )
        last.time = now() - timedelta(minutes=message["minutes_ago"])
        session.add(last)
    session.flush()
    assert last is not None
    return last


def _create_host_request(
    session: Session,
    surfer: User,
    host: User,
    status: HostRequestStatus,
    messages: list[dict[str, Any]],
    from_date: date,
    to_date: date,
) -> int:
    conversation = Conversation()
    session.add(conversation)
    session.flush()
    created = Message(conversation_id=conversation.id, author_id=surfer.id, message_type=MessageType.chat_created)
    created.time = now() - timedelta(minutes=messages[0]["minutes_ago"] + 1)
    session.add(created)
    last_message = _add_messages(session, conversation.id, messages)

    moderation_state_id = _make_visible(session, ModerationObjectType.host_request, conversation.id, surfer.id)
    session.add(
        HostRequest(
            conversation_id=conversation.id,
            initiator_user_id=surfer.id,
            recipient_user_id=host.id,
            moderation_state_id=moderation_state_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            initiator_last_seen_message_id=last_message.id,
            recipient_last_seen_message_id=last_message.id,
            hosting_city=host.city,
            hosting_location=host.geom,
            hosting_radius=host.geom_radius,
        )
    )
    session.flush()
    return conversation.id


def _sync_host_requests(session: Session, data: dict[str, Any]) -> dict[int, list[dict[str, Any]]]:
    """Returns the messages of each upcoming stay's conversation, by conversation id."""
    conversations = {}
    for request in data["host_requests"]:
        surfer, host = _user(session, request["surfer"]), _user(session, request["host"])
        host_request = session.execute(
            select(HostRequest)
            .where(HostRequest.initiator_user_id == surfer.id)
            .where(HostRequest.recipient_user_id == host.id)
            .where(HostRequest.from_date >= today())
            .order_by(HostRequest.from_date.desc())
            .limit(1)
        ).scalar_one_or_none()
        if not host_request:
            conversation_id = _create_host_request(
                session, surfer, host, HostRequestStatus[request["status"]], request["messages"], today(), today()
            )
            host_request = session.execute(
                select(HostRequest).where(HostRequest.conversation_id == conversation_id)
            ).scalar_one()
        host_request.status = HostRequestStatus[request["status"]]
        host_request.from_date = today() + timedelta(days=request["from_days"])
        host_request.to_date = host_request.from_date + timedelta(days=request["nights"])
        conversations[host_request.conversation_id] = [
            {
                "author": request["surfer"],
                "minutes_ago": request["messages"][0]["minutes_ago"] + 1,
                "chat_created": True,
            },
            *request["messages"],
        ]

    # cancel and archive upcoming stays of the demo user from older versions of the data
    demo_user = _user(session, data["demo_username"])
    for stale in session.execute(
        select(HostRequest)
        .where(or_(HostRequest.initiator_user_id == demo_user.id, HostRequest.recipient_user_id == demo_user.id))
        .where(HostRequest.from_date >= today())
        .where(HostRequest.conversation_id.not_in(conversations))
    ).scalars():
        stale.status = HostRequestStatus.cancelled
        stale.is_initiator_archived = True
        stale.is_recipient_archived = True
    session.flush()
    return conversations


def _sync_references(session: Session, data: dict[str, Any]) -> None:
    for i, reference in enumerate(data["references"]):
        from_user, to_user = _user(session, reference["from"]), _user(session, reference["to"])
        reference_type = ReferenceType[reference["type"]]
        existing = session.execute(
            select(Reference).where(Reference.from_user_id == from_user.id).where(Reference.to_user_id == to_user.id)
        ).scalar_one_or_none()
        if existing:
            existing.text = reference["text"]
            continue

        # stay references must be tied to a past stay between the two
        host_request_id = None
        if reference_type != ReferenceType.friend:
            surfer, host = (from_user, to_user) if reference_type == ReferenceType.surfed else (to_user, from_user)
            from_date = today() - timedelta(days=60 + 45 * i)
            minutes_ago = (today() - from_date).days * 1440
            host_request_id = _create_host_request(
                session,
                surfer,
                host,
                HostRequestStatus.confirmed,
                [
                    {
                        "author": surfer.username,
                        "minutes_ago": minutes_ago + 20160,
                        "text": "Hi! Would it be ok to stay with you for a few nights?",
                    },
                    {"author": host.username, "minutes_ago": minutes_ago + 20000, "status_change": "accepted"},
                    {"author": surfer.username, "minutes_ago": minutes_ago + 19000, "status_change": "confirmed"},
                ],
                from_date,
                from_date + timedelta(days=3),
            )

        def create_reference(
            moderation_state_id: int,
            from_user: User = from_user,
            to_user: User = to_user,
            reference: Any = reference,
            reference_type: ReferenceType = reference_type,
            host_request_id: int | None = host_request_id,
        ) -> int:
            new_reference = Reference(
                from_user_id=from_user.id,
                to_user_id=to_user.id,
                reference_type=reference_type,
                host_request_id=host_request_id,
                text=reference["text"],
                rating=1.0,
                was_appropriate=True,
                moderation_state_id=moderation_state_id,
            )
            session.add(new_reference)
            session.flush()
            return new_reference.id

        _make_visible(session, ModerationObjectType.reference, create_reference, from_user.id)


def _sync_direct_messages(session: Session, data: dict[str, Any]) -> dict[int, list[dict[str, Any]]]:
    """Returns the messages of each direct message conversation, by conversation id."""
    demo_user = _user(session, data["demo_username"])
    demo_chats = select(GroupChatSubscription.group_chat_id).where(GroupChatSubscription.user_id == demo_user.id)
    conversations = {}
    for chat in data["direct_messages"]:
        other = _user(session, chat["with"])
        conversation_id = session.execute(
            select(GroupChat.conversation_id)
            .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
            .where(GroupChat.is_dm)
            .where(GroupChatSubscription.user_id == other.id)
            .where(GroupChat.conversation_id.in_(demo_chats))
        ).scalar_one_or_none()
        if not conversation_id:
            conversation = Conversation()
            session.add(conversation)
            session.flush()
            conversation_id = conversation.id
            moderation_state_id = _make_visible(session, ModerationObjectType.group_chat, conversation_id, other.id)
            session.add(
                GroupChat(
                    conversation_id=conversation_id,
                    title=None,
                    creator_id=other.id,
                    is_dm=True,
                    moderation_state_id=moderation_state_id,
                )
            )
            for user, role in ((other, GroupChatRole.admin), (demo_user, GroupChatRole.participant)):
                subscription = GroupChatSubscription(user_id=user.id, group_chat_id=conversation_id, role=role)
                subscription.joined = now() - timedelta(days=30)
                session.add(subscription)
            session.flush()
        conversations[conversation_id] = chat["messages"]

    # leave direct messages from older versions of the data
    for subscription in session.execute(
        select(GroupChatSubscription)
        .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
        .where(GroupChat.is_dm)
        .where(GroupChatSubscription.user_id == demo_user.id)
        .where(GroupChatSubscription.left == None)
        .where(GroupChatSubscription.group_chat_id.not_in(conversations))
    ).scalars():
        subscription.left = now()
    session.flush()
    return conversations


def _resequence_messages(
    session: Session, data: dict[str, Any], conversations: dict[int, list[dict[str, Any]]]
) -> None:
    """
    Rewrites the seeded conversations' messages in time order across all of them. The inbox sorts conversations by
    their latest message id, so ids have to follow the timestamps for the order to look natural.
    """
    session.execute(delete(Message).where(Message.conversation_id.in_(conversations)))
    timeline = sorted(
        (
            (message["minutes_ago"], conversation_id, message)
            for conversation_id, messages in conversations.items()
            for message in messages
        ),
        key=lambda item: -item[0],
    )
    ids: dict[int, list[int]] = {}
    for minutes_ago, conversation_id, message_data in timeline:
        if message_data.get("chat_created"):
            message = Message(
                conversation_id=conversation_id,
                author_id=_user(session, message_data["author"]).id,
                message_type=MessageType.chat_created,
            )
        elif "status_change" in message_data:
            message = Message(
                conversation_id=conversation_id,
                author_id=_user(session, message_data["author"]).id,
                message_type=MessageType.host_request_status_changed,
                host_request_status_target=HostRequestStatus[message_data["status_change"]],
            )
        else:
            message = Message(
                conversation_id=conversation_id,
                author_id=_user(session, message_data["author"]).id,
                message_type=MessageType.text,
                text=message_data["text"],
            )
        message.time = now() - timedelta(minutes=minutes_ago)
        session.add(message)
        session.flush()
        ids.setdefault(conversation_id, []).append(message.id)

    # everything has been read, apart from the very latest message
    demo_user = _user(session, data["demo_username"])
    latest = timeline[-1][1]
    for host_request in session.execute(
        select(HostRequest).where(HostRequest.conversation_id.in_(conversations))
    ).scalars():
        host_request.initiator_last_seen_message_id = ids[host_request.conversation_id][-1]
        host_request.recipient_last_seen_message_id = ids[host_request.conversation_id][-1]
    for subscription in session.execute(
        select(GroupChatSubscription).where(GroupChatSubscription.group_chat_id.in_(conversations))
    ).scalars():
        unread = subscription.group_chat_id == latest and subscription.user_id == demo_user.id
        subscription.last_seen_message_id = ids[subscription.group_chat_id][-2 if unread else -1]
    session.flush()


# ---------- events ----------


def _create_event(session: Session, event_data: dict[str, Any]) -> EventOccurrence:
    organizer = _user(session, event_data["organizer"])
    event = Event(
        title=event_data["title"],
        parent_node_id=_official_cluster(session, event_data["community"]).parent_node_id,
        owner_user_id=organizer.id,
        creator_user_id=organizer.id,
    )
    session.add(event)
    session.flush()
    thread = Thread()
    session.add(thread)
    session.flush()

    def create_occurrence(moderation_state_id: int) -> int:
        occurrence = EventOccurrence(
            event_id=event.id,
            content=event_data["content"],
            geom=create_coordinate(event_data["lat"], event_data["lng"]),
            address=event_data["address"],
            timezone=event_data["timezone"],
            during=TimestamptzRange(now(), now() + timedelta(hours=1)),
            creator_user_id=organizer.id,
            moderation_state_id=moderation_state_id,
            thread_id=thread.id,
        )
        session.add(occurrence)
        session.flush()
        return occurrence.id

    occurrence_id = session.execute(
        select(EventOccurrence.id).where(
            EventOccurrence.moderation_state_id
            == _make_visible(session, ModerationObjectType.event_occurrence, create_occurrence, organizer.id)
        )
    ).scalar_one()
    session.add(EventOrganizer(user_id=organizer.id, event_id=event.id))
    session.add(EventSubscription(user_id=organizer.id, event_id=event.id))
    session.flush()
    return session.execute(select(EventOccurrence).where(EventOccurrence.id == occurrence_id)).scalar_one()


def _sync_events(session: Session, data: dict[str, Any]) -> None:
    seeded_user_ids = _seeded_user_ids(session)
    titles = [event_data["title"] for event_data in data["events"]]
    for event_data in data["events"]:
        occurrence = session.execute(
            select(EventOccurrence)
            .join(Event, Event.id == EventOccurrence.event_id)
            .where(Event.title == event_data["title"])
            .where(Event.creator_user_id.in_(seeded_user_ids))
        ).scalar_one_or_none() or _create_event(session, event_data)

        tz = ZoneInfo(event_data["timezone"])
        start = datetime.combine(
            datetime.now(tz).date() + timedelta(days=event_data["in_days"]),
            time.fromisoformat(event_data["start"]),
            tzinfo=tz,
        )
        occurrence.is_deleted = False
        occurrence.content = event_data["content"]
        occurrence.address = event_data["address"]
        occurrence.geom = create_coordinate(event_data["lat"], event_data["lng"])
        occurrence.timezone = event_data["timezone"]
        occurrence.during = TimestamptzRange(start, start + timedelta(hours=event_data["hours"]))
        photo_key = f"store-event-{event_data['cover']}"
        if not session.execute(select(Upload).where(Upload.key == photo_key)).first():
            session.add(
                Upload(
                    key=photo_key,
                    filename=cover_filename(event_data["cover"]),
                    creator_user_id=occurrence.creator_user_id,
                )
            )
            session.flush()
        occurrence.photo_key = photo_key
        for username in [event_data["organizer"], *event_data["attendees"]]:
            user_id = _user(session, username).id
            if not session.execute(
                select(EventOccurrenceAttendee)
                .where(EventOccurrenceAttendee.occurrence_id == occurrence.id)
                .where(EventOccurrenceAttendee.user_id == user_id)
            ).first():
                session.add(
                    EventOccurrenceAttendee(
                        user_id=user_id, occurrence_id=occurrence.id, attendee_status=AttendeeStatus.going
                    )
                )
        session.flush()

    # retire events from older versions of the data
    for stale in session.execute(
        select(EventOccurrence)
        .join(Event, Event.id == EventOccurrence.event_id)
        .where(Event.creator_user_id.in_(seeded_user_ids))
        .where(Event.title.not_in(titles))
    ).scalars():
        stale.is_deleted = True
    session.flush()


def add_store_screenshot_data(names: dict[str, str]) -> None:
    # every seeded account shares a password that's public in this repo
    if not config.DEV:
        raise RuntimeError("Store screenshot data is only for local development databases")

    with open(DATA_FILE) as f:
        data = json.load(f)

    with session_scope() as session:
        _sync_users(session, data, names)
        home = _ensure_home_community(session, data)
        _sync_community_members(session, data, home)
        _sync_discussions(session, data, home)
        _sync_friendships(session, data)
        _sync_references(session, data)
        conversations = _sync_host_requests(session, data) | _sync_direct_messages(session, data)
        _resequence_messages(session, data, conversations)
        _sync_events(session, data)

    logger.info(f"Store screenshot data ready, log in as {data['demo_username']} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--names", default="{}", help="JSON object of username to display name overrides")
    args = parser.parse_args()
    add_store_screenshot_data(json.loads(args.names))
