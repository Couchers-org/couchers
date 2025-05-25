import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import union

from couchers import errors
from couchers.models import Upload, User, UserBlock
from couchers.sql import couchers_select as select
from proto import blocking_pb2, blocking_pb2_grpc


def are_blocked(session, user1_id, user2_id):
    blocked_users = (
        select(UserBlock.blocked_user_id)
        .where(UserBlock.blocking_user_id == user1_id)
        .where(UserBlock.blocked_user_id == user2_id)
    )
    blocking_users = (
        select(UserBlock.blocking_user_id)
        .where(UserBlock.blocking_user_id == user2_id)
        .where(UserBlock.blocked_user_id == user1_id)
    )
    return session.execute(select(union(blocked_users, blocking_users).subquery()).limit(1)).one_or_none() is not None


class Blocking(blocking_pb2_grpc.BlockingServicer):
    def BlockUser(self, request, context, session):
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

    def UnblockUser(self, request, context, session):
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

    def GetBlockedUsers(self, request, context, session):
        blocked_users = session.execute(
            select(User.username, User.name, Upload.filename)
            .join(UserBlock, UserBlock.blocked_user_id == User.id)
            .outerjoin(Upload, Upload.key == User.avatar_key)
            .where(User.is_visible)
            .where(UserBlock.blocking_user_id == context.user_id)
        ).all()

        return blocking_pb2.GetBlockedUsersRes(
            blocked_users=[
                blocking_pb2.BlockedUser(
                    username=blocked_user.username,
                    name=blocked_user.name,
                    avatar_thumbnail_url=Upload(filename=blocked_user.filename).thumbnail_url
                    if blocked_user.filename
                    else None,
                )
                for blocked_user in blocked_users
            ]
        )
