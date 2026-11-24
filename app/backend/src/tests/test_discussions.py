import grpc
from google.protobuf.wrappers_pb2 import StringValue
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import ModerationObjectType, ModerationState, ModerationVisibility
from couchers.models.discussions import ContentChangeType, DiscussionVersion
from couchers.proto import admin_pb2, communities_pb2, discussions_pb2, moderation_pb2, notifications_pb2
from couchers.utils import now, to_aware_datetime
from tests.fixtures.api import notifications as notifications_api
from tests.fixtures.api import threads as threads_api
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator, PushCollector, process_jobs
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import (
    communities_session,
    discussions_session,
    real_admin_session,
    real_moderation_session,
)
from tests.test_communities import create_community, create_group


def test_create_discussion_errors(db):
    user, token = generate_user()
    with discussions_session(token) as api:
        with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT, "Missing discussion title."):
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title=None,
                    content="dummy content",
                )
            )

    with discussions_session(token) as api:
        with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT, "Missing discussion content."):
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title="dummy title",
                    content=None,
                )
            )


def test_create_and_get_discussion(db, frozen_timewarp, push_collector: PushCollector, moderator: Moderator):
    generate_user()
    creator_user, creator_token = generate_user()
    admin_user, admin_token = generate_user()
    generate_user()
    generate_user()

    notifications_api.set_notification_settings(
        token=admin_token,
        preferences=[
            notifications_pb2.SingleNotificationPreference(
                topic="discussion",
                action="create",
                delivery_method="push",
                enabled=True,
            )
        ],
    )

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [admin_user], [], None)
        group_id = create_group(session, "Testing Group", [admin_user], [], community).id
        community_id = community.id
        admin_user_id = admin_user.id

    with discussions_session(creator_token) as api:
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
        assert res.creator_user_id == creator_user.id
        assert res.owner_community_id == community_id

        discussion_id = res.discussion_id

    moderator.approve_discussion(discussion_id)
    process_jobs()

    push = push_collector.pop_for_user(admin_user_id, last=True)
    assert push.content.title == "New discussion: dummy title"
    assert push.content.ios_title == "New Discussion"
    assert push.content.ios_subtitle == "dummy title"
    assert push.content.body == f"{creator_user.name} started the discussion in Testing Community."

    with discussions_session(creator_token) as api:
        res = api.GetDiscussion(
            discussions_pb2.GetDiscussionReq(
                discussion_id=discussion_id,
            )
        )

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == creator_user.id
        assert res.owner_community_id == community_id

    with discussions_session(creator_token) as api:
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
        assert res.creator_user_id == creator_user.id
        assert res.owner_group_id == group_id

        discussion_id = res.discussion_id

    with discussions_session(creator_token) as api:
        res = api.GetDiscussion(
            discussions_pb2.GetDiscussionReq(
                discussion_id=discussion_id,
            )
        )

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert time_before_create <= to_aware_datetime(res.created) <= time_after_create
        assert res.creator_user_id == creator_user.id
        assert res.owner_group_id == group_id


def test_update_discussion(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Original title",
                content="Original content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id
        assert res.can_edit

    with discussions_session(token) as api:
        res = api.UpdateDiscussion(
            discussions_pb2.UpdateDiscussionReq(
                discussion_id=discussion_id,
                title=StringValue(value="Updated title"),
                content=StringValue(value="Updated content"),
            )
        )
        assert res.title == "Updated title"
        assert res.content == "Updated content"
        assert res.can_edit
        assert res.last_edited is not None

    with discussions_session(token) as api:
        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.title == "Updated title"
        assert res.content == "Updated content"
        assert res.last_edited is not None
        assert res.can_edit


def test_update_discussion_permission_denied(db):
    user, token = generate_user()
    other_user, other_token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [other_user], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Original title",
                content="Original content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    with discussions_session(other_token) as api:
        with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED, "You are not allowed to edit this discussion."):
            api.UpdateDiscussion(
                discussions_pb2.UpdateDiscussionReq(
                    discussion_id=discussion_id,
                )
            )


def test_update_deleted_discussion(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Original title",
                content="Original content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id
        api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))

    with discussions_session(token) as api:
        with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "This discussion has been deleted."):
            api.UpdateDiscussion(discussions_pb2.UpdateDiscussionReq(discussion_id=discussion_id))


def test_delete_discussion_by_creator(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="To be deleted",
                content="Some content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

        api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))

        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.deleted
        assert res.title == ""
        assert res.content == ""
        assert res.creator_user_id == 0
        assert res.thread.thread_id != 0


def test_delete_discussion_permission_denied_for_non_creator(db):
    creator, creator_token = generate_user()
    community_admin, community_admin_token = generate_user()
    random_user, random_token = generate_user()
    with session_scope() as session:
        community = create_community(
            session, 0, 1, "Testing Community", [community_admin], [creator, random_user], None
        )
        community_id = community.id

    with discussions_session(creator_token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Only creator can delete",
                content="Some content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id
        assert res.can_edit

    with discussions_session(random_token) as api:
        with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
            api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))

    with discussions_session(community_admin_token) as api:
        with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
            api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))


def test_deleted_discussion_not_in_list(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Visible discussion",
                content="Content",
                owner_community_id=community_id,
            )
        )
        visible_id = res.discussion_id

        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Deleted discussion",
                content="Content",
                owner_community_id=community_id,
            )
        )
        deleted_id = res.discussion_id
        api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=deleted_id))

    with communities_session(token) as api:
        res = api.ListDiscussions(communities_pb2.ListDiscussionsReq(community_id=community_id))
        ids = [d.discussion_id for d in res.discussions]
        assert visible_id in ids
        assert deleted_id not in ids


def test_deleted_discussion_thread_still_accessible(db, moderator: Moderator):
    user, token = generate_user()
    commenter, commenter_token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [commenter], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Discussion with comments",
                content="Content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id
        thread_id = res.thread.thread_id

    process_jobs()

    threads_api.post_reply(token=commenter_token, thread_id=thread_id, approve_by=moderator)

    with discussions_session(token) as api:
        api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))
        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.deleted
        assert res.thread.num_responses == 1

    res = threads_api.get_thread(token=token, thread_id=thread_id)
    assert len(res.replies) == 1


def test_delete_comment_shows_placeholder_with_replies(db, moderator: Moderator):
    """Deleting a top-level comment that has nested replies should show a deleted
    placeholder so the replies remain visible."""
    user, token = generate_user()
    commenter, commenter_token = generate_user()
    replier, replier_token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [commenter, replier], None)
        community_id = community.id

    with discussions_session(token) as api:
        discussion = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="A discussion",
                content="Content",
                owner_community_id=community_id,
            )
        )
        discussion_id = discussion.discussion_id
        thread_id = discussion.thread.thread_id

    # commenter adds a top-level comment
    comment_thread_id = threads_api.post_reply(token=commenter_token, thread_id=thread_id, approve_by=moderator)

    # replier adds two nested replies
    threads_api.post_reply(token=replier_token, thread_id=comment_thread_id, approve_by=moderator)
    threads_api.post_reply(token=replier_token, thread_id=comment_thread_id, approve_by=moderator)

    # commenter deletes their top-level comment
    threads_api.delete_reply(token=commenter_token, thread_id=comment_thread_id)

    # the top-level comment appears as a deleted placeholder (has replies), replies still visible
    thread_res = threads_api.get_thread(token=token, thread_id=thread_id)
    assert len(thread_res.replies) == 1
    placeholder = thread_res.replies[0]
    assert placeholder.deleted
    assert placeholder.content == ""
    assert placeholder.author_user_id == 0

    nested = threads_api.get_thread(token=token, thread_id=placeholder.thread_id)
    assert len(nested.replies) == 2

    # num_responses counts the 2 visible nested replies (not the deleted top-level)
    with discussions_session(token) as api:
        disc = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert disc.thread.num_responses == 2


def test_admin_delete_discussion(db):
    user, token = generate_user()
    admin, admin_token = generate_user(is_superuser=True)
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Admin will delete this",
                content="Content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    with real_admin_session(admin_token) as api:
        api.DeleteDiscussion(admin_pb2.AdminDeleteDiscussionReq(discussion_id=discussion_id))

    with discussions_session(token) as api:
        res = api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))
        assert res.deleted


def test_discussion_notifications_regression(db, push_collector: PushCollector, moderator: Moderator):
    generate_user()
    creator_user, creator_token = generate_user()
    commenter_user, commenter_token = generate_user()
    replier_user, replier_token = generate_user()
    generate_user()
    generate_user()

    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [commenter_user], [], None)
        group_id = create_group(session, "Testing Group", [commenter_user], [], community).id
        community_id = community.id
        commenter_user_id = commenter_user.id

    with discussions_session(creator_token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="dummy title",
                content="dummy content",
                owner_community_id=community_id,
            )
        )

        assert res.title == "dummy title"
        assert res.content == "dummy content"
        assert res.slug == "dummy-title"
        assert res.creator_user_id == creator_user.id
        assert res.owner_community_id == community_id

        discussion_id = res.discussion_id
        thread_id = res.thread.thread_id

    comment_thread_id = threads_api.post_reply(token=commenter_token, thread_id=thread_id, approve_by=moderator)

    threads_api.post_reply(token=replier_token, thread_id=comment_thread_id, approve_by=moderator)

    threads_api.post_reply(token=creator_token, thread_id=comment_thread_id, approve_by=moderator)

    process_jobs()

    # The commenter should get 2 notifications about 2 replies to their comment, the replier should get 1 notification about 1 reply
    push = push_collector.pop_for_user(commenter_user_id, last=False)
    assert push.content.title == f"{replier_user.name} • dummy title"
    assert push.topic_action == "thread:reply"

    push = push_collector.pop_for_user(commenter_user_id, last=True)
    assert push.content.title == f"{creator_user.name} • dummy title"
    assert push.topic_action == "thread:reply"

    push = push_collector.pop_for_user(replier_user.id, last=True)
    assert push.content.title == f"{creator_user.name} • dummy title"
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
        with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
            api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))


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
        with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
            api.GetDiscussion(discussions_pb2.GetDiscussionReq(discussion_id=discussion_id))


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


def test_update_discussion_creates_version_record(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        res = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Original title",
                content="Original content",
                owner_community_id=community_id,
            )
        )
        discussion_id = res.discussion_id

    with discussions_session(token) as api:
        api.UpdateDiscussion(
            discussions_pb2.UpdateDiscussionReq(
                discussion_id=discussion_id,
                title=StringValue(value="Updated title"),
                content=StringValue(value="Updated content"),
            )
        )

    with session_scope() as session:
        versions = (
            session.execute(select(DiscussionVersion).where(DiscussionVersion.discussion_id == discussion_id))
            .scalars()
            .all()
        )
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.edit
        assert v.old_title == "Original title"
        assert v.new_title == "Updated title"
        assert v.old_content == "Original content"
        assert v.new_content == "Updated content"
        assert v.editor_user_id == user.id


def test_update_discussion_multiple_edits_creates_multiple_version_records(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        discussion_id = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="v1 title",
                content="v1 content",
                owner_community_id=community_id,
            )
        ).discussion_id

    with discussions_session(token) as api:
        api.UpdateDiscussion(
            discussions_pb2.UpdateDiscussionReq(
                discussion_id=discussion_id,
                title=StringValue(value="v2 title"),
                content=StringValue(value="v2 content"),
            )
        )

    with discussions_session(token) as api:
        api.UpdateDiscussion(
            discussions_pb2.UpdateDiscussionReq(
                discussion_id=discussion_id,
                title=StringValue(value="v3 title"),
                content=StringValue(value="v3 content"),
            )
        )

    with session_scope() as session:
        versions = (
            session.execute(
                select(DiscussionVersion)
                .where(DiscussionVersion.discussion_id == discussion_id)
                .order_by(DiscussionVersion.id)
            )
            .scalars()
            .all()
        )
        assert len(versions) == 2
        assert versions[0].old_title == "v1 title"
        assert versions[0].new_title == "v2 title"
        assert versions[1].old_title == "v2 title"
        assert versions[1].new_title == "v3 title"


def test_delete_discussion_creates_version_record(db):
    user, token = generate_user()
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        discussion_id = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="To be deleted",
                content="Some content",
                owner_community_id=community_id,
            )
        ).discussion_id
        api.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))

    with session_scope() as session:
        versions = (
            session.execute(select(DiscussionVersion).where(DiscussionVersion.discussion_id == discussion_id))
            .scalars()
            .all()
        )
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.delete
        assert v.old_title == "To be deleted"
        assert v.new_title is None
        assert v.old_content == "Some content"
        assert v.new_content is None
        assert v.editor_user_id == user.id


def test_admin_delete_discussion_creates_version_record(db):
    user, token = generate_user()
    admin, admin_token = generate_user(is_superuser=True)
    with session_scope() as session:
        community = create_community(session, 0, 1, "Testing Community", [user], [], None)
        community_id = community.id

    with discussions_session(token) as api:
        discussion_id = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="Admin will delete this",
                content="Some content",
                owner_community_id=community_id,
            )
        ).discussion_id

    with real_admin_session(admin_token) as api:
        api.DeleteDiscussion(admin_pb2.AdminDeleteDiscussionReq(discussion_id=discussion_id))

    with session_scope() as session:
        versions = (
            session.execute(select(DiscussionVersion).where(DiscussionVersion.discussion_id == discussion_id))
            .scalars()
            .all()
        )
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.delete
        assert v.old_title == "Admin will delete this"
        assert v.new_title is None
        assert v.editor_user_id == admin.id


def test_create_discussion_incomplete_profile(db):
    user, token = generate_user(complete_profile=False)
    admin_user, admin_token = generate_user()

    with session_scope() as session:
        community_id = create_community(session, 0, 1, "Testing Community", [admin_user], [], None).id

    with discussions_session(token) as api:
        with expect_rpc_error(
            grpc.StatusCode.FAILED_PRECONDITION,
            "You have to complete your profile before you can start a discussion.",
        ):
            api.CreateDiscussion(
                discussions_pb2.CreateDiscussionReq(
                    title="dummy title",
                    content="dummy content",
                    owner_community_id=community_id,
                )
            )
