import pytest
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from couchers.utils import dt_from_page_token, dt_to_page_token, now
from tests.test_fixtures import db, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_page_token_time_python():
    now_ = now()
    assert now_ == dt_from_page_token(dt_to_page_token(now_))


def test_page_token_time_db(db):
    generate_user()

    # generate a timestamp in postgres (note use of `func`)
    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.joined = func.now()

    with session_scope() as session:
        # pull it back into python
        joined = session.execute(select(User)).scalar_one().joined

        # roundtrip page token
        roundtrip = dt_from_page_token(dt_to_page_token(joined))

        # make sure euqality is still equality
        user = session.execute(select(User).where(User.joined == roundtrip)).scalar_one()
        assert user.joined == roundtrip
