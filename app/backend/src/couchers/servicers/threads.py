import logging

import grpc
import sqlalchemy.exc
from sqlalchemy.sql import func

from couchers import errors
from couchers.sql import couchers_select as select
from couchers.db import session_scope
from couchers.models import Comment, Reply, Thread
from couchers.utils import Timestamp_from_datetime
from proto import threads_pb2, threads_pb2_grpc

logger = logging.getLogger(__name__)

# Since the API exposes a single ID space regardless of nesting level,
# we construct the API id by appending the nesting level to the
# database ID.


def pack_thread_id(database_id: int, depth: int) -> int:
    return database_id * 10 + depth


def unpack_thread_id(thread_id: int) -> (int, int):
    """Returns (database_id, depth) tuple."""
    return divmod(thread_id, 10)


def total_num_responses(database_id):
    """Return the total number of comments and replies to the thread with
    database id database_id.
    """
    with session_scope() as session:
        return (
            session.execute(
                select(func.count()).select_from(Comment).filter(Comment.thread_id == database_id)
            ).scalar_one()
            + session.execute(
                select(func.count())
                .select_from(Reply)
                .join(Comment, Comment.id == Reply.comment_id)
                .filter(Comment.thread_id == database_id)
            ).scalar_one()
        )


def thread_to_pb(database_id):
    return threads_pb2.Thread(
        thread_id=pack_thread_id(database_id, 0),
        num_responses=total_num_responses(database_id),
    )


class Threads(threads_pb2_grpc.ThreadsServicer):
    def GetThread(self, request, context):
        database_id, depth = unpack_thread_id(request.thread_id)
        page_size = request.page_size if 0 < request.page_size < 100000 else 1000
        page_start = unpack_thread_id(int(request.page_token))[0] if request.page_token else 2 ** 50

        with session_scope() as session:
            if depth == 0:
                if not session.execute(select(Thread).filter(Thread.id == database_id)).scalar_one_or_none():
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.THREAD_NOT_FOUND)

                res = session.execute(
                    select(Comment, func.count(Reply.id))
                    .outerjoin(Reply, Reply.comment_id == Comment.id)
                    .filter(Comment.thread_id == database_id)
                    .filter(Comment.id < page_start)
                    .group_by(Comment.id)
                    .order_by(Comment.created.desc())
                    .limit(page_size + 1)
                ).all()
                replies = [
                    threads_pb2.Reply(
                        thread_id=pack_thread_id(r.id, 1),
                        content=r.content,
                        author_user_id=r.author_user_id,
                        created_time=Timestamp_from_datetime(r.created),
                        num_replies=n,
                    )
                    for r, n in res[:page_size]
                ]

            elif depth == 1:
                if not session.execute(select(Comment).filter(Comment.id == database_id)).scalar_one_or_none():
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.THREAD_NOT_FOUND)

                res = (
                    session.execute(
                        select(Reply)
                        .filter(Reply.comment_id == database_id)
                        .filter(Reply.id < page_start)
                        .order_by(Reply.created.desc())
                        .limit(page_size + 1)
                    )
                    .scalars()
                    .all()
                )
                replies = [
                    threads_pb2.Reply(
                        thread_id=pack_thread_id(r.id, 2),
                        content=r.content,
                        author_user_id=r.author_user_id,
                        created_time=Timestamp_from_datetime(r.created),
                        num_replies=0,
                    )
                    for r in res[:page_size]
                ]

            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.THREAD_NOT_FOUND)

            if len(res) > page_size:
                # There's more!
                next_page_token = str(replies[-1].thread_id)
            else:
                next_page_token = ""

        return threads_pb2.GetThreadRes(replies=replies, next_page_token=next_page_token)

    def PostReply(self, request, context):
        with session_scope() as session:
            database_id, depth = unpack_thread_id(request.thread_id)
            if depth == 0:
                object_to_add = Comment(thread_id=database_id, author_user_id=context.user_id, content=request.content)
            elif depth == 1:
                object_to_add = Reply(comment_id=database_id, author_user_id=context.user_id, content=request.content)
            else:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.THREAD_NOT_FOUND)
            session.add(object_to_add)
            try:
                session.flush()
            except sqlalchemy.exc.IntegrityError:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.THREAD_NOT_FOUND)

            return threads_pb2.PostReplyRes(thread_id=pack_thread_id(object_to_add.id, depth + 1))
