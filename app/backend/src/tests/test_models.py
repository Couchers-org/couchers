from datetime import date, datetime
from unittest.mock import patch

from couchers.models import User


class FakeDate(date):
    """A fake replacement for date that can be mocked for testing."""

    def __new__(cls, *args, **kwargs):
        return date.__new__(date, *args, **kwargs)


@patch("couchers.models.date", FakeDate)
def test_user_age():
    FakeDate.today = classmethod(lambda cls: date(2019, 7, 5))
    assert User(birthdate=date(1990, 7, 4)).age == 29
    assert User(birthdate=date(1990, 7, 31)).age == 28
    assert User(birthdate=date(1992, 2, 29)).age == 27


def test_user_display_joined():
    assert User(joined=datetime(2020, 7, 10, 16, 34, 1, 1)).display_joined == datetime(2020, 7, 10, 16, 0, 0, 0)
    assert User(joined=datetime(2025, 7, 10, 16, 59, 1, 1)).display_joined == datetime(2025, 7, 10, 16, 0, 0, 0)
    assert User(joined=datetime(2020, 7, 10, 16, 0, 1, 1)).display_joined == datetime(2020, 7, 10, 16, 0, 0, 0)
    assert User(joined=datetime(2020, 7, 10, 0, 0, 0, 0)).display_joined == datetime(2020, 7, 10, 0, 0, 0, 0)


def test_user_display_last_active():
    assert User(last_active=datetime(2020, 7, 10, 16, 34, 1, 1)).display_last_active == datetime(
        2020, 7, 10, 16, 0, 0, 0
    )
    assert User(last_active=datetime(2025, 7, 10, 17, 59, 1, 1)).display_last_active == datetime(
        2025, 7, 10, 17, 0, 0, 0
    )
    assert User(last_active=datetime(2020, 7, 10, 16, 0, 1, 1)).display_last_active == datetime(
        2020, 7, 10, 16, 0, 0, 0
    )
    assert User(last_active=datetime(2020, 7, 10, 0, 0, 0, 0)).display_last_active == datetime(2020, 7, 10, 0, 0, 0, 0)
