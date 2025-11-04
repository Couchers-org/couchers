from os import environ
from tempfile import TemporaryDirectory

prometheus_multiproc_dir = TemporaryDirectory()

environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

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
