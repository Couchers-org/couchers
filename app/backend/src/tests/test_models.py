from datetime import date, datetime

import pytest
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from tests.test_fixtures import (  # noqa
    db,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_user_age(db):
    # these used to be test for our hand-rolled age, but moving to postgres now so just double check it does what we expect
    today = date(2019, 7, 5)

    with session_scope() as session:
        assert session.execute(select(func.date_part("year", func.age(today, date(1990, 7, 4))))).scalar_one() == 29
        assert session.execute(select(func.date_part("year", func.age(today, date(1990, 7, 31))))).scalar_one() == 28
        assert session.execute(select(func.date_part("year", func.age(today, date(1992, 2, 29))))).scalar_one() == 27


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
