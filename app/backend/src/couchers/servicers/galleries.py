import grpc
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers.constants import GALLERY_MAX_PHOTOS_NOT_VERIFIED, GALLERY_MAX_PHOTOS_VERIFIED
from couchers.context import CouchersContext
from couchers.helpers.strong_verification import has_strong_verification
from couchers.models import PhotoGallery, PhotoGalleryItem, Upload, User
from couchers.proto import galleries_pb2, galleries_pb2_grpc


def _get_max_photos_for_user(session: Session, user: User) -> int:
    return GALLERY_MAX_PHOTOS_VERIFIED if has_strong_verification(session, user) else GALLERY_MAX_PHOTOS_NOT_VERIFIED


def _can_edit_gallery(gallery: PhotoGallery, context: CouchersContext) -> bool:
    return gallery.owner_user_id == context.user_id


def _gallery_to_pb(gallery: PhotoGallery, context: CouchersContext) -> galleries_pb2.PhotoGallery:
    return galleries_pb2.PhotoGallery(
        gallery_id=gallery.id,
        photos=[
            galleries_pb2.PhotoGalleryItem(
                item_id=item.id,
                full_url=item.upload.full_url,
                thumbnail_url=item.upload.thumbnail_url,
                caption=item.caption,
            )
            for item in gallery.photos  # Already ordered by position via relationship
        ],
        can_edit=_can_edit_gallery(gallery, context),
    )


class Galleries(galleries_pb2_grpc.GalleriesServicer):
    def GetGallery(
        self, request: galleries_pb2.GetGalleryReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.PhotoGallery:
        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        return _gallery_to_pb(gallery, context)

    def AddPhotoToGallery(
        self, request: galleries_pb2.AddPhotoToGalleryReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.PhotoGallery:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        if not _can_edit_gallery(gallery, context):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "permission_denied_to_edit_gallery")

        upload_exists = session.execute(
            select(Upload.key).where(Upload.key == request.upload_key).where(Upload.creator_user_id == user.id)
        ).scalar_one_or_none()

        if not upload_exists:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "upload_not_found_or_not_owned")

        # Get all gallery items' upload keys and positions in one query
        gallery_items = session.execute(
            select(PhotoGalleryItem.upload_key, PhotoGalleryItem.position).where(
                PhotoGalleryItem.gallery_id == gallery.id
            )
        ).all()

        existing_upload_keys = {item.upload_key for item in gallery_items}

        if request.upload_key in existing_upload_keys:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "photo_already_in_gallery")

        max_photos = _get_max_photos_for_user(session, user)

        if len(gallery_items) >= max_photos:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "gallery_at_max_capacity")

        # Get max position and add 1.0 (or start at 0.0 if empty)
        max_position = max((item.position for item in gallery_items), default=None)

        item = PhotoGalleryItem(
            gallery_id=gallery.id,
            upload_key=request.upload_key,
            position=0.0 if max_position is None else max_position + 1.0,
            caption=request.caption or None,
        )
        session.add(item)
        gallery.last_updated = func.now()
        session.flush()
        session.refresh(gallery)

        return _gallery_to_pb(gallery, context)

    def RemovePhotoFromGallery(
        self, request: galleries_pb2.RemovePhotoFromGalleryReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.PhotoGallery:
        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        if not _can_edit_gallery(gallery, context):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "permission_denied_to_edit_gallery")

        item = session.execute(
            select(PhotoGalleryItem)
            .where(PhotoGalleryItem.gallery_id == gallery.id)
            .where(PhotoGalleryItem.id == request.item_id)
        ).scalar_one_or_none()

        if not item:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_item_not_found")

        session.delete(item)
        gallery.last_updated = func.now()
        session.flush()
        session.refresh(gallery)

        return _gallery_to_pb(gallery, context)

    def MovePhoto(
        self, request: galleries_pb2.MovePhotoReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.PhotoGallery:
        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        if not _can_edit_gallery(gallery, context):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "permission_denied_to_edit_gallery")

        # Get all items' (id, position) sorted by position
        items = session.execute(
            select(PhotoGalleryItem.id, PhotoGalleryItem.position)
            .where(PhotoGalleryItem.gallery_id == gallery.id)
            .order_by(PhotoGalleryItem.position)
        ).all()

        positions = {item.id: item.position for item in items}
        sorted_ids = [item.id for item in items]

        if request.item_id not in positions:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_item_not_found")

        if request.after_item_id == request.item_id:
            # Moving after itself is a no-op
            return _gallery_to_pb(gallery, context)

        if request.after_item_id == 0:
            # Move to first position
            new_position = positions[sorted_ids[0]] - 1.0 if sorted_ids[0] != request.item_id else None
        else:
            if request.after_item_id not in positions:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "after_item_not_found")

            after_idx = sorted_ids.index(request.after_item_id)
            next_idx = after_idx + 1

            # Skip over the item being moved if it's the next one
            if next_idx < len(sorted_ids) and sorted_ids[next_idx] == request.item_id:
                next_idx += 1

            if next_idx >= len(sorted_ids):
                # Place at end
                new_position = positions[request.after_item_id] + 1.0
            else:
                # Place between after_item and next_item
                new_position = (positions[request.after_item_id] + positions[sorted_ids[next_idx]]) / 2.0

        if new_position is not None:
            session.execute(
                update(PhotoGalleryItem).where(PhotoGalleryItem.id == request.item_id).values(position=new_position)
            )
            gallery.last_updated = func.now()

        session.flush()
        session.refresh(gallery)

        return _gallery_to_pb(gallery, context)

    def UpdatePhotoCaption(
        self, request: galleries_pb2.UpdatePhotoCaptionReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.PhotoGallery:
        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        if not _can_edit_gallery(gallery, context):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "permission_denied_to_edit_gallery")

        item = session.execute(
            select(PhotoGalleryItem)
            .where(PhotoGalleryItem.gallery_id == gallery.id)
            .where(PhotoGalleryItem.id == request.item_id)
        ).scalar_one_or_none()

        if not item:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_item_not_found")

        item.caption = request.caption or None
        gallery.last_updated = func.now()
        session.flush()
        session.refresh(gallery)

        return _gallery_to_pb(gallery, context)

    def GetGalleryEditInfo(
        self, request: galleries_pb2.GetGalleryEditInfoReq, context: CouchersContext, session: Session
    ) -> galleries_pb2.GetGalleryEditInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        gallery = session.execute(
            select(PhotoGallery).where(PhotoGallery.id == request.gallery_id)
        ).scalar_one_or_none()

        if not gallery:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "gallery_not_found")

        if not _can_edit_gallery(gallery, context):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "permission_denied_to_edit_gallery")

        current_photo_count = session.execute(
            select(func.count()).where(PhotoGalleryItem.gallery_id == gallery.id)
        ).scalar_one()

        return galleries_pb2.GetGalleryEditInfoRes(
            gallery_id=gallery.id,
            max_photos=_get_max_photos_for_user(session, user),
            current_photo_count=current_photo_count,
        )
