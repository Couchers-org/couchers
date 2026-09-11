import json
from urllib.parse import parse_qs, urlparse

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import inspect, select
from sqlalchemy.orm import undefer

from couchers.crypto import b64decode, random_hex
from couchers.db import session_scope
from couchers.models import InitiatedUpload, Upload
from couchers.proto import media_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import api_session, media_session

METADATA_COLUMNS = [attr.key for attr in inspect(Upload).column_attrs if attr.deferred]


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_media_upload(db):
    user, token = generate_user()

    media_bearer_token = random_hex(32)

    with api_session(token) as api:
        res = api.InitiateMediaUpload(empty_pb2.Empty())

    params = parse_qs(urlparse(res.upload_url).query)
    data = b64decode(params["data"][0])

    response = media_pb2.UploadRequest.FromString(data)
    key = response.key

    filename = random_hex(32)

    req = media_pb2.UploadConfirmationReq(key=key, filename=filename)

    with session_scope() as session:
        # make sure it exists
        assert (
            session.execute(select(InitiatedUpload).where(InitiatedUpload.key == key)).scalar_one_or_none() is not None
        )

    with media_session(media_bearer_token) as media:
        res = media.UploadConfirmation(req)

    with session_scope() as session:
        # make sure it exists
        assert (
            session.execute(
                select(Upload)
                .where(Upload.key == key)
                .where(Upload.filename == filename)
                .where(Upload.creator_user_id == user.id)
            ).scalar_one_or_none()
            is not None
        )

    with session_scope() as session:
        # make sure it was deleted
        assert not session.execute(select(InitiatedUpload)).scalar_one_or_none()


def initiate_upload(token):
    with api_session(token) as api:
        res = api.InitiateMediaUpload(empty_pb2.Empty())

    params = parse_qs(urlparse(res.upload_url).query)
    return media_pb2.UploadRequest.FromString(b64decode(params["data"][0])).key


def get_upload(session, key):
    return session.execute(select(Upload).where(Upload.key == key).options(undefer("*"))).scalar_one()


def test_media_upload_metadata(db):
    user, token = generate_user()
    key = initiate_upload(token)

    req = media_pb2.UploadConfirmationReq(
        key=key,
        filename=random_hex(32),
        metadata=media_pb2.UploadMetadata(
            exif=b"Exif\0\0raw exif segment",
            xmp=b"<?xpacket ...",
            iptc=b"Photoshop 3.0\0",
            parsed_json=json.dumps({"GPS GPSLatitudeRef": "N", "Image Make": "TestCam"}),
            original_filename="IMG_1234.HEIC",
            original_format="heif",
            original_size=4194304,
            original_width=4032,
            original_height=3024,
        ),
    )

    with media_session(random_hex(32)) as media:
        media.UploadConfirmation(req)

    with session_scope() as session:
        upload = get_upload(session, key)

        assert upload.metadata_exif == b"Exif\0\0raw exif segment"
        assert upload.metadata_xmp == b"<?xpacket ..."
        assert upload.metadata_iptc == b"Photoshop 3.0\0"
        assert upload.metadata_parsed == {"GPS GPSLatitudeRef": "N", "Image Make": "TestCam"}
        assert upload.metadata_parse_error is None
        assert upload.original_filename == "IMG_1234.HEIC"
        assert upload.original_format == "heif"
        assert upload.original_size == 4194304
        assert upload.original_width == 4032
        assert upload.original_height == 3024


def test_media_upload_without_metadata(db):
    user, token = generate_user()
    key = initiate_upload(token)

    with media_session(random_hex(32)) as media:
        media.UploadConfirmation(media_pb2.UploadConfirmationReq(key=key, filename=random_hex(32)))

    with session_scope() as session:
        upload = get_upload(session, key)

        assert upload.metadata_exif is None
        assert upload.metadata_parsed is None
        assert upload.metadata_parse_error is None
        assert upload.original_filename is None
        assert upload.original_format is None
        assert upload.original_size is None


def test_a_failed_parse_is_recorded_next_to_the_raw_segment(db):
    user, token = generate_user()
    key = initiate_upload(token)

    req = media_pb2.UploadConfirmationReq(
        key=key,
        filename=random_hex(32),
        metadata=media_pb2.UploadMetadata(
            exif=b"Exif\0\0raw exif segment",
            parse_error="Traceback (most recent call last):\n  ...\nAssertionError\n",
        ),
    )

    with media_session(random_hex(32)) as media:
        media.UploadConfirmation(req)

    with session_scope() as session:
        upload = get_upload(session, key)

        assert upload.metadata_exif == b"Exif\0\0raw exif segment"
        assert upload.metadata_parsed is None
        assert upload.metadata_parse_error == "Traceback (most recent call last):\n  ...\nAssertionError\n"


def test_upload_metadata_is_deferred(db):
    user, token = generate_user()
    key = initiate_upload(token)

    with media_session(random_hex(32)) as media:
        media.UploadConfirmation(
            media_pb2.UploadConfirmationReq(
                key=key, filename=random_hex(32), metadata=media_pb2.UploadMetadata(exif=b"Exif\0\0blob")
            )
        )

    with session_scope() as session:
        upload = session.execute(select(Upload).where(Upload.key == key)).scalar_one()

        assert "metadata_exif" not in upload.__dict__
        assert "metadata_parsed" not in upload.__dict__
        assert "metadata_parse_error" not in upload.__dict__
        assert upload.metadata_exif == b"Exif\0\0blob"


def test_no_metadata_column_rides_along_on_an_entity_load(db):
    user, token = generate_user()
    key = initiate_upload(token)

    with media_session(random_hex(32)) as media:
        media.UploadConfirmation(
            media_pb2.UploadConfirmationReq(
                key=key,
                filename=random_hex(32),
                metadata=media_pb2.UploadMetadata(original_format="webp", original_width=800),
            )
        )

    with session_scope() as session:
        upload = session.execute(select(Upload).where(Upload.key == key)).scalar_one()

        assert not [column for column in METADATA_COLUMNS if column in upload.__dict__]
        assert upload.original_format == "webp"
