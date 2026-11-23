import string
import textwrap
from typing import Any

import grpc
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import (
    Comment,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationVisibility,
    Reply,
    Thread,
    User,
)
from couchers.models.discussions import CommentVersion, ContentChangeType, ReplyVersion
from couchers.proto import discussions_pb2, moderation_pb2, threads_pb2
from couchers.servicers.threads import pack_thread_id
from couchers.utils import now
from tests.fixtures.api import events as events_api
from tests.fixtures.api import threads as threads_api
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import discussions_session, real_moderation_session
from tests.test_communities import create_community


def test_threads_basic(db):
    user, token = generate_user()

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        dummy_thread = Thread()
        session.add(dummy_thread)
        session.flush()
        PARENT_THREAD_ID = pack_thread_id(database_id=dummy_thread.id, depth=0)

    bat_id = threads_api.post_reply(token=token, thread_id=PARENT_THREAD_ID, content="bat")

    cat_id = threads_api.post_reply(token=token, thread_id=PARENT_THREAD_ID, content="cat")

    dog_id = threads_api.post_reply(token=token, thread_id=PARENT_THREAD_ID, content="dog")

    dogs = [
        threads_api.post_reply(token=token, thread_id=dog_id, content=animal)
        for animal in ["hyena", "wolf", "prariewolf"]
    ]
    cats = [
        threads_api.post_reply(token=token, thread_id=cat_id, content=animal)
        for animal in ["cheetah", "lynx", "panther"]
    ]

    # Make some queries
    ret = threads_api.get_thread(token=token, thread_id=PARENT_THREAD_ID)
    assert len(ret.replies) == 3
    assert ret.next_page_token == ""
    assert ret.replies[0].thread_id == dog_id
    assert ret.replies[0].content == "dog"
    assert ret.replies[0].author_user_id == user.id
    assert ret.replies[0].num_replies == 3

    assert ret.replies[1].thread_id == cat_id
    assert ret.replies[1].content == "cat"
    assert ret.replies[1].author_user_id == user.id
    assert ret.replies[1].num_replies == 3

    assert ret.replies[2].thread_id == bat_id
    assert ret.replies[2].content == "bat"
    assert ret.replies[2].author_user_id == user.id
    assert ret.replies[2].num_replies == 0

    ret = threads_api.get_thread(token=token, thread_id=cat_id)
    assert len(ret.replies) == 3
    assert ret.next_page_token == ""
    assert [reply.thread_id for reply in ret.replies] == cats[::-1]

    ret = threads_api.get_thread(token=token, thread_id=dog_id)
    assert len(ret.replies) == 3
    assert ret.next_page_token == ""
    assert [reply.thread_id for reply in ret.replies] == dogs[::-1]


def test_threads_errors(db):
    user, token = generate_user()
    # request non-existing comment
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Discussion thread not found."):
        threads_api.get_thread(token=token, thread_id=11)

    # request non-existing depth digit
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Discussion thread not found."):
        threads_api.get_thread(token=token, thread_id=19)

    # post on non-existing comment
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Discussion thread not found."):
        threads_api.post_reply(token=token, thread_id=11)

    # post on non-existing depth
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Discussion thread not found."):
        threads_api.post_reply(token=token, thread_id=19)

    # post empty content
    with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT, "You cannot post an empty comment."):
        threads_api.post_reply(token=token, thread_id=19, content="")

    # post whitespace only content
    with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT, "You cannot post an empty comment."):
        threads_api.post_reply(token=token, thread_id=19, content="    ")


def pagination_test(token: str, parent_id: int) -> int:
    # Post some data, oldest "z" to newest "a"
    for c in reversed(string.ascii_lowercase):
        threads_api.post_reply(token=token, thread_id=parent_id, content=c)

    def read_pages(**kwargs: Any) -> tuple[list[str], threads_pb2.GetThreadRes]:
        page_token = ""
        pages = []
        while True:
            ret = threads_api.get_thread(token=token, thread_id=parent_id, page_size=5, page_token=page_token, **kwargs)
            pages.append("".join(x.content for x in ret.replies))
            page_token = ret.next_page_token
            if not page_token:
                return pages, ret

    newest_pages = textwrap.wrap(string.ascii_lowercase, 5)
    oldest_pages = textwrap.wrap(string.ascii_lowercase[::-1], 5)

    # newest first is the default
    pages, ret = read_pages()
    assert pages == newest_pages
    assert read_pages(sort_order=threads_pb2.THREAD_SORT_ORDER_NEWEST_FIRST)[0] == newest_pages
    assert read_pages(sort_order=threads_pb2.THREAD_SORT_ORDER_OLDEST_FIRST)[0] == oldest_pages

    return ret.replies[0].thread_id  # to be used as a test one level deeper


def test_threads_pagination(db):
    user, token = generate_user()

    PARENT_THREAD_ID = 10

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        session.add(Thread())

    comment_id = pagination_test(token, PARENT_THREAD_ID)
    pagination_test(token, comment_id)


def _make_thread_and_comment(token, content="hello"):
    """Helper: create a Thread, post a top-level Comment via the API, return (parent_thread_id, comment_thread_id)."""
    with session_scope() as session:
        thread = Thread()
        session.add(thread)
        session.flush()
        parent_thread_id = pack_thread_id(database_id=thread.id, depth=0)

    comment_thread_id = threads_api.post_reply(token=token, thread_id=parent_thread_id, content=content)

    return parent_thread_id, comment_thread_id


def test_comment_creates_moderation_state(db):
    """Posting a comment creates a ModerationState (shadowed) and an initial-review queue item."""
    user, token = generate_user()
    _, comment_thread_id = _make_thread_and_comment(token)
    comment_db_id = comment_thread_id // 10

    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()

        state = session.execute(
            select(ModerationState).where(ModerationState.id == comment.moderation_state_id)
        ).scalar_one()
        assert state.object_type == ModerationObjectType.comment
        assert state.object_id == comment.id
        assert state.visibility == ModerationVisibility.shadowed

        queue_item = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state.id)
        ).scalar_one()
        assert queue_item.resolved_by_log_id is None


def test_reply_creates_moderation_state(db):
    """Posting a reply to a comment creates its own ModerationState."""
    user, token = generate_user()
    _, comment_thread_id = _make_thread_and_comment(token)

    reply_thread_id = threads_api.post_reply(token=token, thread_id=comment_thread_id)
    reply_db_id = reply_thread_id // 10

    with session_scope() as session:
        reply = session.execute(select(Reply).where(Reply.id == reply_db_id)).scalar_one()

        state = session.execute(
            select(ModerationState).where(ModerationState.id == reply.moderation_state_id)
        ).scalar_one()
        assert state.object_type == ModerationObjectType.reply
        assert state.object_id == reply.id
        assert state.visibility == ModerationVisibility.shadowed


def test_shadowed_comment_visible_to_author_only(db):
    """A shadowed comment is visible to its author but not to other users."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    parent_thread_id, _ = _make_thread_and_comment(author_token, content="secret")

    # Author sees their own shadowed comment
    ret = threads_api.get_thread(token=author_token, thread_id=parent_thread_id)
    assert len(ret.replies) == 1
    assert ret.replies[0].content == "secret"

    # Other user does not see the shadowed comment
    ret = threads_api.get_thread(token=other_token, thread_id=parent_thread_id)
    assert len(ret.replies) == 0


def test_shadowed_reply_visible_to_author_only(db, moderator: Moderator):
    """A shadowed reply is visible to its author but not to other users."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    _, comment_thread_id = _make_thread_and_comment(author_token, content="hi")
    # Approve the comment so the parent comment is visible to others (otherwise they can't see the comment context anyway)
    moderator.approve_thread_post(comment_thread_id)

    threads_api.post_reply(token=author_token, thread_id=comment_thread_id, content="my reply")

    # Author sees their own shadowed reply
    ret = threads_api.get_thread(token=author_token, thread_id=comment_thread_id)
    assert len(ret.replies) == 1
    assert ret.replies[0].content == "my reply"

    # Other user does not see the shadowed reply
    ret = threads_api.get_thread(token=other_token, thread_id=comment_thread_id)
    assert len(ret.replies) == 0


def test_comment_by_invisible_user_hidden(db, moderator: Moderator):
    """A comment by a deleted/banned user is hidden from others even when its moderation state is visible."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="from invisible user")
    moderator.approve_thread_post(comment_thread_id)

    # while the author is visible, the comment shows
    assert len(threads_api.get_thread(token=other_token, thread_id=parent_thread_id).replies) == 1

    # delete the author
    with session_scope() as session:
        session.execute(select(User).where(User.id == author.id)).scalar_one().deleted_at = now()

    # the comment is now hidden from other users
    assert len(threads_api.get_thread(token=other_token, thread_id=parent_thread_id).replies) == 0


def test_reply_by_invisible_user_hidden(db, moderator: Moderator):
    """A reply by a deleted/banned user is hidden from others even when its moderation state is visible."""
    commenter, commenter_token = generate_user()
    replier, replier_token = generate_user()
    viewer, viewer_token = generate_user()

    # comment by a user who stays visible, so the parent comment can still be navigated to
    parent_thread_id, comment_thread_id = _make_thread_and_comment(commenter_token, content="hi")
    moderator.approve_thread_post(comment_thread_id)

    threads_api.post_reply(token=replier_token, thread_id=comment_thread_id, approve_by=moderator)

    # while the replier is visible, the reply shows and is counted on the parent comment
    assert len(threads_api.get_thread(token=viewer_token, thread_id=comment_thread_id).replies) == 1
    parent = threads_api.get_thread(token=viewer_token, thread_id=parent_thread_id)
    assert parent.replies[0].num_replies == 1

    # delete the replier
    with session_scope() as session:
        session.execute(select(User).where(User.id == replier.id)).scalar_one().deleted_at = now()

    # the reply is now hidden from other users and no longer counted on the parent comment
    assert len(threads_api.get_thread(token=viewer_token, thread_id=comment_thread_id).replies) == 0
    parent = threads_api.get_thread(token=viewer_token, thread_id=parent_thread_id)
    assert parent.replies[0].num_replies == 0


def test_admin_can_approve_comment(db):
    """A moderator can approve a comment via ModerateContent and make it visible to other users."""
    author, author_token = generate_user()
    other, other_token = generate_user()
    _moderator, moderator_token = generate_user(is_superuser=True)

    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="approved comment")
    comment_db_id = comment_thread_id // 10

    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()
        state_id = comment.moderation_state_id

    # Other user can't see it yet
    assert len(threads_api.get_thread(token=other_token, thread_id=parent_thread_id).replies) == 0

    # Moderator approves
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Looks good",
            )
        )

    # Now other user sees it
    ret = threads_api.get_thread(token=other_token, thread_id=parent_thread_id)
    assert len(ret.replies) == 1
    assert ret.replies[0].content == "approved comment"


def test_admin_can_hide_comment(db, moderator: Moderator):
    """A moderator can hide an approved comment, removing it from non-author views."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="bad comment")
    moderator.approve_thread_post(comment_thread_id)

    # Other user sees it
    assert len(threads_api.get_thread(token=other_token, thread_id=parent_thread_id).replies) == 1

    moderator.set_thread_post_visibility(comment_thread_id, moderation_pb2.MODERATION_VISIBILITY_HIDDEN)

    # Other user no longer sees it
    assert len(threads_api.get_thread(token=other_token, thread_id=parent_thread_id).replies) == 0
    # Author also no longer sees it (hidden, not shadowed)
    assert len(threads_api.get_thread(token=author_token, thread_id=parent_thread_id).replies) == 0


def test_total_num_responses_excludes_shadowed(db, moderator: Moderator):
    from couchers.context import make_background_user_context  # noqa: PLC0415
    from couchers.servicers.threads import total_num_responses  # noqa: PLC0415

    author, author_token = generate_user()
    viewer, _ = generate_user()
    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="one")
    viewer_context = make_background_user_context(user_id=viewer.id)

    parent_db_id, _ = divmod(parent_thread_id, 10)

    with session_scope() as session:
        assert total_num_responses(session, viewer_context, parent_db_id) == 0

    moderator.approve_thread_post(comment_thread_id)

    with session_scope() as session:
        assert total_num_responses(session, viewer_context, parent_db_id) == 1


def test_total_num_responses_includes_own_shadowed(db):
    """The count uses the viewer's context so authors see their own shadowed content in the total,
    matching what GetThread shows them in the list."""
    from couchers.context import make_background_user_context  # noqa: PLC0415
    from couchers.servicers.threads import total_num_responses  # noqa: PLC0415

    author, author_token = generate_user()
    parent_thread_id, _ = _make_thread_and_comment(author_token, content="one")
    author_context = make_background_user_context(user_id=author.id)

    parent_db_id, _ = divmod(parent_thread_id, 10)

    with session_scope() as session:
        assert total_num_responses(session, author_context, parent_db_id) == 1


def test_total_num_responses_excludes_replies_under_hidden_comment(db, moderator: Moderator):
    """A reply only counts while the comment it hangs off is visible."""
    from couchers.context import make_background_user_context  # noqa: PLC0415
    from couchers.servicers.threads import total_num_responses  # noqa: PLC0415

    author, author_token = generate_user()
    viewer, viewer_token = generate_user()
    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="comment")
    viewer_context = make_background_user_context(user_id=viewer.id)
    parent_db_id, _ = divmod(parent_thread_id, 10)

    reply_thread_id = threads_api.post_reply(token=author_token, thread_id=comment_thread_id)

    moderator.approve_thread_post(comment_thread_id)
    moderator.approve_thread_post(reply_thread_id)

    with session_scope() as session:
        assert total_num_responses(session, viewer_context, parent_db_id) == 2

    moderator.set_thread_post_visibility(comment_thread_id, moderation_pb2.MODERATION_VISIBILITY_HIDDEN)

    assert len(threads_api.get_thread(token=viewer_token, thread_id=parent_thread_id).replies) == 0
    with session_scope() as session:
        assert total_num_responses(session, viewer_context, parent_db_id) == 0


def test_total_num_responses_excludes_replies_under_someone_elses_shadowed_comment(db, moderator: Moderator):
    """A reply's own author doesn't count it while the comment above it is still shadowed to them."""
    from couchers.context import make_background_user_context  # noqa: PLC0415
    from couchers.servicers.threads import total_num_responses  # noqa: PLC0415

    author, author_token = generate_user()
    replier, replier_token = generate_user()
    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="comment")
    replier_context = make_background_user_context(user_id=replier.id)
    parent_db_id, _ = divmod(parent_thread_id, 10)

    threads_api.post_reply(token=replier_token, thread_id=comment_thread_id, approve_by=moderator)

    with session_scope() as session:
        assert total_num_responses(session, replier_context, parent_db_id) == 0

    moderator.approve_thread_post(comment_thread_id)

    with session_scope() as session:
        assert total_num_responses(session, replier_context, parent_db_id) == 2


def test_edit_comment_creates_version_record(db):
    user, token = generate_user()
    parent_thread_id, comment_thread_id = _make_thread_and_comment(token, content="original comment")
    comment_db_id = comment_thread_id // 10

    threads_api.update_reply(token=token, thread_id=comment_thread_id, content="edited comment")

    with session_scope() as session:
        versions = (
            session.execute(select(CommentVersion).where(CommentVersion.comment_id == comment_db_id)).scalars().all()
        )
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.edit
        assert v.old_content == "original comment"
        assert v.new_content == "edited comment"
        assert v.editor_user_id == user.id


def test_delete_comment_creates_version_record(db):
    user, token = generate_user()
    parent_thread_id, comment_thread_id = _make_thread_and_comment(token, content="comment to delete")
    comment_db_id = comment_thread_id // 10

    threads_api.delete_reply(token=token, thread_id=comment_thread_id)

    with session_scope() as session:
        versions = (
            session.execute(select(CommentVersion).where(CommentVersion.comment_id == comment_db_id)).scalars().all()
        )
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.delete
        assert v.old_content == "comment to delete"
        assert v.new_content is None
        assert v.editor_user_id == user.id


def test_edit_reply_creates_version_record(db):
    user, token = generate_user()
    _, comment_thread_id = _make_thread_and_comment(token, content="a comment")

    reply_thread_id = threads_api.post_reply(token=token, thread_id=comment_thread_id, content="original reply")
    reply_db_id = reply_thread_id // 10

    threads_api.update_reply(token=token, thread_id=reply_thread_id, content="edited reply")

    with session_scope() as session:
        versions = session.execute(select(ReplyVersion).where(ReplyVersion.reply_id == reply_db_id)).scalars().all()
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.edit
        assert v.old_content == "original reply"
        assert v.new_content == "edited reply"
        assert v.editor_user_id == user.id


def test_delete_reply_creates_version_record(db):
    user, token = generate_user()
    _, comment_thread_id = _make_thread_and_comment(token, content="a comment")

    reply_thread_id = threads_api.post_reply(token=token, thread_id=comment_thread_id, content="reply to delete")
    reply_db_id = reply_thread_id // 10

    threads_api.delete_reply(token=token, thread_id=reply_thread_id)

    with session_scope() as session:
        versions = session.execute(select(ReplyVersion).where(ReplyVersion.reply_id == reply_db_id)).scalars().all()
        assert len(versions) == 1
        v = versions[0]
        assert v.change_type == ContentChangeType.delete
        assert v.old_content == "reply to delete"
        assert v.new_content is None
        assert v.editor_user_id == user.id


def _create_event_and_get_thread_id(organizer, organizer_token: str) -> int:
    """Helper: create an Event via the API, return its (packed) thread_id."""
    with session_scope() as session:
        create_community(session, 0, 2, "Testing Community", [organizer], [], None)

    res = events_api.create_event(token=organizer_token)
    return int(res.thread.thread_id)


def test_post_reply_incomplete_profile_blocked_on_event_comment(db):
    """An incomplete-profile user cannot post a top-level comment on an event's thread."""
    organizer, organizer_token = generate_user()
    _commenter, commenter_token = generate_user(complete_profile=False)

    event_thread_id = _create_event_and_get_thread_id(organizer, organizer_token)

    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        threads_api.post_reply(token=commenter_token, thread_id=event_thread_id)


def test_post_reply_incomplete_profile_blocked_on_event_reply(db):
    """An incomplete-profile user cannot post a nested reply within an event's thread."""
    organizer, organizer_token = generate_user()
    _commenter, commenter_token = generate_user()
    _replier, replier_token = generate_user(complete_profile=False)

    event_thread_id = _create_event_and_get_thread_id(organizer, organizer_token)

    comment_thread_id = threads_api.post_reply(token=commenter_token, thread_id=event_thread_id)

    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        threads_api.post_reply(token=replier_token, thread_id=comment_thread_id)


def test_post_reply_complete_profile_allowed_on_event_comment(db):
    """A complete-profile user can post a comment on an event's thread."""
    organizer, organizer_token = generate_user()
    _commenter, commenter_token = generate_user()

    event_thread_id = _create_event_and_get_thread_id(organizer, organizer_token)

    comment_thread_id = threads_api.post_reply(token=commenter_token, thread_id=event_thread_id)
    assert comment_thread_id


def test_post_reply_incomplete_profile_blocked_on_discussion_thread(db):
    """An incomplete-profile user cannot post a comment on a discussion thread."""
    admin, admin_token = generate_user()
    _commenter, commenter_token = generate_user(complete_profile=False)

    with session_scope() as session:
        community_id = create_community(session, 0, 1, "Testing Community", [admin], [], None).id

    with discussions_session(admin_token) as api:
        discussion = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="A discussion",
                content="Content",
                owner_community_id=community_id,
            )
        )
        discussion_thread_id = discussion.thread.thread_id

    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        threads_api.post_reply(token=commenter_token, thread_id=discussion_thread_id)


def test_edit_comment_multiple_edits_creates_multiple_version_records(db):
    user, token = generate_user()
    _, comment_thread_id = _make_thread_and_comment(token, content="v1")
    comment_db_id = comment_thread_id // 10

    threads_api.update_reply(token=token, thread_id=comment_thread_id, content="v2")
    threads_api.update_reply(token=token, thread_id=comment_thread_id, content="v3")

    with session_scope() as session:
        versions = (
            session.execute(
                select(CommentVersion).where(CommentVersion.comment_id == comment_db_id).order_by(CommentVersion.id)
            )
            .scalars()
            .all()
        )
        assert len(versions) == 2
        assert versions[0].old_content == "v1"
        assert versions[0].new_content == "v2"
        assert versions[1].old_content == "v2"
        assert versions[1].new_content == "v3"
