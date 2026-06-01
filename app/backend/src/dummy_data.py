import json
import logging
import os
from datetime import date, timedelta
from typing import Any, cast

from dateutil import parser
from sqlalchemy import select
from sqlalchemy.sql import func

from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.context import CouchersContext
from couchers.crypto import hash_password
from couchers.db import session_scope
from couchers.helpers.clusters import CHILD_NODE_TYPE
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Conversation,
    FriendRelationship,
    FriendStatus,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
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
    Reference,
    ReferenceType,
    RegionLived,
    RegionVisited,
    Thread,
    User,
    Volunteer,
)
from couchers.moderation.utils import create_moderation
from couchers.proto.api_pb2 import HostingStatus
from couchers.servicers.api import hostingstatus2sql
from couchers.servicers.auth import create_session
from couchers.utils import create_coordinate, create_polygon_lng_lat, geojson_to_geom, to_multi

logger = logging.getLogger(__name__)


SRC_DIR = os.path.dirname(__file__)


def add_dummy_users() -> None:
    logger.info("Adding dummy users")
    with session_scope() as session:
        if session.execute(select(func.count()).select_from(User)).scalar_one() > 0:
            logger.info("Users not empty, not adding dummy users")
            return

        with open(SRC_DIR + "/data/dummy_users.json", "r") as f:
            data = json.loads(f.read())

        for user in data["users"]:
            new_user = User(
                username=user["username"],
                email=user["email"],
                hashed_password=hash_password(f"{user['name']}'s password"),
                name=user["name"],
                city=user["location"]["city"],
                geom=create_coordinate(user["location"]["lat"], user["location"]["lng"]),
                geom_radius=user["location"]["radius"],
                community_standing=user["community_standing"],
                birthdate=date(
                    year=user["birthdate"]["year"], month=user["birthdate"]["month"], day=user["birthdate"]["day"]
                ),
                gender=user["gender"],
                occupation=user["occupation"],
                about_me=user["about_me"],
                about_place=user["about_place"],
                hosting_status=hostingstatus2sql[  # type: ignore[arg-type]
                    HostingStatus.Value(
                        user["hosting_status"] if "hosting_status" in user else "HOSTING_STATUS_CANT_HOST"
                    )
                ],
                accepted_tos=TOS_VERSION,
            )
            new_user.accepted_community_guidelines = GUIDELINES_VERSION
            new_user.is_superuser = user.get("is_superuser", False)
            new_user.is_editor = user.get("is_editor", user.get("is_superuser", False))

            session.add(new_user)
            session.flush()

            # Create profile gallery for the user (same as in signup flow)
            profile_gallery = PhotoGallery(owner_user_id=new_user.id)
            session.add(profile_gallery)
            session.flush()
            new_user.profile_gallery_id = profile_gallery.id

            for language in user["languages"]:
                session.add(
                    LanguageAbility(
                        user_id=new_user.id, language_code=language[0], fluency=LanguageFluency[language[1]]
                    )
                )
            for region in user["regions_visited"]:
                session.add(RegionVisited(user_id=new_user.id, region_code=region))
            for region in user["regions_lived"]:
                session.add(RegionLived(user_id=new_user.id, region_code=region))

            class _MockCouchersContext:
                @property
                def headers(self) -> dict[str, str]:
                    return {}

            ctx = cast(CouchersContext, _MockCouchersContext())
            if user.get("make_api_key", False):
                token, _ = create_session(
                    ctx,
                    session,
                    new_user,
                    long_lived=True,
                    is_api_key=True,
                    duration=timedelta(days=365),
                    set_cookie=False,
                )
                logger.info(f"API key for {new_user.username}: {token}")

            if user.get("make_session", False):
                token, _ = create_session(ctx, session, new_user, long_lived=False, set_cookie=False)
                logger.info(f"Session cookie for {new_user.username}: {token}")

        session.commit()

        for username1, username2 in data["friendships"]:
            from_user = session.execute(select(User).where(User.username == username1)).scalar_one()
            to_user = session.execute(select(User).where(User.username == username2)).scalar_one()

            def create_friend_relationship(
                moderation_state_id: int, from_user: User = from_user, to_user: User = to_user
            ) -> int:
                friend_relationship = FriendRelationship(
                    from_user_id=from_user.id,
                    to_user_id=to_user.id,
                    status=FriendStatus.accepted,
                    moderation_state_id=moderation_state_id,
                )
                session.add(friend_relationship)
                session.flush()
                return friend_relationship.id

            moderation_state = create_moderation(
                session, ModerationObjectType.friend_request, create_friend_relationship, from_user.id
            )
            moderation_state.visibility = ModerationVisibility.visible
            session.flush()

        session.commit()

        for reference in data["references"]:
            reference_type = (
                ReferenceType.hosted
                if reference["type"] == "hosted"
                else (ReferenceType.surfed if reference["type"] == "surfed" else ReferenceType.friend)
            )
            from_user_id = session.execute(select(User).where(User.username == reference["from"])).scalar_one().id
            to_user_id = session.execute(select(User).where(User.username == reference["to"])).scalar_one().id

            def create_reference(
                moderation_state_id: int,
                from_user_id: int = from_user_id,
                to_user_id: int = to_user_id,
                reference: dict[str, Any] = reference,
                reference_type: ReferenceType = reference_type,
            ) -> int:
                new_reference = Reference(
                    from_user_id=from_user_id,
                    to_user_id=to_user_id,
                    reference_type=reference_type,
                    text=reference["text"],
                    rating=reference["rating"],
                    was_appropriate=reference["was_appropriate"],
                    moderation_state_id=moderation_state_id,
                )
                session.add(new_reference)
                session.flush()
                return new_reference.id

            moderation_state = create_moderation(
                session, ModerationObjectType.reference, create_reference, from_user_id
            )
            moderation_state.visibility = ModerationVisibility.visible
            session.flush()

        session.commit()

        for group_chat in data["group_chats"]:
            # Create the chat
            creator = group_chat["creator"]
            creator_id = session.execute(select(User).where(User.username == creator)).scalar_one().id

            conversation = Conversation()
            session.add(conversation)
            session.flush()

            moderation_state = create_moderation(session, ModerationObjectType.group_chat, conversation.id, creator_id)
            moderation_state.visibility = ModerationVisibility.visible
            session.flush()

            chat = GroupChat(
                conversation_id=conversation.id,
                title=group_chat["title"],
                creator_id=creator_id,
                is_dm=group_chat["is_dm"],
                moderation_state_id=moderation_state.id,
            )
            session.add(chat)

            for participant in group_chat["participants"]:
                subscription = GroupChatSubscription(
                    user_id=session.execute(select(User).where(User.username == participant["username"]))
                    .scalar_one()
                    .id,
                    group_chat_id=chat.conversation_id,
                    role=GroupChatRole.admin if participant["username"] == creator else GroupChatRole.participant,
                )
                subscription.joined = parser.isoparse(participant["joined"])
                session.add(subscription)

            for message in group_chat["messages"]:
                msg = Message(
                    message_type=MessageType.text,
                    conversation_id=chat.conversation.id,
                    author_id=session.execute(select(User).where(User.username == message["author"])).scalar_one().id,
                    text=message["message"],
                )
                msg.time = parser.isoparse(message["time"])

                session.add(msg)

        session.commit()

        for volunteer in data["volunteers"]:
            new_volunteer = Volunteer(
                user_id=session.execute(select(User).where(User.username == volunteer["username"])).scalar_one().id,
                role=volunteer["role"],
                stopped_volunteering=volunteer["stopped_volunteering"],
                link_type=volunteer["link_type"],
                link_text=volunteer["link_text"],
                link_url=volunteer["link_url"],
                show_on_team_page=True,
            )
            new_volunteer.started_volunteering = volunteer["started_volunteering"]

            session.add(new_volunteer)

        session.commit()


def add_dummy_communities() -> None:
    logger.info("Adding dummy communities")
    with session_scope() as session:
        if session.execute(select(func.count()).select_from(Node)).scalar_one() > 0:
            logger.info("Nodes not empty, not adding dummy communities")
            return

        with open(SRC_DIR + "/data/dummy_communities.json", "r") as f:
            data = json.loads(f.read())

        for community in data["communities"]:
            if "coordinates" in community:
                geom: Any = create_polygon_lng_lat(community["coordinates"])
            elif "osm_id" in community:
                with open(f"{SRC_DIR}/data/osm/{community['osm_id']}.geojson") as f:
                    geojson = json.loads(f.read())
                # pick the first feature
                geom = geojson_to_geom(geojson["features"][0]["geometry"])
                if "geom_simplify" in community:
                    geom = func.ST_Simplify(geom, community["geom_simplify"], True)
            else:
                ValueError("No geom or osm_id specified for node")

            name = community["name"]

            admins = session.execute(select(User).where(User.username.in_(community["admins"]))).scalars().all()
            members = session.execute(select(User).where(User.username.in_(community["members"]))).scalars().all()

            parent_name = community["parent"]

            if parent_name:
                parent_node = session.execute(
                    select(Node)
                    .join(Cluster, Cluster.parent_node_id == Node.id)
                    .where(Cluster.is_official_cluster)
                    .where(Cluster.name == community["parent"])
                ).scalar_one()

            parent_node_type = parent_node.node_type if parent_name else None
            node = Node(
                geom=to_multi(geom),
                parent_node_id=parent_node.id if parent_name else None,
                node_type=CHILD_NODE_TYPE[parent_node_type],
            )

            session.add(node)
            session.flush()

            cluster = Cluster(
                name=f"{name}",
                description=f"Description for {name}",
                parent_node_id=node.id,
                is_official_cluster=True,
            )

            session.add(cluster)
            session.flush()

            thread = Thread()
            session.add(thread)
            session.flush()

            main_page = Page(
                parent_node_id=node.id,
                creator_user_id=admins[0].id,
                owner_cluster_id=cluster.id,
                type=PageType.main_page,
                thread_id=thread.id,
            )

            session.add(main_page)
            session.flush()

            page_version = PageVersion(
                page_id=main_page.id,
                editor_user_id=admins[0].id,
                title=f"Main page for the {name} community",
                content="There is nothing here yet...",
            )

            session.add(page_version)

            for admin in admins:
                cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user_id=admin.id,
                        cluster_id=cluster.id,
                        role=ClusterRole.admin,
                    )
                )

            for member in members:
                cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user_id=member.id,
                        cluster_id=cluster.id,
                        role=ClusterRole.member,
                    )
                )

        for group in data["groups"]:
            name = group["name"]

            admins = session.execute(select(User).where(User.username.in_(group["admins"]))).scalars().all()
            members = session.execute(select(User).where(User.username.in_(group["members"]))).scalars().all()

            parent_node = session.execute(
                select(Node)
                .join(Cluster, Cluster.parent_node_id == Node.id)
                .where(Cluster.is_official_cluster)
                .where(Cluster.name == group["parent"])
            ).scalar_one()

            cluster = Cluster(
                name=f"{name}",
                description=f"Description for the group {name}",
                parent_node_id=parent_node.id,
            )

            session.add(cluster)
            session.flush()

            thread = Thread()
            session.add(thread)
            session.flush()

            main_page = Page(
                parent_node_id=cluster.parent_node_id,
                creator_user_id=admins[0].id,
                owner_cluster_id=cluster.id,
                type=PageType.main_page,
                thread_id=thread.id,
            )

            session.add(main_page)
            session.flush()

            page_version = PageVersion(
                page_id=main_page.id,
                editor_user_id=admins[0].id,
                title=f"Main page for the {name} group",
                content="There is nothing here yet...",
            )

            session.add(page_version)

            for admin in admins:
                cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user_id=admin.id,
                        cluster_id=cluster.id,
                        role=ClusterRole.admin,
                    )
                )

            for member in members:
                cluster.cluster_subscriptions.append(
                    ClusterSubscription(
                        user_id=member.id,
                        cluster_id=cluster.id,
                        role=ClusterRole.member,
                    )
                )

        for place in data["places"]:
            owner_cluster = session.execute(select(Cluster).where(Cluster.name == place["owner"])).scalar_one()
            creator = session.execute(select(User).where(User.username == place["creator"])).scalar_one()

            thread = Thread()
            session.add(thread)
            session.flush()

            page = Page(
                parent_node_id=owner_cluster.parent_node_id,
                creator_user_id=creator.id,
                owner_cluster_id=owner_cluster.id,
                type=PageType.place,
                thread_id=thread.id,
            )

            session.add(page)
            session.flush()

            page_version = PageVersion(
                page_id=page.id,
                editor_user_id=creator.id,
                title=place["title"],
                content=place["content"],
                address=place["address"],
                geom=create_coordinate(place["coordinate"][1], place["coordinate"][0]),
            )

            session.add(page_version)

        for guide in data["guides"]:
            owner_cluster = session.execute(select(Cluster).where(Cluster.name == guide["owner"])).scalar_one()
            creator = session.execute(select(User).where(User.username == guide["creator"])).scalar_one()

            thread = Thread()
            session.add(thread)
            session.flush()

            page = Page(
                parent_node_id=owner_cluster.parent_node_id,
                creator_user_id=creator.id,
                owner_cluster_id=owner_cluster.id,
                type=PageType.guide,
                thread_id=thread.id,
            )

            session.add(page)
            session.flush()

            page_version = PageVersion(
                page_id=page.id,
                editor_user_id=creator.id,
                title=guide["title"],
                content=guide["content"],
                geom=(
                    create_coordinate(guide["coordinate"][1], guide["coordinate"][0]) if "coordinate" in guide else None
                ),
            )

            session.add(page_version)


def add_dummy_data() -> None:
    add_dummy_users()
    add_dummy_communities()
