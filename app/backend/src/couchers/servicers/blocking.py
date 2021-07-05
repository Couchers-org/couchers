import grpc
from google.protobuf import empty_pb2

from couchers import errors
from couchers.couchers_select import couchers_select as select
from couchers.db import session_scope
from couchers.models import User, UserBlock
from proto import blocking_pb2, blocking_pb2_grpc


class Blocking(blocking_pb2_grpc.BlockingServicer):
    def BlockUser(self, request, context):
        with session_scope() as session:
            blockee = session.execute(
                select(User).where(User.is_visible).where(User.username == request.username)
            ).scalar_one_or_none()

            if not blockee:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if context.user_id == blockee.id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_BLOCK_SELF)

            if session.execute(
                select(UserBlock)
                .where(UserBlock.blocking_user_id == context.user_id)
                .where(UserBlock.blocked_user_id == blockee.id)
            ).scalar_one_or_none():
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
            blockee = session.execute(
                select(User).where(User.is_visible).where(User.username == request.username)
            ).scalar_one_or_none()

            if not blockee:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            user_block = session.execute(
                select(UserBlock)
                .where(UserBlock.blocking_user_id == context.user_id)
                .where(UserBlock.blocked_user_id == blockee.id)
            ).scalar_one_or_none()
            if not user_block:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_NOT_BLOCKED)

            session.delete(user_block)
            session.commit()

        return empty_pb2.Empty()

    def GetBlockedUsers(self, request, context):
        with session_scope() as session:
            blocked_users = (
                session.execute(
                    select(User)
                    .join(UserBlock, UserBlock.blocked_user_id == User.id)
                    .where(User.is_visible)
                    .where(UserBlock.blocking_user_id == context.user_id)
                )
                .scalars()
                .all()
            )

            return blocking_pb2.GetBlockedUsersRes(
                blocked_usernames=[blocked_user.username for blocked_user in blocked_users],
            )
