from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.utils import now, to_aware_datetime
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


def test_create_page_poi(db):
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
                type=pages_pb2.PAGE_TYPE_POI,
            )
        )

        assert res.title == "dummy title"
        assert res.type == pages_pb2.PAGE_TYPE_POI
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
