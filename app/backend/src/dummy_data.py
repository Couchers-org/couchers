import json
import logging
from datetime import date

from dateutil import parser
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

from couchers.crypto import hash_password
from couchers.db import session_scope
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
    Node,
    Page,
    PageType,
    PageVersion,
    Reference,
    ReferenceType,
    RegionsLived,
    RegionsVisited,
    Thread,
    User,
)
from couchers.servicers.api import hostingstatus2sql
from couchers.utils import create_coordinate, create_polygon_lng_lat, geojson_to_geom, now, to_multi
from pb.api_pb2 import HostingStatus

logger = logging.getLogger(__name__)


def add_dummy_users():
    try:
        logger.info(f"Adding dummy users")
        with session_scope() as session:
            with open("src/data/dummy_users.json", "r") as f:
                data = json.load(f)

            for user in data["users"]:
                new_user = User(
                    username=user["username"],
                    email=user["email"],
                    hashed_password=hash_password(user["password"]) if user["password"] else None,
                    name=user["name"],
                    city=user["location"]["city"],
                    geom=create_coordinate(user["location"]["lat"], user["location"]["lng"]),
                    geom_radius=user["location"]["radius"],
                    verification=user["verification"],
                    community_standing=user["community_standing"],
                    birthdate=date(
                        year=user["birthdate"]["year"], month=user["birthdate"]["month"], day=user["birthdate"]["day"]
                    ),
                    gender=user["gender"],
                    occupation=user["occupation"],
                    about_me=user["about_me"],
                    about_place=user["about_place"],
                    hosting_status=hostingstatus2sql[HostingStatus.Value(user["hosting_status"])]
                    if "hosting_status" in user
                    else None,
                )
                session.add(new_user)
                session.flush()

                for language in user["languages"]:
                    session.add(
                        LanguageAbility(
                            user_id=new_user.id, language_code=language[0], fluency=LanguageFluency[language[1]]
                        )
                    )
                for region in user["regions_visited"]:
                    session.add(RegionsVisited(user_id=new_user.id, region_code=region))
                for region in user["regions_lived"]:
                    session.add(RegionsLived(user_id=new_user.id, region_code=region))

            session.commit()

            for username1, username2 in data["friendships"]:
                friend_relationship = FriendRelationship(
                    from_user_id=session.query(User).filter(User.username == username1).one().id,
                    to_user_id=session.query(User).filter(User.username == username2).one().id,
                    status=FriendStatus.accepted,
                )
                session.add(friend_relationship)

            session.commit()

            for reference in data["references"]:
                reference_type = (
                    ReferenceType.hosted
                    if reference["type"] == "hosted"
                    else (ReferenceType.surfed if reference["type"] == "surfed" else ReferenceType.friend)
                )
                new_reference = Reference(
                    from_user_id=session.query(User).filter(User.username == reference["from"]).one().id,
                    to_user_id=session.query(User).filter(User.username == reference["to"]).one().id,
                    reference_type=reference_type,
                    text=reference["text"],
                    rating=reference["rating"],
                    was_appropriate=reference["was_appropriate"],
                )
                session.add(new_reference)

            session.commit()

            for group_chat in data["group_chats"]:
                # Create the chat
                creator = group_chat["creator"]

                conversation = Conversation()
                session.add(conversation)

                chat = GroupChat(
                    conversation=conversation,
                    title=group_chat["title"],
                    creator_id=session.query(User).filter(User.username == creator).one().id,
                    is_dm=group_chat["is_dm"],
                )
                session.add(chat)

                for participant in group_chat["participants"]:
                    subscription = GroupChatSubscription(
                        user_id=session.query(User).filter(User.username == participant["username"]).one().id,
                        group_chat=chat,
                        role=GroupChatRole.admin if participant["username"] == creator else GroupChatRole.participant,
                        joined=parser.isoparse(participant["joined"]),
                    )
                    session.add(subscription)

                for message in group_chat["messages"]:
                    session.add(
                        Message(
                            message_type=MessageType.text,
                            conversation=chat.conversation,
                            author_id=session.query(User).filter(User.username == message["author"]).one().id,
                            time=parser.isoparse(message["time"]),
                            text=message["message"],
                        )
                    )

            session.commit()

    except IntegrityError:
        logger.error("Failed to insert dummy users, is it already inserted?")


def add_dummy_communities():
    try:
        logger.info(f"Adding dummy communities")
        with session_scope() as session:
            if session.query(Node).count() > 0:
                logger.info("Nodes not empty, not adding dummy communities")
                return

            with open("src/data/dummy_communities.json", "r") as f:
                data = json.load(f)

            for community in data["communities"]:
                geom = None
                if "coordinates" in community:
                    geom = create_polygon_lng_lat(community["coordinates"])
                elif "osm_id" in community:
                    with open(f"src/data/osm/{community['osm_id']}.geojson") as f:
                        geojson = json.load(f)
                    # pick the first feature
                    geom = geojson_to_geom(geojson["features"][0]["geometry"])
                    if "geom_simplify" in community:
                        geom = func.ST_Simplify(geom, community["geom_simplify"], True)
                else:
                    ValueError("No geom or osm_id specified for node")

                name = community["name"]

                admins = session.query(User).filter(User.username.in_(community["admins"])).all()
                members = session.query(User).filter(User.username.in_(community["members"])).all()

                parent_name = community["parent"]

                if parent_name:
                    parent_node = (
                        session.query(Node)
                        .join(Cluster, Cluster.parent_node_id == Node.id)
                        .filter(Cluster.is_official_cluster)
                        .filter(Cluster.name == community["parent"])
                        .one()
                    )

                node = Node(
                    geom=to_multi(geom),
                    parent_node=parent_node if parent_name else None,
                )

                session.add(node)

                cluster = Cluster(
                    name=f"{name}",
                    description=f"Description for {name}",
                    parent_node=node,
                    is_official_cluster=True,
                )

                session.add(cluster)

                main_page = Page(
                    parent_node=node,
                    creator_user=admins[0],
                    owner_cluster=cluster,
                    type=PageType.main_page,
                    thread=Thread(),
                )

                session.add(main_page)

                page_version = PageVersion(
                    page=main_page,
                    editor_user=admins[0],
                    title=f"Main page for the {name} community",
                    content="There is nothing here yet...",
                )

                session.add(page_version)

                for admin in admins:
                    cluster.cluster_subscriptions.append(
                        ClusterSubscription(
                            user=admin,
                            role=ClusterRole.admin,
                        )
                    )

                for member in members:
                    cluster.cluster_subscriptions.append(
                        ClusterSubscription(
                            user=member,
                            role=ClusterRole.member,
                        )
                    )

            for group in data["groups"]:
                name = group["name"]

                admins = session.query(User).filter(User.username.in_(group["admins"])).all()
                members = session.query(User).filter(User.username.in_(group["members"])).all()

                parent_node = (
                    session.query(Node)
                    .join(Cluster, Cluster.parent_node_id == Node.id)
                    .filter(Cluster.is_official_cluster)
                    .filter(Cluster.name == group["parent"])
                    .one()
                )

                cluster = Cluster(
                    name=f"{name}",
                    description=f"Description for the group {name}",
                    parent_node=parent_node,
                )

                session.add(cluster)

                main_page = Page(
                    parent_node=cluster.parent_node,
                    creator_user=admins[0],
                    owner_cluster=cluster,
                    type=PageType.main_page,
                    thread=Thread(),
                )

                session.add(main_page)

                page_version = PageVersion(
                    page=main_page,
                    editor_user=admins[0],
                    title=f"Main page for the {name} group",
                    content="There is nothing here yet...",
                )

                session.add(page_version)

                for admin in admins:
                    cluster.cluster_subscriptions.append(
                        ClusterSubscription(
                            user=admin,
                            role=ClusterRole.admin,
                        )
                    )

                for member in members:
                    cluster.cluster_subscriptions.append(
                        ClusterSubscription(
                            user=member,
                            role=ClusterRole.member,
                        )
                    )

            for place in data["places"]:
                owner_cluster = session.query(Cluster).filter(Cluster.name == place["owner"]).one()
                creator = session.query(User).filter(User.username == place["creator"]).one()

                page = Page(
                    parent_node=owner_cluster.parent_node,
                    creator_user=creator,
                    owner_cluster=owner_cluster,
                    type=PageType.place,
                    thread=Thread(),
                )

                session.add(page)

                page_version = PageVersion(
                    page=page,
                    editor_user=creator,
                    title=place["title"],
                    content=place["content"],
                    address=place["address"],
                    geom=create_coordinate(place["coordinate"][1], place["coordinate"][0]),
                )

                session.add(page_version)

            for guide in data["guides"]:
                owner_cluster = session.query(Cluster).filter(Cluster.name == guide["owner"]).one()
                creator = session.query(User).filter(User.username == guide["creator"]).one()

                page = Page(
                    parent_node=owner_cluster.parent_node,
                    creator_user=creator,
                    owner_cluster=owner_cluster,
                    type=PageType.guide,
                    thread=Thread(),
                )

                session.add(page)

                page_version = PageVersion(
                    page=page,
                    editor_user=creator,
                    title=guide["title"],
                    content=guide["content"],
                    geom=create_coordinate(guide["coordinate"][1], guide["coordinate"][0])
                    if "coordinate" in guide
                    else None,
                )

                session.add(page_version)

    except IntegrityError:
        logger.error("Failed to insert dummy communities, are they already inserted?")


def add_dummy_data():
    add_dummy_users()
    add_dummy_communities()
