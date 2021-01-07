from datetime import date, timedelta
import contextlib
import string

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import and_

from couchers import errors
from couchers.db import session_scope
from couchers.utils import now
from pb import threads_pb2_grpc, threads_pb2
from tests.test_fixtures import api_session, db, generate_user, testconfig, fake_channel
from couchers.servicers.threads import Threads
from couchers.models import Thread


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
    user2, token2 = generate_user()

    PARENT_THREAD_ID = 10

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        session.add(Thread(id=1, title="foo"))

    with threads_session(token1) as api:
        bat_id = api.PostReply(threads_pb2.PostReplyReq(
            thread_id=PARENT_THREAD_ID,
            content="bat")).thread_id

        cat_id = api.PostReply(threads_pb2.PostReplyReq(
            thread_id=PARENT_THREAD_ID,
            content="cat")).thread_id

        dog_id = api.PostReply(threads_pb2.PostReplyReq(
            thread_id=PARENT_THREAD_ID,
            content="dog")).thread_id

        dogs = [api.PostReply(threads_pb2.PostReplyReq(
            thread_id=dog_id,
            content=animal)).thread_id for animal in
                ["hyena", "wolf", "prariewolf"]]
        cats = [api.PostReply(threads_pb2.PostReplyReq(
            thread_id=cat_id,
            content=animal)).thread_id for animal in
                ["cheetah", "lynx", "panther"]]

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


def pagination_test(api, parent_id):
    # Post some data
    for c in string.ascii_lowercase:
        api.PostReply(threads_pb2.PostReplyReq(
            thread_id=parent_id,
            content=c))

    # Get it with pagination
    token = ""
    accumulator = []
    while True:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=parent_id,
                                                     page_size=5,
                                                     page_token=token))
        assert 0 < len(ret.replies) <= 5
        accumulator += [x.content for x in ret.replies]
        assert len(accumulator) <= len(string.ascii_lowercase)
        if len(accumulator) == len(string.ascii_lowercase):
            assert ret.next_page_token == ""
            break
        assert ret.next_page_token != ""
        assert len(ret.replies) == 5
        token = ret.next_page_token

    assert ''.join(reversed(accumulator)) == string.ascii_lowercase

    return ret.replies[0].thread_id   # to be used as a test one level deeper


def test_threads_pagination(db):
    user1, token1 = generate_user()

    PARENT_THREAD_ID = 10

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        session.add(Thread(id=1, title="foo"))

    with threads_session(token1) as api:
        comment_id = pagination_test(api, PARENT_THREAD_ID)
        pagination_test(api, comment_id)
