import pytest
from timezonefinder import TimezoneFinder

from tests.test_fixtures import testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_to_timezone_lng_lat():
    tf = TimezoneFinder()
    lat, lng = 52.5061, 13.358
    assert tf.timezone_at(lng=lng, lat=lat) == "Europe/Berlin"

    with pytest.raises(ValueError):
        lat, lng = -91, -181
        tf.timezone_at(lng=lng, lat=lat)
