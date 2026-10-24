from datetime import timedelta
from typing import Any

from google.protobuf import empty_pb2
from growthbook import GrowthBook
from sqlalchemy import select
from sqlalchemy.sql import func

from couchers import urls
from couchers.db import session_scope
from couchers.jobs.user_email_campaigns import run_user_email_campaigns
from couchers.models import (
    BackgroundJob,
    ExperimentExposure,
    HostingStatus,
    NotificationTopicAction,
    SleepingArrangement,
    UserEmailCampaignSend,
)
from couchers.proto import notifications_pb2
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector, process_jobs
from tests.fixtures.sessions import notifications_session

CAMPAIGN_KEY = "host_my_home_nudge"
FLAG_KEY = "host_my_home_nudge_days_after_signup"
EXPERIMENT_KEY = "host_my_home_nudge_ab"


def _days_experiment(variations: list[int]) -> dict[str, Any]:
    return {
        "defaultValue": -1,
        "rules": [{"key": EXPERIMENT_KEY, "seed": EXPERIMENT_KEY, "hashVersion": 2, "variations": variations}],
    }


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


def test_campaign_unsubscribe_covers_all_campaigns(db, feature_flags):
    """Campaigns share one topic-action, so unsubscribing once opts out of every campaign."""
    feature_flags.set(FLAG_KEY, 14)
    user, token = _make_eligible_user()

    topic_action = NotificationTopicAction.campaign__nudge
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=False,
                    )
                ],
            )
        )

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    assert _send_email_jobs() == 0
    # the send is still recorded, so the user isn't re-targeted once they resubscribe
    assert _campaign_sends() == 1


def test_campaign_renders_push_when_user_opts_in(db, feature_flags, push_collector: PushCollector):
    """Push is off by default for campaigns, but opting in must render rather than blow up."""
    feature_flags.set(FLAG_KEY, 14)
    user, token = _make_eligible_user()

    topic_action = NotificationTopicAction.campaign__nudge
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=True,
                    )
                ],
            )
        )

    run_user_email_campaigns(empty_pb2.Empty())
    process_jobs()

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Get ready to host a couch surfer"
    assert push.content.action_url == urls.edit_home_link()


def _arm(definition: dict[str, Any], user_id: int) -> int:
    result = GrowthBook(attributes={"id": str(user_id)}, features={FLAG_KEY: definition}).eval_feature(FLAG_KEY)
    assert result.experimentResult is not None
    return result.experimentResult.variationId


def _exposures() -> dict[int, int]:
    with session_scope() as session:
        return dict(
            session.execute(
                select(ExperimentExposure.user_id, ExperimentExposure.variation_id).where(
                    ExperimentExposure.experiment_key == EXPERIMENT_KEY
                )
            )
            .tuples()
            .all()
        )


def _sent_to() -> set[int]:
    with session_scope() as session:
        return set(session.execute(select(UserEmailCampaignSend.user_id)).scalars().all())


def test_host_my_home_nudge_ab_exposes_both_arms_and_emails_treatment(db, feature_flags):
    definition = _days_experiment([-1, 14])
    feature_flags.set_definition(FLAG_KEY, definition)
    users = [_make_eligible_user()[0] for _ in range(20)]
    # neither arm would email these, so they're not in the experiment
    _make_eligible_user(joined=now() - timedelta(days=200))
    _make_eligible_user(joined=now() - timedelta(days=5))

    run_user_email_campaigns(empty_pb2.Empty())
    run_user_email_campaigns(empty_pb2.Empty())

    exposures = _exposures()
    assert exposures == {user.id: _arm(definition, user.id) for user in users}
    treated = {user_id for user_id, variation_id in exposures.items() if variation_id == 1}
    assert 0 < len(treated) < len(users)
    assert _sent_to() == treated


def test_host_my_home_nudge_ab_exposes_when_any_arm_emails(db, feature_flags):
    definition = _days_experiment([7, 14])
    feature_flags.set_definition(FLAG_KEY, definition)
    # past the start of the 7 day arm's window, but not yet the 14 day one's
    users = [_make_eligible_user(joined=now() - timedelta(days=10))[0] for _ in range(20)]

    run_user_email_campaigns(empty_pb2.Empty())

    exposures = _exposures()
    assert exposures == {user.id: _arm(definition, user.id) for user in users}
    assert _sent_to() == {user_id for user_id, variation_id in exposures.items() if variation_id == 0}
