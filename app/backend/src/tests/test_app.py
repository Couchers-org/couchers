import grpc
import pytest

from couchers.server import create_main_server, create_media_server
from tests.test_fixtures import testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_servers():
    server = create_main_server(port=1751)
    media_server = create_media_server(port=1753)
    server.start()
    media_server.start()
    server.stop(None).wait()
    media_server.stop(None).wait()
