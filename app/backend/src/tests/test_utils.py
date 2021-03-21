import pytest

from couchers.utils import to_timezone
from tests.test_fixtures import testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_to_timezone():
    # test valid lat, lng
    lat, lng = 52.5061, 13.358
    assert to_timezone(lat=lat, lng=lng) == "Europe/Berlin"

    # test invalid lat, lng
    lat, lng = -91, -181
    assert to_timezone(lat=lat, lng=lng) == None
