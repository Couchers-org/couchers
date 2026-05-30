from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.jobs.handlers import check_database_consistency
from couchers.resources import copy_resources_to_database
from dummy_data import add_dummy_data


def test_add_dummy_data(db, caplog, testconfig):
    # copy the real resources to the database: this way if the testing resources go out of date with the real ones
    # causing dummy data to fail, we'll catch it easily
    with session_scope() as session:
        copy_resources_to_database(session)

    add_dummy_data()
    assert len(caplog.records) == 0

    # dummy data must not leave the database in an inconsistent state (raises DatabaseInconsistencyError otherwise)
    check_database_consistency(empty_pb2.Empty())
