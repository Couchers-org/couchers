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
    User,
    UserSession,
)
from couchers.tasks import enforce_community_memberships
from couchers.utils import create_coordinate, create_polygon_lat_lng, now, to_aware_datetime, to_multi
from pb import communities_pb2, pages_pb2
from tests.test_fixtures import communities_session, db, generate_user, lists_equal, pages_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# For testing purposes, restrict ourselves to a 1D-world, consisting of "intervals" that have width 2, and coordinates
# that are points at (x, 1).
# we'll stick to EPSG4326, even though it's not ideal, so don't use too large values, but it's around the equator, so
# mostly fine


def _create_1d_polygon(lb, ub):
    # given a lower bound and upper bound on x, creates the given interval
    return create_polygon_lat_lng([[lb, 0], [lb, 2], [ub, 2], [ub, 0], [lb, 0]])


def _create_1d_point(x):
    return create_coordinate(x, 1)


def _create_community(session, interval_lb, interval_ub, name, admins, extra_members, parent):
    node = Node(
        geom=to_multi(_create_1d_polygon(interval_lb, interval_ub)),
        parent_node=parent,
    )
    session.add(node)
    cluster = Cluster(
        name=f"{name}",
        description=f"Description for {name}",
        parent_node=node,
        official_cluster_for_node=node,
    )
    session.add(cluster)
    main_page = Page(
        creator_user=admins[0],
        owner_user=admins[0],
        type=PageType.main_page,
        main_page_for_cluster=cluster,
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
                cluster=cluster,
                role=ClusterRole.admin,
            )
        )
    for member in extra_members:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user=member,
                cluster=cluster,
                role=ClusterRole.member,
            )
        )
    session.commit()
    # other members will be added by enforce_community_memberships()
    return node


def _create_group(session, name, admins, members, parent_community):
    cluster = Cluster(
        name=f"{name}",
        description=f"Description for {name}",
        parent_node=parent_community,
    )
    session.add(cluster)
    main_page = Page(
        creator_user=admins[0],
        owner_user=admins[0],
        type=PageType.main_page,
        main_page_for_cluster=cluster,
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
                cluster=cluster,
                role=ClusterRole.admin,
            )
        )
    for member in members:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user=member,
                cluster=cluster,
                role=ClusterRole.member,
            )
        )
    session.commit()
    return cluster


def _create_place(token, title, content, address, x):
    with pages_session(token) as api:
        res = api.CreatePage(
            pages_pb2.CreatePageReq(
                title=title,
                content=content,
                address=address,
                location=pages_pb2.Coordinate(
                    lat=x,
                    lng=1,
                ),
                type=pages_pb2.PAGE_TYPE_POI,
            )
        )


def _get_user_id_and_token(session, username):
    user_id = session.query(User).filter(User.username == username).one().id
    token = session.query(UserSession).filter(UserSession.user_id == user_id).one().token
    return user_id, token


def _get_community_id(session, community_name):
    return (
        session.query(Cluster)
        .filter(Cluster.official_cluster_for_node_id != None)
        .filter(Cluster.name == community_name)
        .one()
        .official_cluster_for_node_id
    )


def _get_group_id(session, group_name):
    return (
        session.query(Cluster)
        .filter(Cluster.official_cluster_for_node_id == None)
        .filter(Cluster.name == group_name)
        .one()
        .id
    )


@pytest.fixture()
def testing_communities(db):
    user1, token1 = generate_user(username="user1", geom=_create_1d_point(1), geom_radius=0.1)
    user2, token2 = generate_user(username="user2", geom=_create_1d_point(2), geom_radius=0.1)
    user3, token3 = generate_user(username="user3", geom=_create_1d_point(3), geom_radius=0.1)
    user4, token4 = generate_user(username="user4", geom=_create_1d_point(8), geom_radius=0.1)
    user5, token5 = generate_user(username="user5", geom=_create_1d_point(6), geom_radius=0.1)
    user6, token6 = generate_user(username="user6", geom=_create_1d_point(65), geom_radius=0.1)
    user7, token7 = generate_user(username="user7", geom=_create_1d_point(80), geom_radius=0.1)
    user8, token8 = generate_user(username="user8", geom=_create_1d_point(51), geom_radius=0.1)

    with session_scope() as session:
        w = _create_community(session, 0, 100, "World", [user1, user3, user7], [], None)
        c1 = _create_community(session, 0, 50, "Country 1", [user1, user2], [], w)
        c1r1 = _create_community(session, 0, 10, "Country 1, Region 1", [user1, user2], [], c1)
        c1r1c1 = _create_community(session, 0, 5, "Country 1, Region 1, City 1", [user2], [], c1r1)
        c1r1c2 = _create_community(session, 7, 10, "Country 1, Region 1, City 2", [user4, user5], [user2], c1r1)
        c1r2 = _create_community(session, 20, 25, "Country 1, Region 2", [user2], [], c1)
        c1r2c1 = _create_community(session, 21, 23, "Country 1, Region 2, City 1", [user2], [], c1r2)
        c2 = _create_community(session, 52, 100, "Country 2", [user6, user7], [], w)
        c2r1 = _create_community(session, 52, 71, "Country 2, Region 1", [user6], [user8], c2)
        c2r1c1 = _create_community(session, 53, 70, "Country 2, Region 1, City 1", [user8], [], c2r1)

        _create_group(session, "Gobblywobs", [user1, user2], [user5, user8], w)
        _create_group(session, "Country 1, Region 1, Foodies", [user1], [user2, user4], c1r1)
        _create_group(session, "Country 1, Region 1, Skaters", [user2], [user1], c1r1)
        _create_group(session, "Country 1, Region 2, Foodies", [user2], [user4, user5], c1r2)
        _create_group(session, "Country 2, Region 1, Foodies", [user6], [user7], c2r1)

    enforce_community_memberships()

    _create_place(token1, "Country 1, Region 1, Attraction", "Place content", "Somewhere in c1r1", 6)
    _create_place(token2, "Country 1, Region 1, City 1, Attraction 1", "Place content", "Somewhere in c1r1c1", 3)
    _create_place(token2, "Country 1, Region 1, City 1, Attraction 2", "Place content", "Somewhere in c1r1c1", 4)
    _create_place(token8, "World, Attraction", "Place content", "Somewhere in w", 51.5)
    _create_place(token6, "Country 2, Region 1, Attraction", "Place content", "Somewhere in c2r1", 59)


def test_GetCommunity(db, testing_communities):
    with session_scope() as session:
        user2_id, token2 = _get_user_id_and_token(session, "user2")
        w_id = _get_community_id(session, "World")
        c1_id = _get_community_id(session, "Country 1")
        c1r1_id = _get_community_id(session, "Country 1, Region 1")
        c1r1c1_id = _get_community_id(session, "Country 1, Region 1, City 1")
        c2_id = _get_community_id(session, "Country 2")

    with communities_session(token2) as api:
        res = api.GetCommunity(
            communities_pb2.GetCommunityReq(
                community_id=w_id,
            )
        )
        assert res.name == "World"
        assert res.slug == "world"
        assert res.description == "Description for World"
        assert len(res.parents) == 1
        assert res.parents[0].HasField("community")
        assert res.parents[0].community.community_id == w_id
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
        assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
        assert res.main_page.slug == "main-page-for-the-world-community"
        assert res.main_page.last_editor_user_id == 1
        assert res.main_page.creator_user_id == 1
        assert res.main_page.owner_user_id == 1
        assert res.main_page.title == "Main page for the World community"
        assert res.main_page.content == "There is nothing here yet..."
        assert lists_equal(res.main_page.editor_user_ids, [1])
        assert res.member
        assert not res.admin
        assert res.member_count == 8
        assert res.admin_count == 3

    with communities_session(token2) as api:
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
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
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
        assert res.main_page.owner_user_id == 2
        assert res.main_page.title == "Main page for the Country 1, Region 1, City 1 community"
        assert res.main_page.content == "There is nothing here yet..."
        assert lists_equal(res.main_page.editor_user_ids, [2])
        assert res.member
        assert res.admin
        assert res.member_count == 3
        assert res.admin_count == 1

    with communities_session(token2) as api:
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
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
        assert res.parents[1].HasField("community")
        assert res.parents[1].community.community_id == c2_id
        assert res.parents[1].community.name == "Country 2"
        assert res.parents[1].community.slug == "country-2"
        assert res.parents[1].community.description == "Description for Country 2"
        assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
        assert res.main_page.slug == "main-page-for-the-country-2-community"
        assert res.main_page.last_editor_user_id == 6
        assert res.main_page.creator_user_id == 6
        assert res.main_page.owner_user_id == 6
        assert res.main_page.title == "Main page for the Country 2 community"
        assert res.main_page.content == "There is nothing here yet..."
        assert lists_equal(res.main_page.editor_user_ids, [6])
        assert not res.member
        assert not res.admin
        assert res.member_count == 2
        assert res.admin_count == 2


def test_ListCommunities(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = _get_user_id_and_token(session, "user1")
        c1_id = _get_community_id(session, "Country 1")
        c1r1_id = _get_community_id(session, "Country 1, Region 1")
        c1r2_id = _get_community_id(session, "Country 1, Region 2")

    with communities_session(token1) as api:
        res = api.ListCommunities(
            communities_pb2.ListCommunitiesReq(
                community_id=c1_id,
            )
        )
        assert lists_equal([c.community_id for c in res.communities], [c1r1_id, c1r2_id])


def test_ListGroups(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = _get_user_id_and_token(session, "user1")
        user5_id, token5 = _get_user_id_and_token(session, "user5")
        w_id = _get_community_id(session, "World")
        gobblywobs_id = _get_group_id(session, "Gobblywobs")
        c1r1_id = _get_community_id(session, "Country 1, Region 1")
        foodies_id = _get_group_id(session, "Country 1, Region 1, Foodies")
        skaters_id = _get_group_id(session, "Country 1, Region 1, Skaters")

    with communities_session(token1) as api:
        res = api.ListGroups(
            communities_pb2.ListGroupsReq(
                community_id=c1r1_id,
            )
        )
        assert lists_equal([g.group_id for g in res.groups], [foodies_id, skaters_id])

    with communities_session(token5) as api:
        res = api.ListGroups(
            communities_pb2.ListGroupsReq(
                community_id=w_id,
            )
        )
        assert len(res.groups) == 1
        assert res.groups[0].group_id == gobblywobs_id


def test_ListAdmins(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = _get_user_id_and_token(session, "user1")
        user3_id, token3 = _get_user_id_and_token(session, "user3")
        user4_id, token4 = _get_user_id_and_token(session, "user4")
        user5_id, token5 = _get_user_id_and_token(session, "user5")
        user7_id, token7 = _get_user_id_and_token(session, "user7")
        w_id = _get_community_id(session, "World")
        c1r1c2_id = _get_community_id(session, "Country 1, Region 1, City 2")

    with communities_session(token1) as api:
        res = api.ListAdmins(
            communities_pb2.ListAdminsReq(
                community_id=w_id,
            )
        )
        assert lists_equal(res.admin_user_ids, [user1_id, user3_id, user7_id])

        res = api.ListAdmins(
            communities_pb2.ListAdminsReq(
                community_id=c1r1c2_id,
            )
        )
        assert lists_equal(res.admin_user_ids, [user4_id, user5_id])


def test_ListMembers(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = _get_user_id_and_token(session, "user1")
        user2_id, token2 = _get_user_id_and_token(session, "user2")
        user3_id, token3 = _get_user_id_and_token(session, "user3")
        user4_id, token4 = _get_user_id_and_token(session, "user4")
        user5_id, token5 = _get_user_id_and_token(session, "user5")
        user6_id, token6 = _get_user_id_and_token(session, "user6")
        user7_id, token7 = _get_user_id_and_token(session, "user7")
        user8_id, token8 = _get_user_id_and_token(session, "user8")
        w_id = _get_community_id(session, "World")
        c1r1c2_id = _get_community_id(session, "Country 1, Region 1, City 2")

    with communities_session(token1) as api:
        res = api.ListMembers(
            communities_pb2.ListMembersReq(
                community_id=w_id,
            )
        )
        assert lists_equal(
            res.member_user_ids, [user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id]
        )

        res = api.ListMembers(
            communities_pb2.ListMembersReq(
                community_id=c1r1c2_id,
            )
        )
        assert lists_equal(res.member_user_ids, [user2_id, user4_id, user5_id])


def test_ListNearbyUsers(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = _get_user_id_and_token(session, "user1")
        user2_id, token2 = _get_user_id_and_token(session, "user2")
        user3_id, token3 = _get_user_id_and_token(session, "user3")
        user4_id, token4 = _get_user_id_and_token(session, "user4")
        user5_id, token5 = _get_user_id_and_token(session, "user5")
        user6_id, token6 = _get_user_id_and_token(session, "user6")
        user7_id, token7 = _get_user_id_and_token(session, "user7")
        user8_id, token8 = _get_user_id_and_token(session, "user8")
        w_id = _get_community_id(session, "World")
        c1r1c2_id = _get_community_id(session, "Country 1, Region 1, City 2")

    with communities_session(token1) as api:
        res = api.ListNearbyUsers(
            communities_pb2.ListNearbyUsersReq(
                community_id=w_id,
            )
        )
        assert lists_equal(
            res.nearby_user_ids, [user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id]
        )

        res = api.ListNearbyUsers(
            communities_pb2.ListNearbyUsersReq(
                community_id=c1r1c2_id,
            )
        )
        assert lists_equal(res.nearby_user_ids, [user4_id])


# TODO: requires transferring of content

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass

# def test_ListDiscussions(db, testing_communities):
#     pass
