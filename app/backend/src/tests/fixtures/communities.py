"""
Builders for communities (nodes with their official cluster), groups, and the content inside them.
"""

from collections.abc import Generator
from datetime import timedelta

import pytest
from geoalchemy2 import WKBElement
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.db import session_scope
from couchers.helpers.clusters import CHILD_NODE_TYPE
from couchers.materialized_views import refresh_materialized_views
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Discussion,
    EventOccurrence,
    Node,
    Page,
    PageType,
    PageVersion,
    Thread,
    User,
)
from couchers.proto import discussions_pb2, events_pb2, pages_pb2
from couchers.tasks import enforce_community_memberships
from couchers.utils import create_coordinate, create_polygon_lat_lng, now, to_multi
from tests.fixtures import api_helpers
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import discussions_session, events_session, pages_session
from tests.utils import local_date_time

# For testing purposes, restrict ourselves to a 1D-world, consisting of "intervals" that have width 2, and coordinates
# that are points at (x, 1).
# we'll stick to EPSG4326, even though it's not ideal, so don't use too large values, but it's around the equator, so
# mostly fine


def create_1d_polygon(lb: int, ub: int) -> WKBElement:
    # given a lower bound and upper bound on x, creates the given interval
    return create_polygon_lat_lng([[lb, 0], [lb, 2], [ub, 2], [ub, 0], [lb, 0]])


def create_1d_point(x: int) -> WKBElement:
    return create_coordinate(x, 1)


def create_community(
    session: Session,
    interval_lb: int,
    interval_ub: int,
    name: str,
    admins: list[User],
    extra_members: list[User],
    parent: Node | None,
) -> Node:
    node_type = CHILD_NODE_TYPE[parent.node_type if parent else None]
    node = Node(
        geom=to_multi(create_1d_polygon(interval_lb, interval_ub)),
        parent_node_id=parent.id if parent else None,
        node_type=node_type,
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
    for member in extra_members:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=member.id,
                cluster_id=cluster.id,
                role=ClusterRole.member,
            )
        )
    session.commit()
    # other members will be added by enforce_community_memberships()
    return node


def create_root_community(
    name: str,
    admins: list[User],
    extra_members: list[User] | None = None,
    *,
    interval: tuple[int, int] = (0, 2),
) -> int:
    """
    Creates a top-level community in its own transaction and returns its node id.

    The shorthand for the common `create_community(session, 0, 2, name, admins, [], None).id`.
    """
    with session_scope() as session:
        return create_community(session, interval[0], interval[1], name, admins, extra_members or [], None).id


def create_group(
    session: Session, name: str, admins: list[User], members: list[User], parent_community: Node | None
) -> Cluster:
    assert parent_community is not None
    cluster = Cluster(
        name=f"{name}",
        description=f"Description for {name}",
        parent_node_id=parent_community.id,
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
    session.commit()
    return cluster


def create_place(token: str, title: str, content: str, address: str, x: float) -> None:
    with pages_session(token) as api:
        api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title=title,
                content=content,
                address=address,
                location=pages_pb2.Coordinate(
                    lat=x,
                    lng=1,
                ),
            )
        )


def create_discussion(token: str, community_id: int | None, group_id: int | None, title: str, content: str) -> None:
    # set group_id or community_id to None
    with discussions_session(token) as api:
        api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title=title,
                content=content,
                owner_community_id=community_id,
                owner_group_id=group_id,
            )
        )


def create_event(
    token: str, community_id: int | None, group_id: int | None, title: str, content: str, start_td: timedelta
) -> None:
    res = api_helpers.create_event(
        token=token,
        title=title,
        content=content,
        start_date_time=local_date_time(now() + start_td),
        end_date_time=local_date_time(now() + start_td + timedelta(hours=2)),
    )
    with events_session(token) as api:
        api.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=res.event_id,
                new_owner_community_id=community_id,
                new_owner_group_id=group_id,
            )
        )


def get_community_id(session: Session, community_name: str) -> int:
    return session.execute(
        select(Cluster.parent_node_id).where(Cluster.is_official_cluster).where(Cluster.name == community_name)
    ).scalar_one()


def get_group_id(session: Session, group_name: str) -> int:
    return session.execute(
        select(Cluster.id).where(~Cluster.is_official_cluster).where(Cluster.name == group_name)
    ).scalar_one()


@pytest.fixture(scope="class")
def testing_communities(db_class: None) -> Generator[None]:
    user1, token1 = generate_user(username="user1", geom=create_1d_point(1), geom_radius=0.1)
    user2, token2 = generate_user(username="user2", geom=create_1d_point(2), geom_radius=0.1)
    user3, token3 = generate_user(username="user3", geom=create_1d_point(3), geom_radius=0.1)
    user4, token4 = generate_user(username="user4", geom=create_1d_point(8), geom_radius=0.1)
    user5, token5 = generate_user(username="user5", geom=create_1d_point(6), geom_radius=0.1)
    user6, token6 = generate_user(username="user6", geom=create_1d_point(65), geom_radius=0.1)
    user7, token7 = generate_user(username="user7", geom=create_1d_point(80), geom_radius=0.1)
    user8, token8 = generate_user(username="user8", geom=create_1d_point(51), geom_radius=0.1)

    with session_scope() as session:
        w = create_community(session, 0, 100, "Global", [user1, user3, user7], [], None)
        c2 = create_community(session, 52, 100, "Country 2", [user6, user7], [], w)
        c2r1 = create_community(session, 52, 71, "Country 2, Region 1", [user6], [user8], c2)
        c2r1c1 = create_community(session, 53, 70, "Country 2, Region 1, City 1", [user8], [], c2r1)
        c1 = create_community(session, 0, 50, "Country 1", [user1, user2], [], w)
        c1r1 = create_community(session, 0, 10, "Country 1, Region 1", [user1, user2], [], c1)
        c1r1c1 = create_community(session, 0, 5, "Country 1, Region 1, City 1", [user2], [], c1r1)
        c1r1c2 = create_community(session, 7, 10, "Country 1, Region 1, City 2", [user4, user5], [user2], c1r1)
        c1r2 = create_community(session, 20, 25, "Country 1, Region 2", [user2], [], c1)
        c1r2c1 = create_community(session, 21, 23, "Country 1, Region 2, City 1", [user2], [], c1r2)

        h = create_group(session, "Hitchhikers", [user1, user2], [user5, user8], w)
        create_group(session, "Country 1, Region 1, Foodies", [user1], [user2, user4], c1r1)
        create_group(session, "Country 1, Region 1, Skaters", [user2], [user1], c1r1)
        create_group(session, "Country 1, Region 2, Foodies", [user2], [user4, user5], c1r2)
        create_group(session, "Country 2, Region 1, Foodies", [user6], [user7], c2r1)

        w_id = w.id
        c1r1c2_id = c1r1c2.id
        h_id = h.id
        c1_id = c1.id

    create_discussion(token1, w_id, None, "Discussion title 1", "Discussion content 1")
    create_discussion(token3, w_id, None, "Discussion title 2", "Discussion content 2")
    create_discussion(token3, w_id, None, "Discussion title 3", "Discussion content 3")
    create_discussion(token3, w_id, None, "Discussion title 4", "Discussion content 4")
    create_discussion(token3, w_id, None, "Discussion title 5", "Discussion content 5")
    create_discussion(token3, w_id, None, "Discussion title 6", "Discussion content 6")
    create_discussion(token4, c1r1c2_id, None, "Discussion title 7", "Discussion content 7")
    create_discussion(token5, None, h_id, "Discussion title 8", "Discussion content 8")
    create_discussion(token1, None, h_id, "Discussion title 9", "Discussion content 9")
    create_discussion(token2, None, h_id, "Discussion title 10", "Discussion content 10")
    create_discussion(token3, None, h_id, "Discussion title 11", "Discussion content 11")
    create_discussion(token4, None, h_id, "Discussion title 12", "Discussion content 12")
    create_discussion(token5, None, h_id, "Discussion title 13", "Discussion content 13")
    create_discussion(token8, None, h_id, "Discussion title 14", "Discussion content 14")

    create_event(token3, c1_id, None, "Event title 1", "Event content 1", timedelta(hours=1))
    create_event(token1, c1_id, None, "Event title 2", "Event content 2", timedelta(hours=2))
    create_event(token3, c1_id, None, "Event title 3", "Event content 3", timedelta(hours=3))
    create_event(token1, c1_id, None, "Event title 4", "Event content 4", timedelta(hours=4))
    create_event(token3, c1_id, None, "Event title 5", "Event content 5", timedelta(hours=5))
    create_event(token1, c1_id, None, "Event title 6", "Event content 6", timedelta(hours=6))
    create_event(token2, None, h_id, "Event title 7", "Event content 7", timedelta(hours=7))
    create_event(token2, None, h_id, "Event title 8", "Event content 8", timedelta(hours=8))
    create_event(token2, None, h_id, "Event title 9", "Event content 9", timedelta(hours=9))
    create_event(token2, None, h_id, "Event title 10", "Event content 10", timedelta(hours=10))
    create_event(token2, None, h_id, "Event title 11", "Event content 11", timedelta(hours=11))
    create_event(token2, None, h_id, "Event title 12", "Event content 12", timedelta(hours=12))

    # Approve all events for visibility (UMS starts events as SHADOWED)
    mod_user, mod_token = generate_user(is_superuser=True)
    mod = Moderator(mod_user, mod_token)
    with session_scope() as session:
        occurrence_ids = session.execute(select(EventOccurrence.id)).scalars().all()
        discussion_ids = session.execute(select(Discussion.id)).scalars().all()
    for oid in occurrence_ids:
        mod.approve_event_occurrence(oid)
    for did in discussion_ids:
        mod.approve_discussion(did)

    enforce_community_memberships()

    create_place(token1, "Country 1, Region 1, Attraction", "Place content", "Somewhere in c1r1", 6)
    create_place(token2, "Country 1, Region 1, City 1, Attraction 1", "Place content", "Somewhere in c1r1c1", 3)
    create_place(token2, "Country 1, Region 1, City 1, Attraction 2", "Place content", "Somewhere in c1r1c1", 4)
    create_place(token8, "Global, Attraction", "Place content", "Somewhere in w", 51.5)
    create_place(token6, "Country 2, Region 1, Attraction", "Place content", "Somewhere in c2r1", 59)

    refresh_materialized_views(empty_pb2.Empty())

    yield
