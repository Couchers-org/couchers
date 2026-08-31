import grpc
from google.protobuf import empty_pb2
from sqlalchemy import exists, false, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import not_, or_, union

from couchers import urls
from couchers.context import CouchersContext
from couchers.materialized_views import LiteUser
from couchers.models import Upload, User, UserBlock
from couchers.models.uploads import get_avatar_photo_subquery
from couchers.proto import blocking_pb2, blocking_pb2_grpc
from couchers.utils import not_none


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


def _load_viewer_visibility(session: Session, context: CouchersContext) -> None:
    """
    Fill the context's per-request snapshot of who its user can't see: everyone in a block relationship
    with them either way, plus whether their own account is gone (in which case they see nobody).

    One query, once per request. Blocks change rarely and a single request can check visibility for
    hundreds of users, so the alternative is that many round trips for an answer that can't change.
    """
    if context._blocked_user_ids is not None:
        return

    viewer_user_id = context.user_id if context.is_logged_in() else None
    if viewer_user_id is None:
        # nobody can have blocked a logged out viewer, and they have no account to be banned
        context._blocked_user_ids = frozenset()
        context._viewer_is_hidden = False
        return

    blocked_users = select(UserBlock.blocked_user_id).where(UserBlock.blocking_user_id == viewer_user_id)
    blocking_users = select(UserBlock.blocking_user_id).where(UserBlock.blocked_user_id == viewer_user_id)
    # the viewer's own id comes back only if their account is gone: they can't block themselves
    viewer_hidden = select(User.id).where(User.id == viewer_user_id).where(not_(User.is_visible))

    user_ids = set(session.execute(union(blocked_users, blocking_users, viewer_hidden)).scalars().all())

    context._viewer_is_hidden = viewer_user_id in user_ids
    context._blocked_user_ids = frozenset(user_ids - {viewer_user_id})


def forget_viewer_visibility(context: CouchersContext) -> None:
    """Drop the cached snapshot, for when a request changes the viewer's own blocks underneath it."""
    context._blocked_user_ids = None
    context._viewer_is_hidden = False


def is_not_visible_to_viewer(session: Session, context: CouchersContext, user: User | LiteUser) -> bool:
    """
    Whether `user` is not visible to the context's user, for a caller that has already loaded the row.

    Same rules as is_not_visible, but answered from that row plus the context's cached blocks, so
    serializing a page of users doesn't cost a query each. Keep the two in step; they're covered by an
    equivalence test.

    Note the account state (is_visible, shadowed_at) is read off whatever the caller loaded, so for a
    LiteUser it's as fresh as the last lite_users refresh rather than live.
    """
    viewer_user_id = context.user_id if context.is_logged_in() else None

    if not user.is_visible:
        return True
    if user.id == viewer_user_id:
        # you can't block yourself and you're never shadowed from yourself, so a live account always
        # sees itself, and nothing below can apply
        return False
    if user.shadowed_at is not None and not context.serialize_shadowed:
        return True

    _load_viewer_visibility(session, context)
    return context._viewer_is_hidden or user.id in not_none(context._blocked_user_ids)


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
            forget_viewer_visibility(context)

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
        forget_viewer_visibility(context)

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
