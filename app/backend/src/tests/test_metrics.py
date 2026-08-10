from datetime import timedelta

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import update

from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views
from couchers.metrics import (
    _set_hacky_labeled_gauges_funcs,
    _set_hacky_multi_gauges_funcs,
    active_users_by_platform_gauge,
    active_users_by_platform_statement,
    active_users_by_recency_gauge,
    active_users_mobile_fraction_gauge,
    users_gauges,
    users_per_community_gauge,
)
from couchers.models import ClientPlatform, HostingStatus, User, UserActivity
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _populate(gauge):
    for registered_gauge, f in _set_hacky_labeled_gauges_funcs:
        if registered_gauge is gauge:
            f(registered_gauge)
            return
    raise AssertionError("gauge is not a registered labeled gauge")


def _populate_single_pass():
    for f in _set_hacky_multi_gauges_funcs:
        f()


def _sample_values(gauge):
    return {
        sample.labels[gauge._labelnames[0]]: sample.value for metric in gauge.collect() for sample in metric.samples
    }


def _users_gauge_values():
    return {
        sample.name: sample.value for gauge in users_gauges for metric in gauge.collect() for sample in metric.samples
    }


def test_users_per_community_gauge(db):
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    with session_scope() as session:
        world = create_community(session, 0, 100, "World", [user1], [], None)
        macroregion = create_community(session, 0, 50, "Macroregion", [user2], [], world)
        region = create_community(session, 0, 25, "Region", [user3], [user1], macroregion)
        # subregion is below the region level and must be excluded
        create_community(session, 0, 10, "Subregion", [user2], [user3], region)

    # the gauge reads from the cluster_subscription_counts materialized view
    refresh_materialized_views(empty_pb2.Empty())

    _populate(users_per_community_gauge)
    values = _sample_values(users_per_community_gauge)

    assert values["World"] == 1
    assert values["Macroregion"] == 1
    assert values["Region"] == 2
    assert "Subregion" not in values


def test_active_users_by_recency_gauge(db):
    ages = {
        "<1d": timedelta(hours=2),
        "1d-1w": timedelta(days=3),
        "1w-1m": timedelta(days=14),
        "1m-6m": timedelta(days=60),
        "6m-12m": timedelta(days=250),
        "12m-24m": timedelta(days=500),
        "24m+": timedelta(days=800),
    }
    user_ids_by_bucket = {}
    for bucket in ages:
        user, _ = generate_user()
        user_ids_by_bucket[bucket] = user.id

    with session_scope() as session:
        for bucket, age in ages.items():
            session.execute(update(User).where(User.id == user_ids_by_bucket[bucket]).values(last_active=now() - age))

    _populate_single_pass()
    values = _sample_values(active_users_by_recency_gauge)

    for bucket in ages:
        assert values[bucket] == 1


def test_active_users_by_recency_gauge_emits_empty_buckets(db):
    generate_user()

    _populate_single_pass()
    values = _sample_values(active_users_by_recency_gauge)

    # every bucket is always emitted, even the ones with no users in them
    assert set(values) == {"<1d", "1d-1w", "1w-1m", "1m-6m", "6m-12m", "12m-24m", "24m+"}
    assert values["<1d"] == 1
    assert values["24m+"] == 0


def test_users_gauges(db):
    generate_user(gender="Man", hosting_status=HostingStatus.can_host)
    generate_user(gender="Woman", hosting_status=HostingStatus.cant_host)
    generate_user(gender="Non-binary", hosting_status=HostingStatus.maybe)
    generate_user(gender="Woman", hosting_status=HostingStatus.can_host, delete_user=True)

    _populate_single_pass()
    values = _users_gauge_values()

    # the deleted user is excluded from every count
    assert values["couchers_users"] == 3
    assert values["couchers_active_users_5m"] == 3
    assert values["couchers_users_man"] == 1
    assert values["couchers_users_woman"] == 1
    assert values["couchers_users_nonbinary"] == 1
    assert values["couchers_users_can_host"] == 1
    assert values["couchers_users_cant_host"] == 1
    assert values["couchers_users_maybe"] == 1


def test_users_completed_profile_gauge(db):
    generate_user()
    generate_user()
    short_about_me, _ = generate_user()
    # a long enough about me isn't sufficient on its own, there has to be a photo in the profile gallery too
    generate_user(complete_profile=False, about_me="x" * 150)

    # ...and neither is a photo without a long enough about me
    with session_scope() as session:
        session.execute(update(User).where(User.id == short_about_me.id).values(about_me="too short"))

    _populate_single_pass()

    assert _users_gauge_values()["couchers_users_completed_profile"] == 2


def _add_activity(user_id: int, client_platform: ClientPlatform | None, age: timedelta = timedelta(minutes=1)) -> None:
    with session_scope() as session:
        session.add(UserActivity(user_id=user_id, period=now() - age, client_platform=client_platform, api_calls=1))


def _platform_metrics() -> dict[str, int]:
    with session_scope() as session:
        return dict(session.execute(active_users_by_platform_statement()).one()._mapping)


def _gauge_value(gauge) -> float:
    return float(next(sample.value for metric in gauge.collect() for sample in metric.samples))


def test_active_users_by_platform(db):
    web_desktop_user, _ = generate_user()
    web_mobile_user, _ = generate_user()
    ios_user, _ = generate_user()
    android_user, _ = generate_user()
    other_user, _ = generate_user()

    _add_activity(web_desktop_user.id, ClientPlatform.web_desktop)
    _add_activity(web_mobile_user.id, ClientPlatform.web_mobile)
    _add_activity(ios_user.id, ClientPlatform.app_ios)
    _add_activity(android_user.id, ClientPlatform.app_android)
    _add_activity(other_user.id, None)

    # the "other" (null platform) user is counted in the total but in no platform bucket, and mobile is the union of
    # web_mobile + app_ios + app_android
    assert _platform_metrics() == {
        "total": 5,
        "mobile": 3,
        "web_desktop": 1,
        "web_mobile": 1,
        "app_ios": 1,
        "app_android": 1,
    }


def test_active_users_by_platform_excludes_invisible_users(db):
    visible_user, _ = generate_user()
    deleted_user, _ = generate_user(delete_user=True)

    _add_activity(visible_user.id, ClientPlatform.web_desktop)
    _add_activity(deleted_user.id, ClientPlatform.web_desktop)

    assert _platform_metrics() == {
        "total": 1,
        "mobile": 0,
        "web_desktop": 1,
        "web_mobile": 0,
        "app_ios": 0,
        "app_android": 0,
    }


def test_active_users_by_platform_counts_user_once_per_platform(db):
    user, _ = generate_user()

    _add_activity(user.id, ClientPlatform.web_desktop)
    _add_activity(user.id, ClientPlatform.app_ios)

    # the user is counted once in the total and once in mobile (they had app_ios activity), but appears in both the
    # web_desktop and app_ios breakdowns
    assert _platform_metrics() == {
        "total": 1,
        "mobile": 1,
        "web_desktop": 1,
        "web_mobile": 0,
        "app_ios": 1,
        "app_android": 0,
    }


def test_active_users_by_platform_excludes_old_activity(db):
    user, _ = generate_user()

    _add_activity(user.id, ClientPlatform.app_ios, age=timedelta(days=2))

    assert _platform_metrics() == {
        "total": 0,
        "mobile": 0,
        "web_desktop": 0,
        "web_mobile": 0,
        "app_ios": 0,
        "app_android": 0,
    }


def test_active_users_mobile_fraction_gauge(db):
    desktop_user, _ = generate_user()
    mobile_web_user, _ = generate_user()
    ios_user, _ = generate_user()
    android_user, _ = generate_user()

    _add_activity(desktop_user.id, ClientPlatform.web_desktop)
    _add_activity(mobile_web_user.id, ClientPlatform.web_mobile)
    _add_activity(ios_user.id, ClientPlatform.app_ios)
    _add_activity(android_user.id, ClientPlatform.app_android)

    # populating the breakdown gauge also sets the mobile fraction gauge: 3 of 4 active users are on mobile
    _populate(active_users_by_platform_gauge)
    assert _gauge_value(active_users_mobile_fraction_gauge) == pytest.approx(0.75)
