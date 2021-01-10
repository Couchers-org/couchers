import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import is_valid_date, session_scope
from couchers.models import Comment, Reply, Thread
from couchers.utils import Timestamp_from_datetime
from pb import threads_pb2, threads_pb2_grpc

logger = logging.getLogger(__name__)

PAGINATION_LENGTH = 10


# Since the API exposes a single ID space regardless of nesting level,
# we construct the API id by appending the the nesting level to the
# database ID.


def unpack_thread_id(thread_id):
    return divmod(thread_id, 10)


def pack_thread_id(database_id, depth):
    return database_id * 10 + depth


class Threads(threads_pb2_grpc.ThreadsServicer):
    def GetThread(self, request, context):
        database_id, depth = unpack_thread_id(request.thread_id)
        page_size = request.page_size or 1000
        page_start = unpack_thread_id(int(request.page_token))[0] if request.page_token else 2 ** 50

        with session_scope() as session:
            if depth == 0:
                res = (
                    session.query(Comment, func.count(Reply.id))
                    .outerjoin(Reply, Reply.comment_id == Comment.id)
                    .filter(Comment.thread_id == database_id)
                    .filter(Comment.id < page_start)
                    .group_by(Comment.id)
                    .order_by(Comment.created.desc())
                    .limit(page_size + 1)
                    .all()
                )
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
                res = (
                    session.query(Reply)
                    .filter(Reply.comment_id == database_id)
                    .filter(Reply.id < page_start)
                    .order_by(Reply.created.desc())
                    .limit(page_size + 1)
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
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "bad depth")

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
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "bad depth")
            session.add(object_to_add)
            session.flush()
            return threads_pb2.PostReplyRes(thread_id=pack_thread_id(object_to_add.id, depth + 1))
