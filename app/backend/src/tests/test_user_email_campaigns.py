from datetime import timedelta
from typing import Any

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.jobs.user_email_campaigns import run_user_email_campaigns
from couchers.models import (
    BackgroundJob,
    HostingStatus,
    SleepingArrangement,
    UserEmailCampaignSend,
)
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import process_jobs

CAMPAIGN_KEY = "host_my_home_nudge"
FLAG_KEY = "host_my_home_nudge_days_after_signup"


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _make_eligible_user(**overrides: Any):
    """A user matching all SQL-side criteria for the host_my_home_nudge campaign."""
    kwargs: dict[str, Any] = dict(
        hosting_status=HostingStatus.can_host,
        onboarding_emails_sent=2,
        joined=now() - timedelta(days=30),
        # has_completed_my_home == False because max_guests + sleeping_arrangement are unset
        max_guests=None,
        sleeping_arrangement=None,
    )
    kwargs.update(overrides)
    return generate_user(complete_profile=True, **kwargs)


def _send_email_jobs() -> int:
    with session_scope() as session:
        return session.execute(
            select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
        ).scalar_one()


def _campaign_sends(campaign_key: str = CAMPAIGN_KEY) -> int:
    with session_scope() as session:
        return session.execute(
            select(func.count())
            .select_from(UserEmailCampaignSend)
            .where(UserEmailCampaignSend.campaign_key == campaign_key)
        ).scalar_one()


def test_host_my_home_nudge_happy_path(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    user, _ = _make_eligible_user()

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 1
    assert _campaign_sends() == 1


def test_host_my_home_nudge_dedups_on_rerun(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    _make_eligible_user()

    run_user_email_campaigns(empty_pb2.Empty())
    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 1
    assert _campaign_sends() == 1


def test_host_my_home_nudge_flag_disabled(db, feature_flags):
    # default of -1 means the flag isn't set up in GrowthBook yet; should send nothing.
    _make_eligible_user()

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0
    assert _campaign_sends() == 0


def test_host_my_home_nudge_signup_before_window(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    # Joined too recently (< 14 days ago) — not yet in the window.
    _make_eligible_user(joined=now() - timedelta(days=5))

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0


def test_host_my_home_nudge_signup_after_window(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    # Joined too long ago (> 14 + 60 days ago) — past the window.
    _make_eligible_user(joined=now() - timedelta(days=200))

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0


def test_host_my_home_nudge_skips_non_hosts(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    _make_eligible_user(hosting_status=HostingStatus.cant_host)

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0


def test_host_my_home_nudge_includes_maybe_hosts(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    _make_eligible_user(hosting_status=HostingStatus.maybe)

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 1


def test_host_my_home_nudge_skips_before_onboarding_completed(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    # Still mid-onboarding-nudge track — wait until those have run their course.
    _make_eligible_user(onboarding_emails_sent=1)

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0


def test_host_my_home_nudge_skips_when_my_home_complete(db, feature_flags):
    feature_flags.set(FLAG_KEY, 14)
    # Filling in max_guests + sleeping_arrangement (about_place is set by default) satisfies has_completed_my_home.
    _make_eligible_user(max_guests=2, sleeping_arrangement=SleepingArrangement.private)

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0
