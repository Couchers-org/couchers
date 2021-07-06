from base64 import urlsafe_b64decode
from urllib.parse import parse_qs, urlparse

import pytest
from google.protobuf import empty_pb2

from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import InitiatedUpload, Upload
from couchers.sql import couchers_select as select
from proto import media_pb2
from tests.test_fixtures import api_session, db, generate_user, media_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_media_upload(db):
    user, token = generate_user()

    media_bearer_token = random_hex(32)

    with api_session(token) as api:
        res = api.InitiateMediaUpload(empty_pb2.Empty())

    params = parse_qs(urlparse(res.upload_url).query)
    data = urlsafe_b64decode(params["data"][0])

    response = media_pb2.UploadRequest.FromString(data)
    key = response.key

    filename = random_hex(32)

    req = media_pb2.UploadConfirmationReq(key=key, filename=filename)

    with session_scope() as session:
        # make sure it exists
        assert (
            session.execute(select(InitiatedUpload).filter(InitiatedUpload.key == key)).scalar_one_or_none() is not None
        )

    with media_session(media_bearer_token) as media:
        res = media.UploadConfirmation(req)

    with session_scope() as session:
        # make sure it exists
        assert (
            session.execute(
                select(Upload)
                .filter(Upload.key == key)
                .filter(Upload.filename == filename)
                .filter(Upload.creator_user_id == user.id)
            ).scalar_one()
            is not None
        )

    with session_scope() as session:
        # make sure it was deleted
        assert not session.execute(select(InitiatedUpload)).scalar_one_or_none()
