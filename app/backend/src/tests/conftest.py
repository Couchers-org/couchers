from os import environ
from tempfile import TemporaryDirectory

prometheus_multiproc_dir = TemporaryDirectory()

environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

# Default for running with a database from docker-compose.test.yml.
if "DATABASE_CONNECTION_STRING" not in environ:
    environ["DATABASE_CONNECTION_STRING"] = "postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/postgres"


from tests.test_fixtures import (  # noqa
    account_session,
    auth_api_session,
    db,
    create_database,
    email_fields,
    fast_passwords,
    generate_user,
    mock_notification_email,
    process_jobs,
    public_session,
    push_collector,
    real_account_session,
    requests_session,
    testconfig,
)
