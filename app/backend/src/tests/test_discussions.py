import grpc
import pytest

from couchers.db import session_scope
from couchers.proto import discussions_pb2, notifications_pb2, threads_pb2
from couchers.utils import now, to_aware_datetime
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator, PushCollector, process_jobs
from tests.fixtures.sessions import discussions_session, notifications_session, threads_session
from tests.test_communities import create_community, create_group


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
        assert e.value.details() == "Missing discussion title."

    with discussions_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title="dummy title",
                    content=None,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Missing discussion content."


def test_create_and_get_discussion(db, push_collector: PushCollector):
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

    push = push_collector.pop_for_user(user2_id, last=True)
    assert push.content.title == "New discussion: dummy title"
    assert push.content.ios_title == "New Discussion"
    assert push.content.ios_subtitle == "dummy title"
    assert push.content.body == f"{user.name} started the discussion in Testing Community."

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


def test_discussion_notifications_regression(db, push_collector: PushCollector, moderator: Moderator):
    generate_user()
    user, token = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
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
        comment_thread_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=thread_id, content="comment")).thread_id
    moderator.approve_thread_post(comment_thread_id)

    with threads_session(token3) as api:
        reply_thread_id_a = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="reply to comment")
        ).thread_id
    moderator.approve_thread_post(reply_thread_id_a)

    with threads_session(token) as api:
        reply_thread_id_b = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="reply to reply to comment")
        ).thread_id
    moderator.approve_thread_post(reply_thread_id_b)

    process_jobs()

    # User2 should get 2 notifications about 2 replies to their comment, User3 should get 1 notification about 1 reply
    push = push_collector.pop_for_user(user2_id, last=False)
    assert push.content.title == f"{user3.name} • dummy title"
    assert push.topic_action == "thread:reply"

    push = push_collector.pop_for_user(user2_id, last=True)
    assert push.content.title == f"{user.name} • dummy title"
    assert push.topic_action == "thread:reply"

    push = push_collector.pop_for_user(user3.id, last=True)
    assert push.content.title == f"{user.name} • dummy title"
    assert push.topic_action == "thread:reply"
