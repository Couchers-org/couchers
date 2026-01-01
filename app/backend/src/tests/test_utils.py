from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from sqlalchemy import select, update
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import User
from couchers.utils import dt_from_page_token, dt_to_page_token, http_date, now, wrap_coordinate
from tests.fixtures.db import generate_user


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_page_token_time_python():
    now_ = now()
    assert now_ == dt_from_page_token(dt_to_page_token(now_))


def test_page_token_time_db(db):
    user, _ = generate_user()

    # generate a timestamp in postgres (note use of `func`)
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(joined=func.now()))

    with session_scope() as session:
        # pull it back into python
        joined = session.execute(select(User)).scalar_one().joined

        # roundtrip page token
        roundtrip = dt_from_page_token(dt_to_page_token(joined))

        # make sure euqality is still equality
        user = session.execute(select(User).where(User.joined == roundtrip)).scalar_one()
        assert user.joined == roundtrip


def test_http_date_with_datetime():
    """Test http_date with a specific datetime to verify usegmt=True is used"""
    dt = datetime(2024, 1, 15, 10, 30, 45, tzinfo=UTC)

    result = http_date(dt)

    assert result == "Mon, 15 Jan 2024 10:30:45 GMT"


def test_http_date_without_datetime():
    """Test http_date with dt=None to verify it uses now() and usegmt=True"""
    mock_now = datetime(2024, 3, 20, 14, 25, 30, tzinfo=UTC)

    with patch("couchers.utils.now", return_value=mock_now):
        result = http_date()

    assert result == "Wed, 20 Mar 2024 14:25:30 GMT"


def test_wrap_coordinate():
    test_coords = [
        ((-95, -185), (-85, 175)),
        ((95, -180), (85, 180)),  # Weird interaction in PostGIS where lng
        # flips at -180 only when there is latitude overflow
        ((90, -180), (90, -180)),
        ((20, 185), (20, -175)),
        ((0, 0), (0, 0)),
        ((-1000, 0), (80, 0)),
        ((1000, 0), (-80, 0)),
        ((-180, 0), (0, 0)),
        ((180, 0), (0, 0)),
        ((-200, 0), (20, 0)),
        ((200, 0), (-20, 0)),
        ((-450, 0), (-90, 0)),
        ((450, 0), (90, 0)),
        ((-540, 0), (0, 0)),
        ((540, 0), (0, 0)),
        ((-90, 0), (-90, 0)),
        ((90, 0), (90, 0)),
        ((-1000, -1000), (80, 80)),
        ((1000, 1000), (-80, -80)),
        ((-100, -100), (-80, -100)),
        ((100, 100), (80, 100)),
        ((1000, 10), (-80, 10)),
        ((-100.5, 10), (-79.5, 10)),
        ((100.5, 10), (79.5, 10)),
        ((-100, 10), (-80, 10)),
        ((100, 10), (80, 10)),
        ((-180, 10), (0, 10)),
        ((180, 10), (0, 10)),
        ((20, 10), (20, 10)),
        ((-270, 10), (90, 10)),
        ((270, 10), (-90, 10)),
        ((-360, 10), (0, 10)),
        ((360, 10), (0, 10)),
        ((-90.1, 10), (-89.9, 10)),
        ((90.1, 10), (89.9, 10)),
        ((-90, 10), (-90, 10)),
        ((90, 10), (90, 10)),
        ((-80, -170), (-80, -170)),
        ((80, 170), (80, 170)),
        ((0, -180), (0, -180)),
        ((0, 180), (0, 180)),
        ((100, -180), (80, 180)),
        ((100, 180), (80, 180)),
        ((20, -180.1), (20, 179.9)),
        ((20, 180.1), (20, -179.9)),
        ((20, -180), (20, -180)),
        ((20, 180), (20, 180)),
        ((-90, -180), (-90, -180)),
        ((90, 180), (90, 180)),
        ((30, -190), (30, 170)),
        ((30, 190), (30, -170)),
        ((-95, -190), (-85, 170)),
        ((95, 190), (85, -170)),
        ((0, -200), (0, 160)),
        ((0, 200), (0, -160)),
        ((-100, -200), (-80, 160)),
        ((100, 200), (80, -160)),
        ((-200, -200), (20, 160)),
        ((200, 200), (-20, -160)),
        ((20, -200), (20, 160)),
        ((20, 200), (20, -160)),
        ((-90, 200), (-90, -160)),
        ((90, 200), (90, -160)),
        ((0, -270), (0, 90)),
        ((0, 270), (0, -90)),
        ((-45, -270), (-45, 90)),
        ((45, 270), (45, -90)),
        ((0, -360), (0, 0)),
        ((0, 360), (0, 0)),
        ((-90, -360), (-90, 0)),
        ((90, 360), (90, 0)),
        ((-500, -500), (-40, -140)),
        ((500, 500), (40, 140)),
        ((50, -500), (50, -140)),
        ((50, 500), (50, 140)),
        ((-500, 50), (-40, 50)),
        ((500, 50), (40, 50)),
        ((0, -540), (0, 180)),
        ((0, 540), (0, 180)),
        ((-45, -90), (-45, -90)),
        ((45, 90), (45, 90)),
    ]

    for coords, coords_expected in test_coords:
        coords_wrapped = wrap_coordinate(*coords)
        assert coords_expected == coords_wrapped
