from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node, Page, PageType, PageVersion
from couchers.utils import create_polygon_lat_lng, now, to_aware_datetime, to_multi
from pb import pages_pb2
from tests.test_fixtures import db, generate_user, pages_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_page_errors(db):
    user, token = generate_user()
    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePage(
                pages_pb2.CreatePageReq(
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
            api.CreatePage(
                pages_pb2.CreatePageReq(
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
            api.CreatePage(
                pages_pb2.CreatePageReq(
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
            api.CreatePage(
                pages_pb2.CreatePageReq(
                    title="dummy title",
                    content="dummy content",
                    address="dummy address",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_LOCATION

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePage(
                pages_pb2.CreatePageReq(
                    type=pages_pb2.PAGE_TYPE_MAIN_PAGE,
                    title="dummy title",
                    content="dummy content",
                    address="dummy address",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=3,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANNOT_CREATE_PAGE_TYPE


def test_create_page_place(db):
    user, token = generate_user()
    with pages_session(token) as api:
        res = api.CreatePage(
            pages_pb2.CreatePageReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=2,
                ),
                type=pages_pb2.PAGE_TYPE_PLACE,
            )
        )

        assert res.title == "dummy title"
        assert res.type == pages_pb2.PAGE_TYPE_PLACE
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "dummy-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit


def test_create_page_guide(db):
    user, token = generate_user()
    with pages_session(token) as api:
        res = api.CreatePage(
            pages_pb2.CreatePageReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=2,
                ),
                type=pages_pb2.PAGE_TYPE_GUIDE,
            )
        )

        assert res.title == "dummy title"
        assert res.type == pages_pb2.PAGE_TYPE_GUIDE
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "dummy-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit


def test_get_page(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with pages_session(token1) as api:
        page_id = api.CreatePage(
            pages_pb2.CreatePageReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=2,
                ),
            )
        ).page_id

    with pages_session(token2) as api:
        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "dummy-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert res.last_editor_user_id == user1.id
        assert res.creator_user_id == user1.id
        assert res.owner_user_id == user1.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user1.id]
        assert not res.can_edit


def test_update_page(db):
    user, token = generate_user()
    with pages_session(token) as api:
        page_id = api.CreatePage(
            pages_pb2.CreatePageReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=2,
                ),
            )
        ).page_id

        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                title=wrappers_pb2.StringValue(value="test title"),
            )
        )

        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "dummy content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "test-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert to_aware_datetime(res.created) < to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit

        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                content=wrappers_pb2.StringValue(value="test content"),
            )
        )

        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "dummy address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "test-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert to_aware_datetime(res.created) < to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit

        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                address=wrappers_pb2.StringValue(value="test address"),
            )
        )

        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "test address"
        assert res.location.lat == 1
        assert res.location.lng == 2
        assert res.slug == "test-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert to_aware_datetime(res.created) < to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit

        api.UpdatePage(
            pages_pb2.UpdatePageReq(
                page_id=page_id,
                location=pages_pb2.Coordinate(
                    lat=3,
                    lng=1.222,
                ),
            )
        )

        res = api.GetPage(pages_pb2.GetPageReq(page_id=page_id))
        assert res.title == "test title"
        assert res.content == "test content"
        assert res.address == "test address"
        assert res.location.lat == 3
        assert res.location.lng == 1.222
        assert res.slug == "test-title"
        assert to_aware_datetime(res.created) > now() - timedelta(seconds=10) and to_aware_datetime(res.created) < now()
        assert (
            to_aware_datetime(res.last_edited) > now() - timedelta(seconds=10)
            and to_aware_datetime(res.last_edited) < now()
        )
        assert to_aware_datetime(res.created) < to_aware_datetime(res.last_edited)
        assert res.last_editor_user_id == user.id
        assert res.creator_user_id == user.id
        assert res.owner_user_id == user.id
        assert not res.owner_cluster_id
        assert res.editor_user_ids == [user.id]
        assert res.can_edit


def test_update_page_errors(db):
    user, token = generate_user()
    with pages_session(token) as api:
        page_id = api.CreatePage(
            pages_pb2.CreatePageReq(
                title="dummy title",
                content="dummy content",
                address="dummy address",
                location=pages_pb2.Coordinate(
                    lat=1,
                    lng=2,
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
    user, token = generate_user()
    with session_scope() as session:
        # create a community
        node = Node(geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])))
        session.add(node)
        community_cluster = Cluster(
            name=f"Testing Community",
            description=f"Description for testing community",
            parent_node=node,
            official_cluster_for_node=node,
        )
        session.add(community_cluster)
        main_page = Page(
            creator_user_id=user.id,
            owner_user_id=user.id,
            type=PageType.main_page,
            main_page_for_cluster=community_cluster,
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

        # create a group
        group_cluster = Cluster(
            name=f"Testing Group",
            description=f"Description for testing group",
            parent_node=node,
        )
        session.add(group_cluster)
        main_page = Page(
            creator_user_id=user.id,
            owner_user_id=user.id,
            type=PageType.main_page,
            main_page_for_cluster=group_cluster,
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
        session.flush()

        community_id = node.id
        community_cluster_id = community_cluster.id
        group_id = group_cluster.id

    with pages_session(token) as api:
        create_page_req = pages_pb2.CreatePageReq(
            title="title",
            content="content",
            address="address",
            location=pages_pb2.Coordinate(
                lat=1,
                lng=2,
            ),
        )

        # transfer should work fine to a community
        page1 = api.CreatePage(create_page_req)
        assert page1.owner_user_id == user.id

        page1 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page1.page_id,
                new_owner_community_id=community_id,
            )
        )
        assert page1.owner_community_id == community_id

        # now we're no longer the owner, can't transfer
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

        # try a new page, just for fun
        page2 = api.CreatePage(create_page_req)
        assert page2.owner_user_id == user.id

        page2 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page2.page_id,
                new_owner_community_id=community_id,
            )
        )
        assert page2.owner_community_id == community_id

        # can't transfer a page to an official cluster, only through community
        page3 = api.CreatePage(create_page_req)
        assert page3.owner_user_id == user.id

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
        assert page3.owner_user_id == user.id

        # can transfer to group
        page4 = api.CreatePage(create_page_req)
        assert page4.owner_user_id == user.id

        page4 = api.TransferPage(
            pages_pb2.TransferPageReq(
                page_id=page4.page_id,
                new_owner_group_id=group_id,
            )
        )
        print(page4)
        assert page4.owner_group_id == group_id

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
