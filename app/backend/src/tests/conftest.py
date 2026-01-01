from os import environ
from tempfile import TemporaryDirectory

prometheus_multiproc_dir = TemporaryDirectory()

environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

# Default for running with a database from docker-compose.test.yml.
if "DATABASE_CONNECTION_STRING" not in environ:  # pragma: no cover
    environ["DATABASE_CONNECTION_STRING"] = (
        "postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/testdb"
    )


from tests.test_fixtures import (  # noqa
    db,
    db_class,
    template_db,
    fast_passwords,
    push_collector,
    testconfig,
    postgres_engine,
    postgres_conn,
)
