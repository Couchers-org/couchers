import os
import tempfile

import pytest

from media.server import create_app
from nacl.utils import random as random_bytes

@pytest.fixture
def client(tmp_path):
    app = create_app(
        media_server_secret_key=random_bytes(32),
        media_server_bearer_token=random_bytes(32),
        main_server_address="localhost:8088",
        main_server_use_ssl=False,
        media_upload_location=tmp_path,
        avatar_size=200,
    )

    app.config['TESTING'] = True

    with app.test_client() as client:
        yield client

def test_empty_db(client):
    """Start with a blank database."""

    rv = client.get('/')
    assert b'404' in rv.data
