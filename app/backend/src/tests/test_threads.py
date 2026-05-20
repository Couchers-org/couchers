import string
import textwrap

import grpc
import pytest
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
from couchers.proto import moderation_pb2, threads_pb2
from couchers.servicers.threads import pack_thread_id
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import real_moderation_session, threads_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_threads_basic(db):
    user1, token1 = generate_user()

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        dummy_thread = Thread()
        session.add(dummy_thread)
        session.flush()
        PARENT_THREAD_ID = pack_thread_id(database_id=dummy_thread.id, depth=0)

    with threads_session(token1) as api:
        bat_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=PARENT_THREAD_ID, content="bat")).thread_id

        cat_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=PARENT_THREAD_ID, content="cat")).thread_id

        dog_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=PARENT_THREAD_ID, content="dog")).thread_id

        dogs = [
            api.PostReply(threads_pb2.PostReplyReq(thread_id=dog_id, content=animal)).thread_id
            for animal in ["hyena", "wolf", "prariewolf"]
        ]
        cats = [
            api.PostReply(threads_pb2.PostReplyReq(thread_id=cat_id, content=animal)).thread_id
            for animal in ["cheetah", "lynx", "panther"]
        ]

        # Make some queries
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=PARENT_THREAD_ID))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert ret.replies[0].thread_id == dog_id
        assert ret.replies[0].content == "dog"
        assert ret.replies[0].author_user_id == user1.id
        assert ret.replies[0].num_replies == 3

        assert ret.replies[1].thread_id == cat_id
        assert ret.replies[1].content == "cat"
        assert ret.replies[1].author_user_id == user1.id
        assert ret.replies[1].num_replies == 3

        assert ret.replies[2].thread_id == bat_id
        assert ret.replies[2].content == "bat"
        assert ret.replies[2].author_user_id == user1.id
        assert ret.replies[2].num_replies == 0

        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=cat_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == cats[::-1]

        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=dog_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == dogs[::-1]


def test_threads_errors(db):
    user1, token1 = generate_user()
    with threads_session(token1) as api:
        # request non-existing comment
        with pytest.raises(grpc.RpcError) as e:
            api.GetThread(threads_pb2.GetThreadReq(thread_id=11))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Discussion thread not found."

        # request non-existing depth digit
        with pytest.raises(grpc.RpcError) as e:
            api.GetThread(threads_pb2.GetThreadReq(thread_id=19))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Discussion thread not found."

        # post on non-existing comment
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=11, content="foo"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Discussion thread not found."

        # post on non-existing depth
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=19, content="foo"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Discussion thread not found."

        # post empty content
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=19, content=""))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "You cannot post an empty comment."

        # post whitespace only content
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=19, content="    "))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "You cannot post an empty comment."


def pagination_test(api, parent_id):
    # Post some data
    for c in reversed(string.ascii_lowercase):
        api.PostReply(threads_pb2.PostReplyReq(thread_id=parent_id, content=c))

    # Get it with pagination
    token = ""

    for expected_page in textwrap.wrap(string.ascii_lowercase, 5):
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_id, page_size=5, page_token=token))
        assert "".join(x.content for x in ret.replies) == expected_page
        token = ret.next_page_token

    assert token == ""

    return ret.replies[0].thread_id  # to be used as a test one level deeper


def test_threads_pagination(db):
    user1, token1 = generate_user()

    PARENT_THREAD_ID = 10

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        session.add(Thread())

    with threads_session(token1) as api:
        comment_id = pagination_test(api, PARENT_THREAD_ID)
        pagination_test(api, comment_id)


def _make_thread_and_comment(token, content="hello"):
    """Helper: create a Thread, post a top-level Comment via the API, return (parent_thread_id, comment_thread_id)."""
    with session_scope() as session:
        thread = Thread()
        session.add(thread)
        session.flush()
        parent_thread_id = pack_thread_id(database_id=thread.id, depth=0)

    with threads_session(token) as api:
        comment_thread_id = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=parent_thread_id, content=content)
        ).thread_id

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

    with threads_session(token) as api:
        reply_thread_id = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="reply text")
        ).thread_id
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
    with threads_session(author_token) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id))
        assert len(ret.replies) == 1
        assert ret.replies[0].content == "secret"

    # Other user does not see the shadowed comment
    with threads_session(other_token) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id))
        assert len(ret.replies) == 0


def test_shadowed_reply_visible_to_author_only(db):
    """A shadowed reply is visible to its author but not to other users."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    _, comment_thread_id = _make_thread_and_comment(author_token, content="hi")
    # Approve the comment so the parent comment is visible to others (otherwise they can't see the comment context anyway)
    comment_db_id = comment_thread_id // 10
    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()
        state = session.execute(
            select(ModerationState).where(ModerationState.id == comment.moderation_state_id)
        ).scalar_one()
        state.visibility = ModerationVisibility.visible

    with threads_session(author_token) as api:
        api.PostReply(threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="my reply"))

    # Author sees their own shadowed reply
    with threads_session(author_token) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=comment_thread_id))
        assert len(ret.replies) == 1
        assert ret.replies[0].content == "my reply"

    # Other user does not see the shadowed reply
    with threads_session(other_token) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=comment_thread_id))
        assert len(ret.replies) == 0


def _approve(session, moderation_state_id):
    session.execute(
        select(ModerationState).where(ModerationState.id == moderation_state_id)
    ).scalar_one().visibility = ModerationVisibility.visible


def test_comment_by_invisible_user_hidden(db):
    """A comment by a deleted/banned user is hidden from others even when its moderation state is visible."""
    author, author_token = generate_user()
    other, other_token = generate_user()

    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="from invisible user")
    comment_db_id = comment_thread_id // 10

    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()
        _approve(session, comment.moderation_state_id)

    # while the author is visible, the comment shows
    with threads_session(other_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 1

    # delete the author
    with session_scope() as session:
        session.execute(select(User).where(User.id == author.id)).scalar_one().deleted_at = now()

    # the comment is now hidden from other users
    with threads_session(other_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 0


def test_reply_by_invisible_user_hidden(db):
    """A reply by a deleted/banned user is hidden from others even when its moderation state is visible."""
    commenter, commenter_token = generate_user()
    replier, replier_token = generate_user()
    viewer, viewer_token = generate_user()

    # comment by a user who stays visible, so the parent comment can still be navigated to
    parent_thread_id, comment_thread_id = _make_thread_and_comment(commenter_token, content="hi")
    comment_db_id = comment_thread_id // 10
    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()
        _approve(session, comment.moderation_state_id)

    with threads_session(replier_token) as api:
        reply_thread_id = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="my reply")
        ).thread_id
    reply_db_id = reply_thread_id // 10
    with session_scope() as session:
        reply = session.execute(select(Reply).where(Reply.id == reply_db_id)).scalar_one()
        _approve(session, reply.moderation_state_id)

    # while the replier is visible, the reply shows and is counted on the parent comment
    with threads_session(viewer_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=comment_thread_id)).replies) == 1
        parent = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id))
        assert parent.replies[0].num_replies == 1

    # delete the replier
    with session_scope() as session:
        session.execute(select(User).where(User.id == replier.id)).scalar_one().deleted_at = now()

    # the reply is now hidden from other users and no longer counted on the parent comment
    with threads_session(viewer_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=comment_thread_id)).replies) == 0
        parent = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id))
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
    with threads_session(other_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 0

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
    with threads_session(other_token) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id))
        assert len(ret.replies) == 1
        assert ret.replies[0].content == "approved comment"


def test_admin_can_hide_comment(db):
    """A moderator can hide an approved comment, removing it from non-author views."""
    author, author_token = generate_user()
    other, other_token = generate_user()
    _moderator, moderator_token = generate_user(is_superuser=True)

    parent_thread_id, comment_thread_id = _make_thread_and_comment(author_token, content="bad comment")
    comment_db_id = comment_thread_id // 10

    with session_scope() as session:
        comment = session.execute(select(Comment).where(Comment.id == comment_db_id)).scalar_one()
        state_id = comment.moderation_state_id
        # Pretend the comment was previously approved
        state = session.execute(select(ModerationState).where(ModerationState.id == state_id)).scalar_one()
        state.visibility = ModerationVisibility.visible

    # Other user sees it
    with threads_session(other_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 1

    # Moderator hides it
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Inappropriate",
            )
        )

    # Other user no longer sees it
    with threads_session(other_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 0
    # Author also no longer sees it (hidden, not shadowed)
    with threads_session(author_token) as api:
        assert len(api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_thread_id)).replies) == 0


def test_total_num_responses_excludes_shadowed(db):
    from couchers.context import make_background_user_context  # noqa: PLC0415
    from couchers.servicers.threads import total_num_responses  # noqa: PLC0415

    author, author_token = generate_user()
    viewer, _ = generate_user()
    parent_thread_id, _ = _make_thread_and_comment(author_token, content="one")
    viewer_context = make_background_user_context(user_id=viewer.id)

    parent_db_id, _ = divmod(parent_thread_id, 10)

    with session_scope() as session:
        assert total_num_responses(session, viewer_context, parent_db_id) == 0

    with session_scope() as session:
        state = session.execute(
            select(ModerationState).where(
                ModerationState.object_type == ModerationObjectType.comment,
                ModerationState.object_id == session.execute(select(Comment.id)).scalar_one(),
            )
        ).scalar_one()
        state.visibility = ModerationVisibility.visible

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
