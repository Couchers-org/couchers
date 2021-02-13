import pytest

from couchers.db import session_scope
from couchers.models.auth import UserSession
from couchers.models.communities import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Node,
    Page,
    PageType,
    PageVersion,
    Thread,
)
from couchers.models.core import User
from couchers.tasks import enforce_community_memberships
from couchers.utils import create_coordinate, create_polygon_lat_lng, to_multi
from pb import communities_pb2, discussions_pb2, pages_pb2
from tests.test_fixtures import (
    communities_session,
    db_impl,
    discussions_session,
    generate_user,
    pages_session,
    testconfig,
)


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
        thread=Thread(),
    )
    session.add(cluster)
    main_page = Page(
        creator_user=admins[0],
        owner_cluster=cluster,
        type=PageType.main_page,
        main_page_for_cluster=cluster,
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
    for member in extra_members:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user=member,
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
        thread=Thread(),
    )
    session.add(cluster)
    main_page = Page(
        creator_user=admins[0],
        owner_cluster=cluster,
        type=PageType.main_page,
        main_page_for_cluster=cluster,
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
                type=pages_pb2.PAGE_TYPE_PLACE,
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


def get_user_id_and_token(session, username):
    user_id = session.query(User).filter(User.username == username).one().id
    token = session.query(UserSession).filter(UserSession.user_id == user_id).one().token
    return user_id, token


def get_community_id(session, community_name):
    return (
        session.query(Cluster)
        .filter(Cluster.official_cluster_for_node_id != None)
        .filter(Cluster.name == community_name)
        .one()
        .official_cluster_for_node_id
    )


def get_group_id(session, group_name):
    return (
        session.query(Cluster)
        .filter(Cluster.official_cluster_for_node_id == None)
        .filter(Cluster.name == group_name)
        .one()
        .id
    )


@pytest.fixture(params=["models", "migrations"], scope="class")
def testing_communities(request):
    db_impl(request.param)
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

        h = _create_group(session, "Hitchhikers", [user1, user2], [user5, user8], w)
        _create_group(session, "Country 1, Region 1, Foodies", [user1], [user2, user4], c1r1)
        _create_group(session, "Country 1, Region 1, Skaters", [user2], [user1], c1r1)
        _create_group(session, "Country 1, Region 2, Foodies", [user2], [user4, user5], c1r2)
        _create_group(session, "Country 2, Region 1, Foodies", [user6], [user7], c2r1)

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

    enforce_community_memberships()

    _create_place(token1, "Country 1, Region 1, Attraction", "Place content", "Somewhere in c1r1", 6)
    _create_place(token2, "Country 1, Region 1, City 1, Attraction 1", "Place content", "Somewhere in c1r1c1", 3)
    _create_place(token2, "Country 1, Region 1, City 1, Attraction 2", "Place content", "Somewhere in c1r1c1", 4)
    _create_place(token8, "World, Attraction", "Place content", "Somewhere in w", 51.5)
    _create_place(token6, "Country 2, Region 1, Attraction", "Place content", "Somewhere in c2r1", 59)

    yield


class TestCommunities:
    @staticmethod
    def test_GetCommunity(testing_communities):
        with session_scope() as session:
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "World")
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
            assert res.main_page.owner_community_id == w_id
            assert res.main_page.title == "Main page for the World community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
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
            assert res.main_page.owner_community_id == c1r1c1_id
            assert res.main_page.title == "Main page for the Country 1, Region 1, City 1 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert res.main_page.can_edit
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
            assert res.main_page.owner_community_id == c2_id
            assert res.main_page.title == "Main page for the Country 2 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
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
    def test_ListGroups(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            w_id = get_community_id(session, "World")
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
            w_id = get_community_id(session, "World")
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
            w_id = get_community_id(session, "World")
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
            w_id = get_community_id(session, "World")
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
            w_id = get_community_id(session, "World")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_size=3,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 1",
                "Discussion title 2",
                "Discussion title 3",
            ]

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 4",
                "Discussion title 5",
            ]

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 6",
            ]

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=c1r1c2_id,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 7",
            ]


# TODO: requires transferring of content

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass
