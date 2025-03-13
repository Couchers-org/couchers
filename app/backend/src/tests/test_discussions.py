import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.utils import now, to_aware_datetime
from proto import discussions_pb2, notifications_pb2, threads_pb2
from tests.test_communities import create_community, create_group
from tests.test_fixtures import (  # noqa
    db,
    discussions_session,
    generate_user,
    notifications_session,
    process_jobs,
    push_collector,
    testconfig,
    threads_session,
)


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


def test_create_and_get_discussion(db, push_collector):
    generate_user()
    user, token = generate_user()
    user2, token2 = generate_user()
    generate_user()
    generate_user()

    with notifications_session(token2) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic="discussion",
                        action="create",
                        delivery_method="push",
                        enabled=True,
                    )
                ],
            )
        )

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user2], [], None)
        group_id = create_group(session, "Testing Group", [user2], [], community).id
        community_id = community.id
        user2_id = user2.id

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

    process_jobs()

    push_collector.assert_user_has_single_matching(
        user2_id,
        title="dummy title",
        body=f"{user.name} created a discussion in Testing Community: dummy title\n\ndummy content",
    )

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


def test_discussion_notifications_regression(db, push_collector):
    generate_user()
    user, token = generate_user()
    user2, token2 = generate_user()
    generate_user()
    generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user2], [], None)
        group_id = create_group(session, "Testing Group", [user2], [], community).id
        community_id = community.id
        user2_id = user2.id

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
        thread_id = res.thread.thread_id

    with threads_session(token2) as api:
        reply_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=thread_id, content="hi")).thread_id

    with threads_session(token) as api:
        api.PostReply(threads_pb2.PostReplyReq(thread_id=reply_id, content="what a silly comment"))

    process_jobs()

    push_collector.assert_user_has_single_matching(
        user2_id,
        title="dummy title",
    )
