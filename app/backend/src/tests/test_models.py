from unittest.mock import patch
from datetime import date

from couchers.models import User

class FakeDate(date):
    '''A fake replacement for date that can be mocked for testing.'''
    def __new__(cls, *args, **kwargs):
        return date.__new__(date, *args, **kwargs)

@patch('couchers.models.date', FakeDate)
def test_user_birthdate():
    FakeDate.today = classmethod(lambda cls: date(2019, 7, 5))
    assert User(birthdate = date(1990, 7, 4)).age == 29
    assert User(birthdate = date(1990, 7, 31)).age == 28
    assert User(birthdate = date(1992, 2, 29)).age == 27
