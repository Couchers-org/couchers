from datetime import timedelta

import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Discussion, Node, Page, PageType, PageVersion, Thread
from couchers.utils import create_polygon_lat_lng, now, to_aware_datetime, to_multi
from pb import discussions_pb2
from tests.test_fixtures import db, discussions_session, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_discussion_errors(db):
    user, token = generate_user()
    with discussions_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title=None,
                    content="dummy content",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_DISCUSSION_TITLE

    with discussions_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title="dummy title",
                    content=None,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_DISCUSSION_CONTENT


def test_create_and_get_discussion(db):
    generate_user()
    user, token = generate_user()
    generate_user()
    generate_user()

    with session_scope() as session:
        node = Node(geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])))
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
            creator_user_id=user.id,
            owner_cluster=community_cluster,
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
        # create a group
        group_cluster = Cluster(
            name=f"Testing Group",
            description=f"Description for testing group",
            parent_node=node,
        )
        session.add(group_cluster)
        main_page = Page(
            parent_node=group_cluster.parent_node,
            creator_user_id=user.id,
            owner_cluster=group_cluster,
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
        session.flush()

        community_id = node.id
        community_cluster_id = community_cluster.id
        group_id = group_cluster.id

    with discussions_session(token) as api:
        time_before_create = now()
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="dummy title",
                content="dummy content",
                owner_community_id=community_id,
            )
        )
        time_after_create = now()

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == user.id
        assert res.owner_community_id == community_id

        discussion_id = res.discussion_id

    with discussions_session(token) as api:
        res = api.GetDiscussion(
            discussions_pb2.GetDiscussionReq(
                discussion_id=discussion_id,
            )
        )

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == user.id
        assert res.owner_community_id == community_id

    with discussions_session(token) as api:
        time_before_create = now()
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="dummy title",
                content="dummy content",
                owner_group_id=group_id,
            )
        )
        time_after_create = now()

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == user.id
        assert res.owner_group_id == group_id

        discussion_id = res.discussion_id

    with discussions_session(token) as api:
        res = api.GetDiscussion(
            discussions_pb2.GetDiscussionReq(
                discussion_id=discussion_id,
            )
        )

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == user.id
        assert res.owner_group_id == group_id
