import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import or_

from couchers import errors, urls
from couchers.db import session_scope
from couchers.models import User, UserBlock
from pb import blocking_pb2, blocking_pb2_grpc


class Blocking(blocking_pb2_grpc.BlockingServicer):
    def BlockUser(self, request, context):
        if context.user_id == request.user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_BLOCK_SELF)

        with session_scope() as session:
            if not session.query(User).filter(User.is_visible).filter(User.id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if (
                session.query(UserBlock)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .filter(UserBlock.blocked_user_id == request.user_id)
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_ALREADY_BLOCKED)
            else:
                user_block = UserBlock(
                    blocking_user_id=context.user_id,
                    blocked_user_id=request.user_id,
                )
                session.add(user_block)
                session.commit()

        return empty_pb2.Empty()

    def UnblockUser(self, request, context):
        with session_scope() as session:
            if not session.query(User).filter(User.is_visible).filter(User.id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            user_block = (
                session.query(UserBlock)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .filter(UserBlock.blocked_user_id == request.user_id)
            )
            if not user_block.one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_NOT_BLOCKED)

            user_block.delete()
            session.commit()

        return empty_pb2.Empty()

    def GetBlockedUsers(self, request, context):
        with session_scope() as session:
            blocked_users = (
                session.query(UserBlock)
                .join(User, User.id == UserBlock.blocked_user_id)
                .filter(User.is_visible)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .all()
            )

            return blocking_pb2.GetBlockedUsersRes(
                blocked_user_ids=[blocked_user.id for blocked_user in blocked_users],
            )
