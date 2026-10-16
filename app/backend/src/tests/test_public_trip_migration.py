from datetime import timedelta
from importlib import import_module

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError

from couchers.models.public_trips import PublicTrip
from couchers.utils import today
from tests.fixtures.db import generate_user
from tests.test_public_trips import _create_trip_directly, _make_node

minimum_stay_migration = import_module("couchers.migrations.versions.0195_require_public_trip_minimum_stay")


@pytest.mark.parametrize("nights", [0, 1])
def test_public_trip_minimum_stay_migration(db, testdb_engine, nights):
    user, _ = generate_user()
    node_id = _make_node()
    start = today() + timedelta(days=5)
    end = start + timedelta(days=nights)
    trip_id = _create_trip_directly(user.id, node_id, start, start + timedelta(days=1))

    with (
        testdb_engine.connect().execution_options(isolation_level="READ COMMITTED") as connection,
        connection.begin() as transaction,
    ):
        connection.execute(
            text(
                "ALTER TABLE public_trips DROP CONSTRAINT ck_public_trips_valid_date_range, "
                "ADD CONSTRAINT ck_public_trips_valid_date_range CHECK (from_date <= to_date)"
            )
        )
        connection.execute(update(PublicTrip).where(PublicTrip.id == trip_id).values(to_date=end))
        with Operations.context(MigrationContext.configure(connection)):
            if nights == 0:
                with pytest.raises(RuntimeError, match="without an overnight stay"):
                    minimum_stay_migration.upgrade()
                assert (
                    "<="
                    in connection.execute(
                        text(
                            "SELECT pg_get_constraintdef(oid) FROM pg_constraint "
                            "WHERE conrelid = 'public_trips'::regclass AND conname = 'ck_public_trips_valid_date_range'"
                        )
                    ).scalar_one()
                )
            else:
                minimum_stay_migration.upgrade()
                with pytest.raises(IntegrityError, match="ck_public_trips_valid_date_range"):
                    with connection.begin_nested():
                        connection.execute(update(PublicTrip).where(PublicTrip.id == trip_id).values(to_date=start))
                minimum_stay_migration.downgrade()
                with connection.begin_nested() as savepoint:
                    connection.execute(update(PublicTrip).where(PublicTrip.id == trip_id).values(to_date=start))
                    savepoint.rollback()

        assert connection.execute(
            select(PublicTrip.from_date, PublicTrip.to_date).where(PublicTrip.id == trip_id)
        ).one() == (start, end)
        transaction.rollback()
