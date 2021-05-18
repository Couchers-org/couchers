from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2
from sqlalchemy.exc import IntegrityError

from couchers import errors
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import Cluster, ClusterRole, ClusterSubscription, Node, Page, PageType, PageVersion, Thread, Upload
from couchers.utils import create_polygon_lat_lng, now, to_aware_datetime, to_multi
from pb import pages_pb2
from tests.test_communities import create_1d_point, create_community
from tests.test_fixtures import db, generate_user, pages_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_place_errors(db):
    user, token = generate_user()
    with session_scope() as session:
        create_community(session, 0, 2, "Root node", [user], [], None)

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title=None,
                    content="dummy content",
                    address="dummy address",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_TITLE

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title="dummy title",
                    content=None,
                    address="dummy address",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_CONTENT

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title="dummy title",
                    content="dummy content",
                    address=None,
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_ADDRESS

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title="dummy title",
                    content="dummy content",
                    address="dummy address",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_LOCATION


def test_create_guide_errors(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title=None,
                    content="dummy content",
                    parent_community_id=c_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_TITLE

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title="dummy title",
                    content=None,
                    parent_community_id=c_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_CONTENT

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title="dummy title",
                    content="dummy content",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_PARENT

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title="dummy title",
                    content="dummy content",
                    parent_community_id=9999,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.COMMUNITY_NOT_FOUND

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title="dummy title",
                    content="dummy content",
                    address="dummy address",
                    parent_community_id=c_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_GUIDE_LOCATION

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateGuide(
                pages_pb2.CreateGuideReq(
                    title="dummy title",
                    content="dummy content",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                    parent_community_id=c_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_GUIDE_LOCATION


def test_create_page_place(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        time_before = now()
        res = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy !#¤%&/-*' title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        )

        assert res.title == "dummy !#¤%&/-*' title"
        assert res.type == pages_pb2.PAGE_TYPE_PLACE
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "dummy-title"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate


def test_create_page_guide(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        time_before = now()
        res = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
                parent_community_id=c_id,
            )
        )

        assert res.title == "dummy title"
        assert res.type == pages_pb2.PAGE_TYPE_GUIDE
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "dummy-title"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate

    with pages_session(token) as api:
        time_before = now()
        res = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title",
                content="dummy content",
                parent_community_id=c_id,
            )
        )

        assert res.title == "dummy title"
        assert res.type == pages_pb2.PAGE_TYPE_GUIDE
        assert res.content == "dummy content"
        assert not res.address
        assert not res.HasField("location")
        assert res.slug == "dummy-title"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate


def test_get_page(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    with pages_session(token1) as api:
        time_before_create = now()
        page_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

    with pages_session(token2) as api:
        time_before_get = now()
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_before_get
        assert time_before_create <= to_aware_datetime(res.last_edited) <= time_before_get
        assert res.last_editor_user_id == user1.id
        assert res.creator_user_id == user1.id
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user1.id]
        assert not res.can_edit
        assert not res.can_moderate
        assert res.thread.thread_id > 0
        assert res.thread.num_responses == 0


def test_update_page(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        time_before_create = now()
        page_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

        time_before_update = now()
        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                title=wrappers_pb2.StringValue(value="test title"),
            )
        )

        time_before_get = now()
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "test-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= time_before_get
        assert to_aware_datetime(res.created) <= to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate

        time_before_second_update = now()
        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                content=wrappers_pb2.StringValue(value="test content"),
            )
        )

        time_before_second_get = now()
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "test-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_second_update <= to_aware_datetime(res.last_edited) <= time_before_second_get
        assert to_aware_datetime(res.created) <= to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate
        assert res.thread.thread_id > 0
        assert res.thread.num_responses == 0

        time_before_third_update = now()
        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                address=wrappers_pb2.StringValue(value="test address"),
            )
        )

        time_before_third_get = now()
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "test address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "test-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_third_update <= to_aware_datetime(res.last_edited) <= time_before_third_get
        assert to_aware_datetime(res.created) <= to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate
        assert res.thread.thread_id > 0
        assert res.thread.num_responses == 0

        time_before_fourth_update = now()
        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                location=pages_pb2.Coordinate(
                    lat=3,
                    lng=1.222,
                ),
            )
        )

        time_before_fourth_get = now()
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "test address"
        assert res.location.lat == 3
        assert res.location.lng == 1.222
        assert res.slug == "test-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_fourth_update <= to_aware_datetime(res.last_edited) <= time_before_fourth_get
        assert to_aware_datetime(res.created) <= to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit
        assert res.can_moderate
        assert res.thread.thread_id > 0
        assert res.thread.num_responses == 0


def test_owner_not_moderator(db):
    """
    You can be the owner of content yet not have moderation rights
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    # user2 makes page, is owner but not moderator, so can edit, not moderate
    with pages_session(token2) as api:
        res = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        )
        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "dummy-title"
        assert res.last_editor_user_id == user2.id
        assert res.creator_user_id == user2.id
        assert res.owner_user_id == user2.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user2.id]
        assert res.can_edit
        assert not res.can_moderate

        page_id = res.page_id

    # user1 is not owner so can't edit but can moderate
    with pages_session(token1) as api:
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 1
        assert res.slug == "dummy-title"
        assert res.last_editor_user_id == user2.id
        assert res.creator_user_id == user2.id
        assert res.owner_user_id == user2.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.editor_user_ids == [user2.id]
        assert not res.can_edit
        assert res.can_moderate
        assert res.thread.thread_id > 0
        assert res.thread.num_responses == 0


def test_update_page_errors(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        page_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePage(
                pages_pb2.UpdatePageReq(
                    page_id=page_id,
                    title=wrappers_pb2.StringValue(value=""),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_TITLE

        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePage(
                pages_pb2.UpdatePageReq(
                    page_id=page_id,
                    content=wrappers_pb2.StringValue(value=""),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_CONTENT

        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePage(
                pages_pb2.UpdatePageReq(
                    page_id=page_id,
                    address=wrappers_pb2.StringValue(value=""),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_ADDRESS


def test_page_transfer(db):
    # transfers the pages
    user1, token1 = generate_user()
    # admin of the community/group
    user2, token2 = generate_user()
    # member of the community/group, shouldn't ever have edit access to anything
    user3, token3 = generate_user()
    with session_scope() as session:
        # create a community
        node = Node(geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])))
        session.add(node)
        community_cluster = Cluster(
            name=f"Testing Community",
            description=f"Description for testing community",
            parent_node=node,
            is_official_cluster=True,
        )
        session.add(community_cluster)
        main_page = Page(
            parent_node=community_cluster.parent_node,
            creator_user_id=user2.id,
            owner_cluster=community_cluster,
            type=PageType.main_page,
            thread=Thread(),
        )
        session.add(main_page)
        session.add(
            PageVersion(
                page=main_page,
                editor_user_id=user2.id,
                title=f"Main page for the testing community",
                content="Empty.",
            )
        )
        community_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=user2.id,
                role=ClusterRole.admin,
            )
        )
        community_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=user3.id,
                role=ClusterRole.member,
            )
        )

        # create a group
        group_cluster = Cluster(
            name=f"Testing Group",
            description=f"Description for testing group",
            parent_node=node,
        )
        session.add(group_cluster)
        main_page = Page(
            parent_node=group_cluster.parent_node,
            creator_user_id=user2.id,
            owner_cluster=group_cluster,
            type=PageType.main_page,
            thread=Thread(),
        )
        session.add(main_page)
        session.add(
            PageVersion(
                page=main_page,
                editor_user_id=user2.id,
                title=f"Main page for the testing community",
                content="Empty.",
            )
        )
        group_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=user2.id,
                role=ClusterRole.admin,
            )
        )
        group_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=user3.id,
                role=ClusterRole.member,
            )
        )
        session.flush()

        community_id = node.id
        community_cluster_id = community_cluster.id
        group_id = group_cluster.id

    with pages_session(token1) as api:
        create_page_req = pages_pb2.CreatePlaceReq(
            title="title",
            content="content",
            address="address",
            location=pages_pb2.Coordinate(
                lat=1,
                lng=1,
            ),
        )

        # transfer should work fine to a community
        page1 = api.CreatePlace(create_page_req)
        assert page1.owner_user_id == user1.id
        assert page1.can_edit
        assert not page1.can_moderate

    with pages_session(token2) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token1) as api:
        page1 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page1.page_id,
                new_owner_community_id=community_id,
            )
        )
        assert page1.owner_community_id == community_id
        assert not page1.can_edit
        assert not page1.can_moderate

    with pages_session(token2) as api:
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token1) as api:
        # now we're no longer the owner, can't transfer
        page1 = api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id))
        with pytest.raises(grpc.RpcError) as e:
            api.TransferPage(
                pages_pb2.TransferPageReq(
                    page_id=page1.page_id,
                    new_owner_group_id=group_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.PAGE_TRANSFER_PERMISSION_DENIED
        page1 = api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id))
        assert page1.owner_community_id == community_id
        assert not page1.can_edit
        assert not page1.can_moderate

    with pages_session(token2) as api:
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page1.page_id)).can_moderate

    with pages_session(token1) as api:
        # try a new page, just for fun
        page2 = api.CreatePlace(create_page_req)
        assert page2.owner_user_id == user1.id

        page2 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page2.page_id,
                new_owner_community_id=community_id,
            )
        )
        assert page2.owner_community_id == community_id

    with pages_session(token2) as api:
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page2.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page2.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page2.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page2.page_id)).can_moderate

    with pages_session(token1) as api:
        # can't transfer a page to an official cluster, only through community
        page3 = api.CreatePlace(create_page_req)
        assert page3.owner_user_id == user1.id

        with pytest.raises(grpc.RpcError) as e:
            api.TransferPage(
                pages_pb2.TransferPageReq(
                    page_id=page3.page_id,
                    new_owner_community_id=community_cluster_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.GROUP_OR_COMMUNITY_NOT_FOUND
        page3 = api.GetPage(pages_pb2.GetPageReq(page_id=page3.page_id))
        assert page3.owner_user_id == user1.id

        # can transfer to group
        page4 = api.CreatePlace(create_page_req)
        assert page4.owner_user_id == user1.id
        assert page4.can_edit
        assert not page4.can_moderate

    with pages_session(token2) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_moderate

    with pages_session(token1) as api:
        page4 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page4.page_id,
                new_owner_group_id=group_id,
            )
        )
        assert page4.owner_group_id == group_id
        assert not page4.can_edit
        assert not page4.can_moderate

    with pages_session(token2) as api:
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_edit
        assert api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_moderate

    with pages_session(token3) as api:
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_edit
        assert not api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id)).can_moderate

    with pages_session(token1) as api:
        # now we're no longer the owner, can't transfer
        with pytest.raises(grpc.RpcError) as e:
            api.TransferPage(
                pages_pb2.TransferPageReq(
                    page_id=page4.page_id,
                    new_owner_community_id=community_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == errors.PAGE_TRANSFER_PERMISSION_DENIED
        page4 = api.GetPage(pages_pb2.GetPageReq(page_id=page4.page_id))
        assert page4.owner_group_id == group_id


def test_page_photo(db):
    user, token = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    with pages_session(token) as api:
        key1 = random_hex(32)
        filename1 = random_hex(32)

        with session_scope() as session:
            session.add(
                Upload(
                    key=key1,
                    filename=filename1,
                    creator_user_id=user.id,
                )
            )

        res = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                photo_key=key1,
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        )

        assert filename1 in res.photo_url

        # can't create with non-existent photo
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title="dummy title",
                    content="dummy content",
                    photo_key="nonexisten",
                    address="dummy address",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.PHOTO_NOT_FOUND

        # can create page with no photo
        res = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        )

        assert res.photo_url == ""

        page_id = res.page_id

        # can't set it to non-existent stuff
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePage(
                pages_pb2.UpdatePageReq(
                    page_id=page_id,
                    photo_key=wrappers_pb2.StringValue(value="non-existent id"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.PHOTO_NOT_FOUND

        key2 = random_hex(32)
        filename2 = random_hex(32)

        with session_scope() as session:
            session.add(
                Upload(
                    key=key2,
                    filename=filename2,
                    creator_user_id=user.id,
                )
            )

        res = api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                photo_key=wrappers_pb2.StringValue(value=key2),
            )
        )

        assert filename2 in res.photo_url

        # can unset it

        res = api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                photo_key=wrappers_pb2.StringValue(value=""),
            )
        )

        assert res.photo_url == ""


def test_page_constraints(db):
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    # check we can't create a page without an owner
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            page = Page(
                parent_node_id=c_id,
                # note no owner
                creator_user_id=user.id,
                type=PageType.guide,
                thread=Thread(),
            )
            session.add(page)
            session.add(
                PageVersion(
                    page=page,
                    editor_user_id=user.id,
                    title=f"Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    with session_scope() as session:
        node = Node(geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])))
        session.add(node)
        cluster = Cluster(
            name=f"Testing Community",
            description=f"Description for testing community",
            parent_node=node,
        )
        session.add(cluster)
        session.flush()
        cluster_parent_id = cluster.parent_node_id
        cluster_id = cluster.id

    # check we can't create a page with two owners
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            page = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                owner_user_id=user.id,
                type=PageType.guide,
                thread=Thread(),
            )
            session.add(page)
            session.add(
                PageVersion(
                    page=page,
                    editor_user_id=user.id,
                    title=f"Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    # main page must be owned by the right cluster
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            main_page = Page(
                parent_node_id=cluster_parent_id,
                # note owner is not cluster
                creator_user_id=user.id,
                owner_user_id=user.id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page)
            session.add(
                PageVersion(
                    page=main_page,
                    editor_user_id=user.id,
                    title=f"Main page for the testing community",
                    content="Empty.",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "main_page_owned_by_cluster" in str(e.value)

    # can only have one main page
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            main_page1 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page1)
            session.add(
                PageVersion(
                    page=main_page1,
                    editor_user_id=user.id,
                    title=f"Main page 1 for the testing community",
                    content="Empty.",
                )
            )
            main_page2 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page2)
            session.add(
                PageVersion(
                    page=main_page2,
                    editor_user_id=user.id,
                    title=f"Main page 2 for the testing community",
                    content="Empty.",
                )
            )
    assert "violates unique constraint" in str(e.value)
    assert "ix_pages_owner_cluster_id_type" in str(e.value)


def test_list_user_places(db):
    user1, token1 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    with pages_session(token1) as api:
        place1_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

        place2_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title 2",
                content="dummy content 2",
                address="dummy address 2",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

    with pages_session(token1) as api:
        res = api.ListUserPlaces(pages_pb2.ListUserPlacesReq())
        assert [p.page_id for p in res.places] == [place1_id, place2_id]


def test_list_other_user_places(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    with pages_session(token1) as api:
        place1_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

        place2_id = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="dummy title 2",
                content="dummy content 2",
                address="dummy address 2",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
            )
        ).page_id

    with pages_session(token2) as api:
        res = api.ListUserPlaces(pages_pb2.ListUserPlacesReq(user_id=user1.id))
        assert [p.page_id for p in res.places] == [place1_id, place2_id]


def test_list_user_guides(db):
    user1, token1 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    with pages_session(token1) as api:
        guide1_id = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
                parent_community_id=c_id,
            )
        ).page_id

        guide2_id = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title 2",
                content="dummy content 2",
                address="dummy address 2",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
                parent_community_id=c_id,
            )
        ).page_id

    with pages_session(token1) as api:
        res = api.ListUserGuides(pages_pb2.ListUserGuidesReq())
        assert [p.page_id for p in res.guides] == [guide1_id, guide2_id]


def test_list_other_user_guides(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user1], [], None).id

    with pages_session(token1) as api:
        guide1_id = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
                parent_community_id=c_id,
            )
        ).page_id

        guide2_id = api.CreateGuide(
            pages_pb2.CreateGuideReq(
                title="dummy title 2",
                content="dummy content 2",
                address="dummy address 2",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=1,
                ),
                parent_community_id=c_id,
            )
        ).page_id

    with pages_session(token2) as api:
        res = api.ListUserGuides(pages_pb2.ListUserGuidesReq(user_id=user1.id))
        assert [p.page_id for p in res.guides] == [guide1_id, guide2_id]
