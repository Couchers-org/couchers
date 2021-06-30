from dummy_data import add_dummy_data
from tests.test_fixtures import db  # noqa


def test_add_dummy_data(db, caplog):
    add_dummy_data()
    assert len(caplog.records) == 0
