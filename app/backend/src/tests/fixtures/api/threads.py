from contextlib import contextmanager
from typing import cast

import grpc

from couchers.proto import threads_pb2, threads_pb2_grpc
from couchers.servicers.threads import Threads
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _threads_session(token: str):
    channel = FakeChannel(token)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), cast(grpc.Server, channel))
    yield threads_pb2_grpc.ThreadsStub(cast(grpc.Channel, channel))


def get_thread(
    *,
    token: str,
    thread_id: int,
    page_size: int | None = None,
    page_token: str | None = None,
    sort_order: threads_pb2.ThreadSortOrder.ValueType | None = None,
) -> threads_pb2.GetThreadRes:
    with _threads_session(token) as session:
        res: threads_pb2.GetThreadRes = session.GetThread(
            threads_pb2.GetThreadReq(
                thread_id=thread_id, page_size=page_size, page_token=page_token, sort_order=sort_order
            )
        )
    return res


def post_reply(
    *,
    token: str,
    thread_id: int,
    content: str = "Test reply",
    approve_by: Moderator | None = None,
) -> int:
    """Returns the thread id of the newly posted reply."""
    with _threads_session(token) as session:
        res: threads_pb2.PostReplyRes = session.PostReply(
            threads_pb2.PostReplyReq(thread_id=thread_id, content=content)
        )

    if approve_by is not None:
        approve_by.approve_thread_post(res.thread_id)

    return res.thread_id


def update_reply(*, token: str, thread_id: int, content: str) -> threads_pb2.Reply:
    with _threads_session(token) as session:
        reply: threads_pb2.Reply = session.UpdateReply(threads_pb2.UpdateReplyReq(thread_id=thread_id, content=content))
    return reply


def delete_reply(*, token: str, thread_id: int) -> None:
    with _threads_session(token) as session:
        session.DeleteReply(threads_pb2.DeleteReplyReq(thread_id=thread_id))
