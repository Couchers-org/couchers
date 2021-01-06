from datetime import date, timedelta
import contextlib

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import and_

from couchers import errors
from couchers.db import session_scope
from couchers.utils import now
from pb import communities_pb2_grpc, communities_pb2
from tests.test_fixtures import api_session, db, generate_user, testconfig, fake_channel
from couchers.servicers.threads import Communities
from couchers.models import Thread


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextlib.contextmanager
def communities_session(token):
    """
    Create a communities API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), channel)
    yield communities_pb2_grpc.CommunitiesStub(channel)


def test_threads_basic(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    PARENT_THREAD_ID = 10

    # Create a dummy Thread (should be replaced by pages later on)
    with session_scope() as session:
        session.add(Thread(id=1, title="foo"))

    with communities_session(token1) as api:
        cat_id = api.PostReply(communities_pb2.PostReplyReq(
            thread_id=PARENT_THREAD_ID,
            content="cat")).thread_id

        dog_id = api.PostReply(communities_pb2.PostReplyReq(
            thread_id=PARENT_THREAD_ID,
            content="dog")).thread_id

        dogs = [api.PostReply(communities_pb2.PostReplyReq(
            thread_id=dog_id,
            content=animal)).thread_id for animal in
                ["hyena", "wolf", "prariewolf"]]
        cats = [api.PostReply(communities_pb2.PostReplyReq(
            thread_id=cat_id,
            content=animal)).thread_id for animal in
                ["cheetah", "lynx", "panther"]]

        # Make some queries
        ret = api.GetThread(communities_pb2.GetThreadReq(thread_id=PARENT_THREAD_ID))
        assert len(ret.replies) == 2
        assert ret.next_page_token == ""
        assert ret.replies[0].thread_id == dog_id
        assert ret.replies[0].content == "dog"
        assert ret.replies[0].author_user_id == user1.id
        assert ret.replies[0].num_replies == 3

        assert ret.replies[1].thread_id == cat_id
        assert ret.replies[1].content == "cat"
        assert ret.replies[1].author_user_id == user1.id
        assert ret.replies[1].num_replies == 3

        ret = api.GetThread(communities_pb2.GetThreadReq(thread_id=cat_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == cats[::-1]

        ret = api.GetThread(communities_pb2.GetThreadReq(thread_id=dog_id))
        assert len(ret.replies) == 3
        assert ret.next_page_token == ""
        assert [reply.thread_id for reply in ret.replies] == dogs[::-1]
