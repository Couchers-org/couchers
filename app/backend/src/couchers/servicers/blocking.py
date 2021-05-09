import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import or_

from couchers import errors, urls
from couchers.db import session_scope
from couchers.models import User, UserBlock
from pb import blocking_pb2, blocking_pb2_grpc


class Blocking(blocking_pb2_grpc.BlockingServicer):
    def BlockUser(self, request, context):
        with session_scope() as session:
            blockee = (
                session.query(User).filter(User.is_visible).filter(User.username == request.username).one_or_none()
            )

            if not blockee:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if context.user_id == blockee.id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_BLOCK_SELF)

            if (
                session.query(UserBlock)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .filter(UserBlock.blocked_user_id == blockee.id)
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_ALREADY_BLOCKED)
            else:
                user_block = UserBlock(
                    blocking_user_id=context.user_id,
                    blocked_user_id=blockee.id,
                )
                session.add(user_block)
                session.commit()

        return empty_pb2.Empty()

    def UnblockUser(self, request, context):
        with session_scope() as session:
            blockee = (
                session.query(User).filter(User.is_visible).filter(User.username == request.username).one_or_none()
            )

            if not blockee:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            user_block = (
                session.query(UserBlock)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .filter(UserBlock.blocked_user_id == blockee.id)
            )
            if not user_block.one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_NOT_BLOCKED)

            user_block.delete()
            session.commit()

        return empty_pb2.Empty()

    def GetBlockedUsers(self, request, context):
        with session_scope() as session:
            blocked_users = (
                session.query(User)
                .join(UserBlock, UserBlock.blocked_user_id == User.id)
                .filter(User.is_visible)
                .filter(UserBlock.blocking_user_id == context.user_id)
                .all()
            )

            return blocking_pb2.GetBlockedUsersRes(
                blocked_usernames=[blocked_user.username for blocked_user in blocked_users],
            )
