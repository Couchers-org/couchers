import datetime
import logging
from datetime import date, timedelta

import grpc
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, or_

from couchers import errors
from couchers.db import is_valid_date, session_scope
from couchers.models import Thread, Comment, Reply
from couchers.utils import Timestamp_from_datetime
from pb import communities_pb2, communities_pb2_grpc

logger = logging.getLogger(__name__)

PAGINATION_LENGTH = 10


def unpack_thread_id(thread_id):
    return divmod(thread_id, 10)


def pack_thread_id(database_id, depth):
    return database_id * 10 + depth


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetThread(self, request, context):
        with session_scope() as session:
            database_id, depth = unpack_thread_id(request.thread_id)
            if depth == 0:
                res = session.query(Comment).filter(Comment.thread_id == database_id).order_by(Comment.created.desc()).all()
                replies=[
                    communities_pb2.Reply(thread_id=pack_thread_id(r.id, 1),
                                          content=r.content,
                                          author_user_id=1, # fixme
                                          created_time=Timestamp_from_datetime(r.created),
                                          num_replies=3)
                    for r in res]

            elif depth == 1:
                res = session.query(Reply).filter(Reply.comment_id == database_id).order_by(Reply.created.desc()).all()
                replies=[
                    communities_pb2.Reply(thread_id=pack_thread_id(r.id, 2),
                                          content=r.content,
                                          author_user_id=1, # fixme
                                          created_time=Timestamp_from_datetime(r.created),
                                          num_replies=0)
                    for r in res]

            else:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "bad depth")

        return communities_pb2.GetThreadRes(replies=replies)

    def PostReply(self, request, context):
        with session_scope() as session:
            database_id, depth = unpack_thread_id(request.thread_id)
            if depth == 0:
                object_to_add = Comment(thread_id=database_id, content=request.content)
            elif depth == 1:
                object_to_add = Reply(comment_id=database_id, content=request.content)
            else:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "bad depth")
            session.add(object_to_add)
            session.flush()
            session.refresh(object_to_add)
            return communities_pb2.PostReplyRes(thread_id=pack_thread_id(object_to_add.id, depth + 1))
