import contextlib
import string

import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.models import Thread
from couchers.servicers.threads import Threads, pack_thread_id
from pb import threads_pb2, threads_pb2_grpc
from tests.test_fixtures import db, fake_channel, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextlib.contextmanager
def threads_session(token):
    """
    Create a communities API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), channel)
    yield threads_pb2_grpc.ThreadsStub(channel)


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
        assert ret.replies[0].thread_id == bat_id
        assert ret.replies[0].content == "bat"
        assert ret.replies[0].author_user_id == user1.id
        assert ret.replies[0].num_replies == 0

        assert ret.replies[1].thread_id == cat_id
        assert ret.replies[1].content == "cat"
        assert ret.replies[1].author_user_id == user1.id
        assert ret.replies[1].num_replies == 3

        assert ret.replies[2].thread_id == dog_id
        assert ret.replies[2].content == "dog"
        assert ret.replies[2].author_user_id == user1.id
        assert ret.replies[2].num_replies == 3

        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=cat_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == cats

        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=dog_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == dogs


def test_threads_errors(db):
    user1, token1 = generate_user()
    with threads_session(token1) as api:
        # request non-existing comment
        with pytest.raises(grpc.RpcError) as e:
            api.GetThread(threads_pb2.GetThreadReq(thread_id=11))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.THREAD_NOT_FOUND

        # request non-existing depth digit
        with pytest.raises(grpc.RpcError) as e:
            api.GetThread(threads_pb2.GetThreadReq(thread_id=19))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.THREAD_NOT_FOUND

        # post on non-existing comment
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=11, content="foo"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.THREAD_NOT_FOUND

        # post on non-existing depth
        with pytest.raises(grpc.RpcError) as e:
            api.PostReply(threads_pb2.PostReplyReq(thread_id=19, content="foo"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.THREAD_NOT_FOUND


def pagination_test(api, parent_id):
    # Post some data
    for c in string.ascii_lowercase:
        api.PostReply(threads_pb2.PostReplyReq(thread_id=parent_id, content=c))

    # Get it with pagination
    token = ""
    import textwrap

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
        session.add(Thread(id=1))

    with threads_session(token1) as api:
        comment_id = pagination_test(api, PARENT_THREAD_ID)
        pagination_test(api, comment_id)
