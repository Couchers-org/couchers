import grpc
import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from couchers.db import session_scope
from couchers.models import PhotoGallery, PhotoGalleryItem, Upload, User
from couchers.proto import galleries_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import galleries_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def create_upload(session, user_id, filename="test.jpg"):
    """Helper to create an upload for testing"""
    upload = Upload(
        key=f"test_key_{filename}_{user_id}",
        filename=filename,
        creator_user_id=user_id,
    )
    session.add(upload)
    session.commit()
    return upload.key


def test_user_has_profile_gallery(db):
    """Each user should have a profile gallery created automatically"""
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user1.id)).scalar_one()
        assert user.profile_gallery_id is not None

        gallery = session.execute(select(PhotoGallery).where(PhotoGallery.id == user.profile_gallery_id)).scalar_one()
        assert gallery.owner_user_id == user1.id


def test_GetGalleryEditInfo(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        res = api.GetGalleryEditInfo(galleries_pb2.GetGalleryEditInfoReq(gallery_id=user1.profile_gallery_id))
        assert res.gallery_id == user1.profile_gallery_id
        assert res.max_photos == 1
        assert res.current_photo_count == 0


def test_GetGalleryEditInfo_verified_user(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with galleries_session(token1) as api:
        res = api.GetGalleryEditInfo(galleries_pb2.GetGalleryEditInfoReq(gallery_id=user1.profile_gallery_id))
        assert res.gallery_id == user1.profile_gallery_id
        assert res.max_photos == 4
        assert res.current_photo_count == 0


def test_GetGalleryEditInfo_not_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with galleries_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetGalleryEditInfo(galleries_pb2.GetGalleryEditInfoReq(gallery_id=user1.profile_gallery_id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You do not have permission to edit this gallery."


def test_GetGalleryEditInfo_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetGalleryEditInfo(galleries_pb2.GetGalleryEditInfoReq(gallery_id=999999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery not found."


def test_GetGalleryEditInfo_with_photos(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(3)]

    with galleries_session(token1) as api:
        for key in keys:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )

        res = api.GetGalleryEditInfo(galleries_pb2.GetGalleryEditInfoReq(gallery_id=user1.profile_gallery_id))
        assert res.max_photos == 4
        assert res.current_photo_count == 3


def test_GetGallery_as_owner(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        assert res.gallery_id == user1.profile_gallery_id
        assert res.can_edit is True
        assert len(res.photos) == 0


def test_GetGallery_as_non_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with galleries_session(token2) as api:
        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        assert res.gallery_id == user1.profile_gallery_id
        assert res.can_edit is False
        assert len(res.photos) == 0


def test_GetGallery_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=999999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery not found."


def test_AddPhotoToGallery_success(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(
                gallery_id=user1.profile_gallery_id,
                upload_key=upload_key,
            )
        )

        assert len(res.photos) == 1
        photo = res.photos[0]
        assert photo.full_url
        assert photo.thumbnail_url
        assert photo.caption == ""


def test_AddPhotoToGallery_with_caption(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(
                gallery_id=user1.profile_gallery_id,
                upload_key=upload_key,
                caption="Test caption",
            )
        )

        assert len(res.photos) == 1
        assert res.photos[0].caption == "Test caption"


def test_AddPhotoToGallery_multiple_photos(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        key1 = create_upload(session, user1.id, "photo1.jpg")
        key2 = create_upload(session, user1.id, "photo2.jpg")
        key3 = create_upload(session, user1.id, "photo3.jpg")

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key1)
        )
        assert len(res.photos) == 1

        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key2)
        )
        assert len(res.photos) == 2

        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key3)
        )
        assert len(res.photos) == 3


def test_AddPhotoToGallery_not_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user2.id)

    with galleries_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    upload_key=upload_key,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You do not have permission to edit this gallery."


def test_AddPhotoToGallery_upload_not_owned(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user2.id)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    upload_key=upload_key,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Upload not found or you don't own it."


def test_AddPhotoToGallery_max_capacity(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(5)]

    with galleries_session(token1) as api:
        for i in range(4):
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    upload_key=keys[i],
                )
            )

        with pytest.raises(grpc.RpcError) as e:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    upload_key=keys[4],
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The gallery is at maximum capacity and cannot accept more photos."


def test_AddPhotoToGallery_duplicate_photo(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(
                gallery_id=user1.profile_gallery_id,
                upload_key=upload_key,
            )
        )

        with pytest.raises(grpc.RpcError) as e:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    upload_key=upload_key,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "This photo is already in the gallery."


def test_AddPhotoToGallery_gallery_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(
                    gallery_id=999999,
                    upload_key=upload_key,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery not found."


def test_RemovePhotoFromGallery_success(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        key1 = create_upload(session, user1.id, "photo1.jpg")
        key2 = create_upload(session, user1.id, "photo2.jpg")
        key3 = create_upload(session, user1.id, "photo3.jpg")

    with galleries_session(token1) as api:
        api.AddPhotoToGallery(galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key1))
        api.AddPhotoToGallery(galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key2))
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key3)
        )

        item_id = res.photos[1].item_id

        res = api.RemovePhotoFromGallery(
            galleries_pb2.RemovePhotoFromGalleryReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_id,
            )
        )

        assert len(res.photos) == 2


def test_RemovePhotoFromGallery_not_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

    with galleries_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RemovePhotoFromGallery(
                galleries_pb2.RemovePhotoFromGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=item_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You do not have permission to edit this gallery."


def test_RemovePhotoFromGallery_item_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.RemovePhotoFromGallery(
                galleries_pb2.RemovePhotoFromGalleryReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=999999,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery item not found."


def test_MovePhoto_to_first(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(3)]

    with galleries_session(token1) as api:
        for key in keys:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )

        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        item_ids = [photo.item_id for photo in res.photos]

        # Move last photo to first position
        res = api.MovePhoto(
            galleries_pb2.MovePhotoReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_ids[2],
                after_item_id=0,  # 0 means first position
            )
        )

        # Last photo should now be first
        assert res.photos[0].item_id == item_ids[2]
        assert res.photos[1].item_id == item_ids[0]
        assert res.photos[2].item_id == item_ids[1]


def test_MovePhoto_to_middle(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(3)]

    with galleries_session(token1) as api:
        for key in keys:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )

        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        item_ids = [photo.item_id for photo in res.photos]

        # Move first photo after second (to middle)
        res = api.MovePhoto(
            galleries_pb2.MovePhotoReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_ids[0],
                after_item_id=item_ids[1],
            )
        )

        # Order should be: [1, 0, 2]
        assert res.photos[0].item_id == item_ids[1]
        assert res.photos[1].item_id == item_ids[0]
        assert res.photos[2].item_id == item_ids[2]


def test_MovePhoto_to_end(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(3)]

    with galleries_session(token1) as api:
        for key in keys:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )

        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        item_ids = [photo.item_id for photo in res.photos]

        # Move first photo to end (after last)
        res = api.MovePhoto(
            galleries_pb2.MovePhotoReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_ids[0],
                after_item_id=item_ids[2],
            )
        )

        # Order should be: [1, 2, 0]
        assert res.photos[0].item_id == item_ids[1]
        assert res.photos[1].item_id == item_ids[2]
        assert res.photos[2].item_id == item_ids[0]


def test_MovePhoto_noop(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(3)]

    with galleries_session(token1) as api:
        for key in keys:
            api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )

        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        item_ids = [photo.item_id for photo in res.photos]

        # Move photo after itself - should be a no-op
        res = api.MovePhoto(
            galleries_pb2.MovePhotoReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_ids[1],
                after_item_id=item_ids[1],
            )
        )

        # Order should be unchanged
        assert res.photos[0].item_id == item_ids[0]
        assert res.photos[1].item_id == item_ids[1]
        assert res.photos[2].item_id == item_ids[2]


def test_MovePhoto_not_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

    with galleries_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.MovePhoto(
                galleries_pb2.MovePhotoReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=item_id,
                    after_item_id=0,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You do not have permission to edit this gallery."


def test_MovePhoto_item_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.MovePhoto(
                galleries_pb2.MovePhotoReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=999999,
                    after_item_id=0,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery item not found."


def test_MovePhoto_after_item_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

        with pytest.raises(grpc.RpcError) as e:
            api.MovePhoto(
                galleries_pb2.MovePhotoReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=item_id,
                    after_item_id=999999,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "The item to place after was not found."


def test_UpdatePhotoCaption_success(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

        res = api.UpdatePhotoCaption(
            galleries_pb2.UpdatePhotoCaptionReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_id,
                caption="New caption",
            )
        )

        assert len(res.photos) == 1
        assert res.photos[0].caption == "New caption"


def test_UpdatePhotoCaption_clear_caption(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(
                gallery_id=user1.profile_gallery_id,
                upload_key=upload_key,
                caption="Initial caption",
            )
        )
        item_id = res.photos[0].item_id

        res = api.UpdatePhotoCaption(
            galleries_pb2.UpdatePhotoCaptionReq(
                gallery_id=user1.profile_gallery_id,
                item_id=item_id,
                caption="",
            )
        )

        assert len(res.photos) == 1
        assert res.photos[0].caption == ""


def test_UpdatePhotoCaption_not_owner(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

    with galleries_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePhotoCaption(
                galleries_pb2.UpdatePhotoCaptionReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=item_id,
                    caption="Hacked!",
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You do not have permission to edit this gallery."


def test_UpdatePhotoCaption_item_not_found(db):
    user1, token1 = generate_user(complete_profile=False)

    with galleries_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePhotoCaption(
                galleries_pb2.UpdatePhotoCaptionReq(
                    gallery_id=user1.profile_gallery_id,
                    item_id=999999,
                    caption="Test",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Gallery item not found."


def test_remove_and_readd_photo(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        upload_key = create_upload(session, user1.id)

    with galleries_session(token1) as api:
        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        item_id = res.photos[0].item_id

        res = api.RemovePhotoFromGallery(
            galleries_pb2.RemovePhotoFromGalleryReq(gallery_id=user1.profile_gallery_id, item_id=item_id)
        )
        assert len(res.photos) == 0

        res = api.AddPhotoToGallery(
            galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=upload_key)
        )
        assert len(res.photos) == 1


def test_gallery_photo_ordering_preserved(db):
    user1, token1 = generate_user(complete_profile=False, strong_verification=True)

    with session_scope() as session:
        keys = [create_upload(session, user1.id, f"photo{i}.jpg") for i in range(4)]

    with galleries_session(token1) as api:
        item_ids = []
        for key in keys:
            res = api.AddPhotoToGallery(
                galleries_pb2.AddPhotoToGalleryReq(gallery_id=user1.profile_gallery_id, upload_key=key)
            )
            item_ids.append(res.photos[-1].item_id)

        res = api.GetGallery(galleries_pb2.GetGalleryReq(gallery_id=user1.profile_gallery_id))
        assert len(res.photos) == 4
        for i, photo in enumerate(res.photos):
            assert photo.item_id == item_ids[i]


def test_database_constraints_upload_uniqueness(db):
    user1, token1 = generate_user(complete_profile=False)

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user1.id)).scalar_one()

        upload = Upload(key="key1", filename="test.jpg", creator_user_id=user.id)
        session.add(upload)
        session.flush()

        gallery_id = user.profile_gallery_id
        assert gallery_id

        item1 = PhotoGalleryItem(gallery_id=gallery_id, upload_key="key1", position=0.0)
        item2 = PhotoGalleryItem(gallery_id=gallery_id, upload_key="key1", position=1.0)
        session.add_all([item1, item2])

        with pytest.raises(IntegrityError):
            session.flush()

        session.rollback()
