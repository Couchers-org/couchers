from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Node,
    Page,
    PageType,
    PageVersion,
    SignupFlow,
    Thread,
)
from couchers.sql import couchers_select as select
from couchers.tasks import enforce_community_memberships
from couchers.utils import Timestamp_from_datetime, create_coordinate, create_polygon_lat_lng, now, to_multi
from proto import api_pb2, auth_pb2, communities_pb2, discussions_pb2, events_pb2, pages_pb2
from tests.test_auth import get_session_cookie_token
from tests.test_fixtures import (  # noqa
    auth_api_session,
    communities_session,
    db,
    discussions_session,
    events_session,
    generate_user,
    get_user_id_and_token,
    pages_session,
    recreate_database,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# For testing purposes, restrict ourselves to a 1D-world, consisting of "intervals" that have width 2, and coordinates
# that are points at (x, 1).
# we'll stick to EPSG4326, even though it's not ideal, so don't use too large values, but it's around the equator, so
# mostly fine


def create_1d_polygon(lb, ub):
    # given a lower bound and upper bound on x, creates the given interval
    return create_polygon_lat_lng([[lb, 0], [lb, 2], [ub, 2], [ub, 0], [lb, 0]])


def create_1d_point(x):
    return create_coordinate(x, 1)


def create_community(session, interval_lb, interval_ub, name, admins, extra_members, parent):
    node = Node(
        geom=to_multi(create_1d_polygon(interval_lb, interval_ub)),
        parent_node=parent,
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
        parent_node=cluster.parent_node,
        creator_user_id=admins[0].id,
        owner_cluster=cluster,
        type=PageType.main_page,
        thread=Thread(),
    )
    session.add(main_page)
    page_version = PageVersion(
        page=main_page,
        editor_user_id=admins[0].id,
        title=f"Main page for the {name} community",
        content="There is nothing here yet...",
    )
    session.add(page_version)
    for admin in admins:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=admin.id,
                role=ClusterRole.admin,
            )
        )
    for member in extra_members:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=member.id,
                role=ClusterRole.member,
            )
        )
    session.commit()
    # other members will be added by enforce_community_memberships()
    return node


def create_group(session, name, admins, members, parent_community):
    cluster = Cluster(
        name=f"{name}",
        description=f"Description for {name}",
        parent_node=parent_community,
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
    session.commit()
    return cluster


def create_place(token, title, content, address, x):
    with pages_session(token) as api:
        res = api.CreatePlace(
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


def create_discussion(token, community_id, group_id, title, content):
    # set group_id or community_id to None
    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title=title,
                content=content,
                owner_community_id=community_id,
                owner_group_id=group_id,
            )
        )


def create_event(token, community_id, group_id, title, content, start_td):
    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title=title,
                content=content,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + start_td),
                end_time=Timestamp_from_datetime(now() + start_td + timedelta(hours=2)),
                timezone="UTC",
            )
        )
        api.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=res.event_id,
                new_owner_community_id=community_id,
                new_owner_group_id=group_id,
            )
        )


def get_community_id(session, community_name):
    return (
        session.execute(select(Cluster).where(Cluster.is_official_cluster).where(Cluster.name == community_name))
        .scalar_one()
        .parent_node_id
    )


def get_group_id(session, group_name):
    return (
        session.execute(select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.name == group_name))
        .scalar_one()
        .id
    )


@pytest.fixture(scope="class")
def testing_communities():
    recreate_database()
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
        c1 = create_community(session, 0, 50, "Country 1", [user1, user2], [], w)
        c1r1 = create_community(session, 0, 10, "Country 1, Region 1", [user1, user2], [], c1)
        c1r1c1 = create_community(session, 0, 5, "Country 1, Region 1, City 1", [user2], [], c1r1)
        c1r1c2 = create_community(session, 7, 10, "Country 1, Region 1, City 2", [user4, user5], [user2], c1r1)
        c1r2 = create_community(session, 20, 25, "Country 1, Region 2", [user2], [], c1)
        c1r2c1 = create_community(session, 21, 23, "Country 1, Region 2, City 1", [user2], [], c1r2)
        c2 = create_community(session, 52, 100, "Country 2", [user6, user7], [], w)
        c2r1 = create_community(session, 52, 71, "Country 2, Region 1", [user6], [user8], c2)
        c2r1c1 = create_community(session, 53, 70, "Country 2, Region 1, City 1", [user8], [], c2r1)

        h = create_group(session, "Hitchhikers", [user1, user2], [user5, user8], w)
        create_group(session, "Country 1, Region 1, Foodies", [user1], [user2, user4], c1r1)
        create_group(session, "Country 1, Region 1, Skaters", [user2], [user1], c1r1)
        create_group(session, "Country 1, Region 2, Foodies", [user2], [user4, user5], c1r2)
        create_group(session, "Country 2, Region 1, Foodies", [user6], [user7], c2r1)

        create_discussion(token1, w.id, None, "Discussion title 1", "Discussion content 1")
        create_discussion(token3, w.id, None, "Discussion title 2", "Discussion content 2")
        create_discussion(token3, w.id, None, "Discussion title 3", "Discussion content 3")
        create_discussion(token3, w.id, None, "Discussion title 4", "Discussion content 4")
        create_discussion(token3, w.id, None, "Discussion title 5", "Discussion content 5")
        create_discussion(token3, w.id, None, "Discussion title 6", "Discussion content 6")
        create_discussion(token4, c1r1c2.id, None, "Discussion title 7", "Discussion content 7")
        create_discussion(token5, None, h.id, "Discussion title 8", "Discussion content 8")
        create_discussion(token1, None, h.id, "Discussion title 9", "Discussion content 9")
        create_discussion(token2, None, h.id, "Discussion title 10", "Discussion content 10")
        create_discussion(token3, None, h.id, "Discussion title 11", "Discussion content 11")
        create_discussion(token4, None, h.id, "Discussion title 12", "Discussion content 12")
        create_discussion(token5, None, h.id, "Discussion title 13", "Discussion content 13")
        create_discussion(token8, None, h.id, "Discussion title 14", "Discussion content 14")

        create_event(token3, c1.id, None, "Event title 1", "Event content 1", timedelta(hours=1))
        create_event(token1, c1.id, None, "Event title 2", "Event content 2", timedelta(hours=2))
        create_event(token3, c1.id, None, "Event title 3", "Event content 3", timedelta(hours=3))
        create_event(token1, c1.id, None, "Event title 4", "Event content 4", timedelta(hours=4))
        create_event(token3, c1.id, None, "Event title 5", "Event content 5", timedelta(hours=5))
        create_event(token1, c1.id, None, "Event title 6", "Event content 6", timedelta(hours=6))
        create_event(token2, None, h.id, "Event title 7", "Event content 7", timedelta(hours=7))
        create_event(token2, None, h.id, "Event title 8", "Event content 8", timedelta(hours=8))
        create_event(token2, None, h.id, "Event title 9", "Event content 9", timedelta(hours=9))
        create_event(token2, None, h.id, "Event title 10", "Event content 10", timedelta(hours=10))
        create_event(token2, None, h.id, "Event title 11", "Event content 11", timedelta(hours=11))
        create_event(token2, None, h.id, "Event title 12", "Event content 12", timedelta(hours=12))

    enforce_community_memberships()

    create_place(token1, "Country 1, Region 1, Attraction", "Place content", "Somewhere in c1r1", 6)
    create_place(token2, "Country 1, Region 1, City 1, Attraction 1", "Place content", "Somewhere in c1r1c1", 3)
    create_place(token2, "Country 1, Region 1, City 1, Attraction 2", "Place content", "Somewhere in c1r1c1", 4)
    create_place(token8, "Global, Attraction", "Place content", "Somewhere in w", 51.5)
    create_place(token6, "Country 2, Region 1, Attraction", "Place content", "Somewhere in c2r1", 59)

    yield


class TestCommunities:
    @staticmethod
    def test_GetCommunity(testing_communities):
        with session_scope() as session:
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c2_id = get_community_id(session, "Country 2")

        with communities_session(token2) as api:
            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=w_id,
                )
            )
            assert res.name == "Global"
            assert res.slug == "global"
            assert res.description == "Description for Global"
            assert len(res.parents) == 1
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-global-community"
            assert res.main_page.last_editor_user_id == 1
            assert res.main_page.creator_user_id == 1
            assert res.main_page.owner_community_id == w_id
            assert res.main_page.title == "Main page for the Global community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [1]
            assert res.member
            assert not res.admin
            assert res.member_count == 8
            assert res.admin_count == 3

            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=c1r1c1_id,
                )
            )
            assert res.community_id == c1r1c1_id
            assert res.name == "Country 1, Region 1, City 1"
            assert res.slug == "country-1-region-1-city-1"
            assert res.description == "Description for Country 1, Region 1, City 1"
            assert len(res.parents) == 4
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.parents[1].HasField("community")
            assert res.parents[1].community.community_id == c1_id
            assert res.parents[1].community.name == "Country 1"
            assert res.parents[1].community.slug == "country-1"
            assert res.parents[1].community.description == "Description for Country 1"
            assert res.parents[2].HasField("community")
            assert res.parents[2].community.community_id == c1r1_id
            assert res.parents[2].community.name == "Country 1, Region 1"
            assert res.parents[2].community.slug == "country-1-region-1"
            assert res.parents[2].community.description == "Description for Country 1, Region 1"
            assert res.parents[3].HasField("community")
            assert res.parents[3].community.community_id == c1r1c1_id
            assert res.parents[3].community.name == "Country 1, Region 1, City 1"
            assert res.parents[3].community.slug == "country-1-region-1-city-1"
            assert res.parents[3].community.description == "Description for Country 1, Region 1, City 1"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-country-1-region-1-city-1-community"
            assert res.main_page.last_editor_user_id == 2
            assert res.main_page.creator_user_id == 2
            assert res.main_page.owner_community_id == c1r1c1_id
            assert res.main_page.title == "Main page for the Country 1, Region 1, City 1 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert res.main_page.can_edit
            assert res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [2]
            assert res.member
            assert res.admin
            assert res.member_count == 3
            assert res.admin_count == 1

            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=c2_id,
                )
            )
            assert res.community_id == c2_id
            assert res.name == "Country 2"
            assert res.slug == "country-2"
            assert res.description == "Description for Country 2"
            assert len(res.parents) == 2
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.parents[1].HasField("community")
            assert res.parents[1].community.community_id == c2_id
            assert res.parents[1].community.name == "Country 2"
            assert res.parents[1].community.slug == "country-2"
            assert res.parents[1].community.description == "Description for Country 2"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-country-2-community"
            assert res.main_page.last_editor_user_id == 6
            assert res.main_page.creator_user_id == 6
            assert res.main_page.owner_community_id == c2_id
            assert res.main_page.title == "Main page for the Country 2 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [6]
            assert not res.member
            assert not res.admin
            assert res.member_count == 2
            assert res.admin_count == 2

    @staticmethod
    def test_ListCommunities(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r2_id = get_community_id(session, "Country 1, Region 2")

        with communities_session(token1) as api:
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    community_id=c1_id,
                )
            )
            assert [c.community_id for c in res.communities] == [c1r1_id, c1r2_id]

    @staticmethod
    def test_ListCommunities_all(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")
            c2_id = get_community_id(session, "Country 2")
            c2r1_id = get_community_id(session, "Country 2, Region 1")
            c2r1c1_id = get_community_id(session, "Country 2, Region 1, City 1")

        with communities_session(token1) as api:
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=5,
                )
            )
            assert [c.community_id for c in res.communities] == [w_id, c1_id, c1r1_id, c1r1c1_id, c1r1c2_id]
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=2,
                    page_token=res.next_page_token,
                )
            )
            assert [c.community_id for c in res.communities] == [c1r2_id, c1r2c1_id]
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=5,
                    page_token=res.next_page_token,
                )
            )
            assert [c.community_id for c in res.communities] == [c2_id, c2r1_id, c2r1c1_id]

    @staticmethod
    def test_ListUserCommunities(testing_communities):
        with session_scope() as session:
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")

        # Fetch user2's communities from user2's account
        with communities_session(token2) as api:
            res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq())
            assert [c.community_id for c in res.communities] == [
                w_id,
                c1_id,
                c1r1_id,
                c1r1c1_id,
                c1r1c2_id,
                c1r2_id,
                c1r2c1_id,
            ]

    @staticmethod
    def test_ListOtherUserCommunities(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")

        # Fetch user2's communities from user1's account
        with communities_session(token1) as api:
            res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq(user_id=user2_id))
            assert [c.community_id for c in res.communities] == [
                w_id,
                c1_id,
                c1r1_id,
                c1r1c1_id,
                c1r1c2_id,
                c1r2_id,
                c1r2c1_id,
            ]

    @staticmethod
    def test_ListGroups(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            w_id = get_community_id(session, "Global")
            hitchhikers_id = get_group_id(session, "Hitchhikers")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            foodies_id = get_group_id(session, "Country 1, Region 1, Foodies")
            skaters_id = get_group_id(session, "Country 1, Region 1, Skaters")

        with communities_session(token1) as api:
            res = api.ListGroups(
                communities_pb2.ListGroupsReq(
                    community_id=c1r1_id,
                )
            )
            assert [g.group_id for g in res.groups] == [foodies_id, skaters_id]

        with communities_session(token5) as api:
            res = api.ListGroups(
                communities_pb2.ListGroupsReq(
                    community_id=w_id,
                )
            )
            assert len(res.groups) == 1
            assert res.groups[0].group_id == hitchhikers_id

    @staticmethod
    def test_ListAdmins(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListAdmins(
                communities_pb2.ListAdminsReq(
                    community_id=w_id,
                )
            )
            assert res.admin_user_ids == [user1_id, user3_id, user7_id]

            res = api.ListAdmins(
                communities_pb2.ListAdminsReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.admin_user_ids == [user4_id, user5_id]

    @staticmethod
    def test_ListMembers(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListMembers(
                communities_pb2.ListMembersReq(
                    community_id=w_id,
                )
            )
            assert res.member_user_ids == [
                user1_id,
                user2_id,
                user3_id,
                user4_id,
                user5_id,
                user6_id,
                user7_id,
                user8_id,
            ]

            res = api.ListMembers(
                communities_pb2.ListMembersReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.member_user_ids == [user2_id, user4_id, user5_id]

    @staticmethod
    def test_ListNearbyUsers(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListNearbyUsers(
                communities_pb2.ListNearbyUsersReq(
                    community_id=w_id,
                )
            )
            assert res.nearby_user_ids == [
                user1_id,
                user2_id,
                user3_id,
                user4_id,
                user5_id,
                user6_id,
                user7_id,
                user8_id,
            ]

            res = api.ListNearbyUsers(
                communities_pb2.ListNearbyUsersReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.nearby_user_ids == [user4_id]

    @staticmethod
    def test_ListDiscussions(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_size=3,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 6",
                "Discussion title 5",
                "Discussion title 4",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 3",
                "Discussion title 2",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 1",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=c1r1c2_id,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 7",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

    @staticmethod
    def test_node_contained_user_ids_association_proxy(testing_communities):
        with session_scope() as session:
            c1_id = get_community_id(session, "Country 1")
            node = session.execute(select(Node).where(Node.id == c1_id)).scalar_one_or_none()
            assert node.contained_user_ids == [1, 2, 3, 4, 5]
            assert len(node.contained_user_ids) == len(node.contained_users)

    @staticmethod
    def test_ListEvents(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            c1_id = get_community_id(session, "Country 1")

        with communities_session(token1) as api:
            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_size=3,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 1",
                "Event title 2",
                "Event title 3",
            ]

            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 4",
                "Event title 5",
            ]

            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 6",
            ]
            assert not res.next_page_token


def test_JoinCommunity_and_LeaveCommunity(testing_communities):
    # these are separate as they mutate the database
    with session_scope() as session:
        # at x=1, inside c1 (country 1)
        user1_id, token1 = get_user_id_and_token(session, "user1")
        # at x=51, not inside c1
        user8_id, token8 = get_user_id_and_token(session, "user8")
        c1_id = get_community_id(session, "Country 1")

    with communities_session(token1) as api:
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user1 is already part of c1, cannot join
        with pytest.raises(grpc.RpcError) as e:
            res = api.JoinCommunity(
                communities_pb2.JoinCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_IN_COMMUNITY

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user1 is inside c1, cannot leave
        with pytest.raises(grpc.RpcError) as e:
            res = api.LeaveCommunity(
                communities_pb2.LeaveCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANNOT_LEAVE_CONTAINING_COMMUNITY

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

    with communities_session(token8) as api:
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 yet, cannot leave
        with pytest.raises(grpc.RpcError) as e:
            res = api.LeaveCommunity(
                communities_pb2.LeaveCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.NOT_IN_COMMUNITY

        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 and not part, can join
        res = api.JoinCommunity(
            communities_pb2.JoinCommunityReq(
                community_id=c1_id,
            )
        )

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 and but now part, can't join again
        with pytest.raises(grpc.RpcError) as e:
            res = api.JoinCommunity(
                communities_pb2.JoinCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_IN_COMMUNITY

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 yet, but part of it, can leave
        res = api.LeaveCommunity(
            communities_pb2.LeaveCommunityReq(
                community_id=c1_id,
            )
        )
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member


def test_LeaveCommunity_regression(db):
    # See github issue #1444, repro:
    # 1. Join more than one community
    # 2. Leave one of them
    # 3. You are no longer in any community
    # admin
    user1, token1 = generate_user(username="user1", geom=create_1d_point(200), geom_radius=0.1)
    # joiner/leaver
    user2, token2 = generate_user(username="user2", geom=create_1d_point(201), geom_radius=0.1)

    with session_scope() as session:
        c0 = create_community(session, 0, 100, "Community 0", [user1], [], None)
        c1 = create_community(session, 0, 50, "Community 1", [user1], [], c0)
        c2 = create_community(session, 0, 10, "Community 2", [user1], [], c0)
        c0_id = c0.id
        c1_id = c1.id
        c2_id = c2.id

    enforce_community_memberships()

    with communities_session(token1) as api:
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

    with communities_session(token2) as api:
        # first check we're not in any communities
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

        # join some communities
        api.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=c1_id))
        api.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=c2_id))

        # check memberships
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

        # leave just c2
        api.LeaveCommunity(communities_pb2.LeaveCommunityReq(community_id=c2_id))

        # check memberships
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member


def test_enforce_community_memberships_for_user(testing_communities):
    """
    Make sure the user is added to the right communities on signup
    """
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    city="Country 1, Region 1, City 2",
                    # lat=8, lng=1 is equivalent to creating this coordinate with create_coordinate(8)
                    lat=8,
                    lng=1,
                    radius=500,
                    accept_tos=True,
                ),
                feedback=auth_pb2.ContributorForm(),
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
            )
        )
    with session_scope() as session:
        email_token = (
            session.execute(select(SignupFlow).where(SignupFlow.flow_token == res.flow_token)).scalar_one().email_token
        )
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(email_token=email_token))
    user_id = res.auth_res.user_id

    # now check the user is in the right communities
    with session_scope() as session:
        w_id = get_community_id(session, "Global")
        c1_id = get_community_id(session, "Country 1")
        c1r1_id = get_community_id(session, "Country 1, Region 1")
        c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

    token = get_session_cookie_token(metadata_interceptor)

    with communities_session(token) as api:
        res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq())
        assert [c.community_id for c in res.communities] == [w_id, c1_id, c1r1_id, c1r1c2_id]


# TODO: requires transferring of content

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass
