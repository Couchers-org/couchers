import grpc
from google.protobuf import empty_pb2

from couchers import errors, urls
from couchers.db import session_scope
from couchers.models import (
    User,
    UserBlocks,
)

from pb import user_blocks_pb2


class UserBlock():
    def BlockUser(self, request, context):
        if context.user_id == request.user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_BLOCK_SELF)

        with session_scope() as session:
            if not session.query(User).filter(User.id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if session.query(UserBlocks).filter(UserBlocks.blocking_user_id == context.user_id).filter(
                    UserBlocks.blocked_user_id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_ALREADY_BLOCKED)
            else:
                user_block = UserBlocks(
                    blocking_user_id=context.user_id,
                    blocked_user_id=request.user_id,
                )
                session.add(user_block)
        return empty_pb2.Empty()


    def GetBlockedUsers(self, request, context):
        with session_scope() as session:
            blocked_users = (
                session.query(UserBlocks)
                    .filter(UserBlocks.blocking_user_id == context.user_id)
                    .all()
            )

            return user_blocks_pb2.GetBlockedUsersRes(
                user_blocks=[
                    user_blocks_pb2.UserBlock(
                        id=blocked_user.id,
                        blocking_user_id=blocked_user.blocking_user_id,
                        blocked_user_id=blocked_user.blocked_user_id,
                    )
                    for blocked_user in blocked_users
                ],
            )


    def UnblockUser(self, request, context):
        if context.user_id == request.user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_UNBLOCK_SELF)

        with session_scope() as session:
            if not session.query(User).filter(User.id == request.user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            user_block = (
                session.query(UserBlocks)
                    .filter(UserBlocks.blocking_user_id == context.user_id)
                    .filter(UserBlocks.blocked_user_id == request.user_id)
            )
            if not user_block.one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_NOT_BLOCKED)

            user_block.delete()
            session.commit()

        return empty_pb2.Empty()