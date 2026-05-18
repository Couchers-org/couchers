import grpc
import pytest
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import ModerationObjectType, ModerationState, ModerationVisibility
from couchers.proto import communities_pb2, discussions_pb2, moderation_pb2, notifications_pb2, threads_pb2
from couchers.utils import now, to_aware_datetime
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator, PushCollector, process_jobs
from tests.fixtures.sessions import (
    communities_session,
    discussions_session,
    notifications_session,
    real_moderation_session,
    threads_session,
)
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


def test_create_and_get_discussion(db, push_collector: PushCollector, moderator: Moderator):
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

    moderator.approve_discussion(discussion_id)
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


def test_create_discussion_creates_moderation_state(db):
    user, token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="t",
                content="c",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    with session_scope() as session:
        state = session.execute(
            select(ModerationState)
            .where(ModerationState.object_type == ModerationObjectType.discussion)
            .where(ModerationState.object_id == discussion_id)
        ).scalar_one()
        assert state.visibility == ModerationVisibility.shadowed


def test_shadowed_discussion_visible_to_author_only(db):
    author, author_token = generate_user()
    _, other_token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [author], [], None)
        community_id = community.id

    with discussions_session(author_token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="secret",
                content="secret content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    # Author can read their own shadowed discussion
    with discussions_session(author_token) as api:
        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.title == "secret"

    # Other user cannot
    with discussions_session(other_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_shadowed_discussion_excluded_from_listings(db):
    author, author_token = generate_user()
    other, other_token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [author, other], [], None)
        community_id = community.id

    with discussions_session(author_token) as api:
        api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="hidden-from-listings",
                content="c",
                owner_community_id=community_id,
            )
        )

    # Other user does not see the shadowed discussion in listings
    with communities_session(other_token) as api:
        res = api.ListDiscussions(communities_pb2.ListDiscussionsReq(community_id=community_id))
        assert [d.title for d in res.discussions] == []


def test_approved_discussion_visible_to_others(db, moderator: Moderator):
    author, author_token = generate_user()
    _, other_token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [author], [], None)
        community_id = community.id

    with discussions_session(author_token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="hello",
                content="world",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    moderator.approve_discussion(discussion_id)

    with discussions_session(other_token) as api:
        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.title == "hello"


def test_hidden_discussion_filtered_for_author_too(db, moderator: Moderator):
    """Once admin hides a discussion, even the author cannot read it."""
    author, author_token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [author], [], None)
        community_id = community.id

    with discussions_session(author_token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="bad",
                content="c",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    # Hide via moderator (visibility=hidden, not visible)
    with real_moderation_session(moderator.token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_DISCUSSION,
                object_id=discussion_id,
            )
        )
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_res.moderation_state.moderation_state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="bad content",
            )
        )

    with discussions_session(author_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_list_my_communities_discussions_respects_moderation(db, moderator: Moderator):
    """A shadowed discussion is hidden from other community members until approved."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [author, other], [], None)
        community_id = community.id

    with discussions_session(author_token) as api:
        discussion_id = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="hello",
                content="world",
                owner_community_id=community_id,
            )
        ).discussion_id

    # Author sees their own shadowed discussion
    with discussions_session(author_token) as api:
        res = api.ListMyCommunitiesDiscussions(discussions_pb2.ListMyCommunitiesDiscussionsReq())
        assert [d.title for d in res.discussions] == ["hello"]

    # Other members do not see the shadowed discussion
    with discussions_session(other_token) as api:
        res = api.ListMyCommunitiesDiscussions(discussions_pb2.ListMyCommunitiesDiscussionsReq())
        assert [d.title for d in res.discussions] == []

    moderator.approve_discussion(discussion_id)

    # Once approved, it shows up for other members too
    with discussions_session(other_token) as api:
        res = api.ListMyCommunitiesDiscussions(discussions_pb2.ListMyCommunitiesDiscussionsReq())
        assert [d.title for d in res.discussions] == ["hello"]
