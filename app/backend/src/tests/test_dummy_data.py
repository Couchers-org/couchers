from pathlib import Path

from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.helpers.completed_profile import has_completed_profile
from couchers.jobs.handlers import check_database_consistency
from couchers.models import Upload, User
from couchers.resources import copy_resources_to_database
from dummy_data import add_dummy_data


def test_add_dummy_data(db, caplog, testconfig, fast_passwords):
    # copy the real resources to the database: this way if the testing resources go out of date with the real ones
    # causing dummy data to fail, we'll catch it easily
    with session_scope() as session:
        copy_resources_to_database(session)

    add_dummy_data()
    assert len(caplog.records) == 0

    # dummy data must not leave the database in an inconsistent state (raises DatabaseInconsistencyError otherwise)
    check_database_consistency(empty_pb2.Empty())

    with session_scope() as session:
        users = session.execute(select(User)).scalars().all()
        assert all(has_completed_profile(session, user) for user in users)

        uploads = session.execute(select(Upload).where(Upload.key.like("dummy-%-avatar"))).scalars().all()
        image_dir = Path(__file__).parent.parent / "data" / "dummy_profile_images"
        assert len(uploads) == len(users)
        assert all((image_dir / upload.filename).is_file() for upload in uploads)
