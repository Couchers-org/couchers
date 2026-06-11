import grpc
from google.protobuf import empty_pb2
from sqlalchemy import exists, false, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import not_, or_, union

from couchers import urls
from couchers.context import CouchersContext
from couchers.models import Upload, User, UserBlock
from couchers.models.uploads import get_avatar_photo_subquery
from couchers.proto import blocking_pb2, blocking_pb2_grpc


def is_not_visible(
    session: Session, user1_id: int | None, user2_id: int | None, *, ignore_shadow: bool = False
) -> bool:
    """
    Check if users are not visible to each other (due to block or because either account is deleted/banned/shadowed).
    """
    hidden_users = select(User.id).where(or_(User.id == user1_id, User.id == user2_id)).where(not_(User.is_visible))
    shadowed_target = select(User.id).where(false())
    if not ignore_shadow:
        shadowed_target = select(User.id).where(User.id == user2_id).where(User.shadowed_at.is_not(None))
        if user1_id is not None:
            shadowed_target = shadowed_target.where(User.id != user1_id)
    # if either user_id is empty, just check if either user is hidden (as they can't block each other)
    if not user1_id or not user2_id:
        return (
            session.execute(select(union(hidden_users, shadowed_target).subquery()).limit(1)).one_or_none() is not None
        )
    else:
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
        return (
            session.execute(
                select(union(blocked_users, blocking_users, hidden_users, shadowed_target).subquery()).limit(1)
            ).one_or_none()
            is not None
        )


class Blocking(blocking_pb2_grpc.BlockingServicer):
    def BlockUser(
        self, request: blocking_pb2.BlockUserReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        blockee = session.execute(
            select(User).where(User.is_visible).where(User.username == request.username)
        ).scalar_one_or_none()

        if not blockee:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        if context.user_id == blockee.id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_block_self")

        if session.execute(
            select(
                exists()
                .where(UserBlock.blocking_user_id == context.user_id)
                .where(UserBlock.blocked_user_id == blockee.id)
            )
        ).scalar_one():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "user_already_blocked")
        else:
            user_block = UserBlock(
                blocking_user_id=context.user_id,
                blocked_user_id=blockee.id,
            )
            session.add(user_block)
            session.commit()

        return empty_pb2.Empty()

    def UnblockUser(
        self, request: blocking_pb2.UnblockUserReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        blockee = session.execute(
            select(User).where(User.is_visible).where(User.username == request.username)
        ).scalar_one_or_none()

        if not blockee:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        user_block = session.execute(
            select(UserBlock)
            .where(UserBlock.blocking_user_id == context.user_id)
            .where(UserBlock.blocked_user_id == blockee.id)
        ).scalar_one_or_none()
        if not user_block:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "user_not_blocked")

        session.delete(user_block)
        session.commit()

        return empty_pb2.Empty()

    def GetBlockedUsers(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> blocking_pb2.GetBlockedUsersRes:
        avatar_photo_subquery = get_avatar_photo_subquery()

        blocked_users = session.execute(
            select(User.username, User.name, Upload.filename)
            .join(UserBlock, UserBlock.blocked_user_id == User.id)
            .outerjoin(
                avatar_photo_subquery,
                avatar_photo_subquery.c.gallery_id == User.profile_gallery_id,
            )
            .outerjoin(Upload, Upload.key == avatar_photo_subquery.c.upload_key)
            .where(User.is_visible)
            .where(UserBlock.blocking_user_id == context.user_id)
        ).all()

        return blocking_pb2.GetBlockedUsersRes(
            blocked_users=[
                blocking_pb2.BlockedUser(
                    username=blocked_user.username,
                    name=blocked_user.name,
                    avatar_thumbnail_url=urls.media_url(filename=blocked_user.filename, size="thumbnail")
                    if blocked_user.filename
                    else None,
                )
                for blocked_user in blocked_users
            ]
        )
