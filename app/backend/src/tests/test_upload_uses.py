from datetime import timedelta

import pytest
from google.protobuf import wrappers_pb2
from sqlalchemy import select

from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.helpers.upload_uses import UploadUseType, get_upload_uses, get_upload_uses_for_keys
from couchers.models import Base, EventOccurrence, Page, PageType, PhotoGallery, PhotoGalleryItem, Upload
from couchers.proto import events_pb2, pages_pb2
from couchers.utils import datetime_to_iso8601_utc_local, now
from tests.conftest import testconfig  # noqa
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import events_session, pages_session
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _add_upload(user_id, key):
    with session_scope() as session:
        session.add(Upload(key=key, filename=f"{key}.jpg", creator_user_id=user_id))


def test_get_upload_uses_unused(db):
    user, _ = generate_user()
    _add_upload(user.id, "unused_key")

    with session_scope() as session:
        assert get_upload_uses(session, "unused_key") == []


def test_get_upload_uses_profile_gallery(db):
    user, _ = generate_user()
    _add_upload(user.id, "avatar_key")
    _add_upload(user.id, "other_key")

    with session_scope() as session:
        gallery = PhotoGallery(owner_user_id=user.id)
        session.add(gallery)
        session.flush()
        # lower position sorts first, so it's the avatar
        session.add(PhotoGalleryItem(gallery_id=gallery.id, upload_key="avatar_key", position=1.0))
        session.add(PhotoGalleryItem(gallery_id=gallery.id, upload_key="other_key", position=2.0))

    with session_scope() as session:
        avatar_uses = get_upload_uses(session, "avatar_key")
        assert len(avatar_uses) == 1
        assert avatar_uses[0].use_type == UploadUseType.profile_gallery_photo_avatar
        assert avatar_uses[0].is_current
        assert avatar_uses[0].user_id == user.id
        assert avatar_uses[0].url is not None
        assert f"/user/{user.username}" in avatar_uses[0].url

        other_uses = get_upload_uses(session, "other_key")
        assert len(other_uses) == 1
        assert other_uses[0].use_type == UploadUseType.profile_gallery_photo
        assert other_uses[0].is_current
        assert other_uses[0].user_id == user.id


def test_get_upload_uses_event(db):
    user, token = generate_user()
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)
    _add_upload(user.id, "event_key")

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Event With Photo",
                content="content",
                photo_key="event_key",
                location=events_pb2.EventLocation(address="Null Island", lat=0.1, lng=0.2),
                start_datetime_iso8601_local=datetime_to_iso8601_utc_local(start_time),
                end_datetime_iso8601_local=datetime_to_iso8601_utc_local(end_time),
            )
        )
    event_id = res.event_id

    with session_scope() as session:
        uses = get_upload_uses(session, "event_key")
        assert len(uses) == 1
        assert uses[0].use_type == UploadUseType.event
        assert uses[0].is_current
        assert uses[0].event_id == event_id
        assert uses[0].url is not None
        assert f"/event/{event_id}/" in uses[0].url

    # a deleted occurrence still references the upload, but is no longer shown
    with session_scope() as session:
        occurrence = session.execute(
            select(EventOccurrence).where(EventOccurrence.photo_key == "event_key")
        ).scalar_one()
        occurrence.is_deleted = True

    with session_scope() as session:
        uses = get_upload_uses(session, "event_key")
        assert len(uses) == 1
        assert uses[0].use_type == UploadUseType.event
        assert not uses[0].is_current


def test_get_upload_uses_page(db):
    user, token = generate_user()
    with session_scope() as session:
        create_community(session, 0, 2, "Root node", [user], [], None)

    key = random_hex(32)
    _add_upload(user.id, key)

    with pages_session(token) as api:
        res = api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="title",
                content="content",
                photo_key=key,
                address="address",
                location=pages_pb2.Coordinate(lat=1, lng=1),
            )
        )
        page_id = res.page_id

        with session_scope() as session:
            uses = get_upload_uses(session, key)
            assert len(uses) == 1
            assert uses[0].use_type == UploadUseType.page
            assert uses[0].is_current
            assert uses[0].page_id == page_id

        # clearing the photo creates a new version; the old version still references the upload
        api.UpdatePage(pages_pb2.UpdatePageReq(page_id=page_id, photo_key=wrappers_pb2.StringValue(value="")))

        with session_scope() as session:
            uses = get_upload_uses(session, key)
            assert len(uses) == 1
            assert uses[0].use_type == UploadUseType.page
            assert not uses[0].is_current
            assert uses[0].page_id == page_id


def test_get_upload_uses_community_page(db):
    user, _ = generate_user()
    with session_scope() as session:
        node_id = create_community(session, 0, 2, "Community", [user], [], None).id

    key = random_hex(32)
    _add_upload(user.id, key)

    with session_scope() as session:
        main_page = session.execute(
            select(Page).where(Page.type == PageType.main_page).where(Page.parent_node_id == node_id)
        ).scalar_one()
        main_page.versions[-1].photo_key = key

    with session_scope() as session:
        uses = get_upload_uses(session, key)
        assert len(uses) == 1
        assert uses[0].use_type == UploadUseType.page
        assert uses[0].is_current
        assert uses[0].url is not None
        assert f"/community/{node_id}/" in uses[0].url


def test_get_upload_uses_multiple(db):
    """An upload can be used in several places at once; all are returned."""
    user, token = generate_user()
    with session_scope() as session:
        create_community(session, 0, 2, "Root node", [user], [], None)

    key = random_hex(32)
    _add_upload(user.id, key)

    with session_scope() as session:
        gallery = PhotoGallery(owner_user_id=user.id)
        session.add(gallery)
        session.flush()
        session.add(PhotoGalleryItem(gallery_id=gallery.id, upload_key=key, position=1.0))

    with pages_session(token) as api:
        api.CreatePlace(
            pages_pb2.CreatePlaceReq(
                title="title",
                content="content",
                photo_key=key,
                address="address",
                location=pages_pb2.Coordinate(lat=1, lng=1),
            )
        )

    with session_scope() as session:
        uses = get_upload_uses(session, key)
        assert {use.use_type for use in uses} == {
            UploadUseType.profile_gallery_photo_avatar,
            UploadUseType.page,
        }


def test_get_upload_uses_for_keys_batch(db):
    user, _ = generate_user()
    _add_upload(user.id, "gallery_key")
    _add_upload(user.id, "unused_key")

    with session_scope() as session:
        gallery = PhotoGallery(owner_user_id=user.id)
        session.add(gallery)
        session.flush()
        session.add(PhotoGalleryItem(gallery_id=gallery.id, upload_key="gallery_key", position=1.0))

    with session_scope() as session:
        result = get_upload_uses_for_keys(session, ["gallery_key", "unused_key", "nonexistent_key"])

    # only keys with uses appear in the mapping
    assert set(result.keys()) == {"gallery_key"}
    assert len(result["gallery_key"]) == 1
    assert result["gallery_key"][0].use_type == UploadUseType.profile_gallery_photo_avatar
    assert result["gallery_key"][0].user_id == user.id


def test_get_upload_uses_for_keys_empty(db):
    with session_scope() as session:
        assert get_upload_uses_for_keys(session, []) == {}


def test_upload_uses_covers_all_foreign_keys(db):
    """
    Guards against drift: every foreign key targeting uploads.key must be handled by get_upload_uses.

    If this fails, you added a new reference to uploads.key. Add it to get_upload_uses (and likely a new
    UploadUseType), then add the (table, column) here.
    """
    referencing = set()
    for table in Base.metadata.tables.values():
        for fk in table.foreign_keys:
            if fk.column.table.name == "uploads" and fk.column.name == "key":
                referencing.add((table.name, fk.parent.name))

    assert referencing == {
        ("photo_gallery_items", "upload_key"),
        ("event_occurrences", "photo_key"),
        ("page_versions", "photo_key"),
    }
