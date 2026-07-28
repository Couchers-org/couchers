from datetime import timedelta

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import update

from couchers.constants import DATETIME_INFINITY
from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views
from couchers.metrics import (
    _set_hacky_labeled_gauges_funcs,
    active_users_by_platform_gauge,
    active_users_by_platform_statement,
    active_users_by_recency_gauge,
    active_users_mobile_fraction_gauge,
    push_reachability_statement,
    push_reachable_fraction_gauge,
    push_reachable_users_gauge,
    push_subscriptions_gauge,
    users_per_community_gauge,
)
from couchers.models import (
    ClientPlatform,
    DeviceType,
    PushNotificationPlatform,
    PushNotificationSubscription,
    User,
    UserActivity,
)
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


def _sample_values(gauge):
    return {
        sample.labels[gauge._labelnames[0]]: sample.value for metric in gauge.collect() for sample in metric.samples
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

    _populate(active_users_by_recency_gauge)
    values = _sample_values(active_users_by_recency_gauge)

    for bucket in ages:
        assert values[bucket] == 1


def _labeled_sample_values(gauge):
    return {
        tuple(sample.labels[labelname] for labelname in gauge._labelnames): sample.value
        for metric in gauge.collect()
        for sample in metric.samples
    }


def _add_web_push_subscription(user_id: int, disabled: bool = False) -> None:
    with session_scope() as session:
        subscription = PushNotificationSubscription(
            user_id=user_id,
            platform=PushNotificationPlatform.web_push,
            endpoint=f"https://push.example.com/{user_id}",
            auth_key=b"auth",
            p256dh_key=b"p256dh",
            full_subscription_info="{}",
        )
        session.add(subscription)
        session.flush()
        subscription.disabled_at = now() - timedelta(days=1) if disabled else DATETIME_INFINITY


def _add_expo_subscription(user_id: int, device_type: DeviceType | None, disabled: bool = False) -> None:
    with session_scope() as session:
        subscription = PushNotificationSubscription(
            user_id=user_id,
            platform=PushNotificationPlatform.expo,
            token=f"ExponentPushToken[{user_id}-{device_type}-{disabled}]",
            device_type=device_type,
        )
        session.add(subscription)
        session.flush()
        subscription.disabled_at = now() - timedelta(days=1) if disabled else DATETIME_INFINITY


def test_push_subscriptions_gauge(db):
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    _add_web_push_subscription(user1.id)
    _add_expo_subscription(user2.id, DeviceType.ios)
    _add_expo_subscription(user3.id, DeviceType.android, disabled=True)
    # a second device for the same user counts as its own subscription
    _add_expo_subscription(user1.id, DeviceType.ios)

    _populate(push_subscriptions_gauge)
    values = _labeled_sample_values(push_subscriptions_gauge)

    # web push never sets device_type, so it lands in the "unknown" bucket
    assert values[("web_push", "unknown", "active")] == 1
    assert values[("expo", "ios", "active")] == 2
    assert values[("expo", "android", "disabled")] == 1
    # combinations with no rows are still emitted, so the series don't disappear from graphs
    assert values[("expo", "android", "active")] == 0
    assert values[("web_push", "unknown", "disabled")] == 0


def _reachability_metrics() -> dict[str, int]:
    with session_scope() as session:
        return dict(session.execute(push_reachability_statement()).one()._mapping)


def _set_last_active(user_id: int, age: timedelta) -> None:
    with session_scope() as session:
        session.execute(update(User).where(User.id == user_id).values(last_active=now() - age))


def test_push_reachability(db):
    reachable_today, _ = generate_user()
    unreachable_today, _ = generate_user()
    reachable_this_month, _ = generate_user()
    # only has a subscription that has been disabled, so they are not reachable by push
    disabled_sub_user, _ = generate_user()
    # active long ago, outside every window
    dormant_user, _ = generate_user()

    _add_web_push_subscription(reachable_today.id)
    _add_expo_subscription(reachable_this_month.id, DeviceType.android)
    _add_expo_subscription(disabled_sub_user.id, DeviceType.ios, disabled=True)
    _add_expo_subscription(dormant_user.id, DeviceType.ios)

    _set_last_active(reachable_today.id, timedelta(hours=2))
    _set_last_active(unreachable_today.id, timedelta(hours=2))
    _set_last_active(disabled_sub_user.id, timedelta(hours=2))
    _set_last_active(reachable_this_month.id, timedelta(days=10))
    _set_last_active(dormant_user.id, timedelta(days=200))

    assert _reachability_metrics() == {
        "active_24h": 3,
        "reachable_24h": 1,
        "active_1month": 4,
        "reachable_1month": 2,
    }


def test_push_reachability_counts_multi_device_user_once(db):
    user, _ = generate_user()
    _add_expo_subscription(user.id, DeviceType.ios)
    _add_expo_subscription(user.id, DeviceType.android)
    _set_last_active(user.id, timedelta(hours=1))

    assert _reachability_metrics() == {
        "active_24h": 1,
        "reachable_24h": 1,
        "active_1month": 1,
        "reachable_1month": 1,
    }


def test_push_reachability_excludes_invisible_users(db):
    visible_user, _ = generate_user()
    deleted_user, _ = generate_user(delete_user=True)

    _add_expo_subscription(visible_user.id, DeviceType.ios)
    _add_expo_subscription(deleted_user.id, DeviceType.ios)

    assert _reachability_metrics() == {
        "active_24h": 1,
        "reachable_24h": 1,
        "active_1month": 1,
        "reachable_1month": 1,
    }


def test_push_reachable_gauges(db):
    reachable_user, _ = generate_user()
    unreachable_user1, _ = generate_user()
    unreachable_user2, _ = generate_user()
    unreachable_user3, _ = generate_user()

    _add_web_push_subscription(reachable_user.id)
    for user in (reachable_user, unreachable_user1, unreachable_user2, unreachable_user3):
        _set_last_active(user.id, timedelta(hours=1))

    # populating the count gauge also sets the fraction gauge: 1 of 4 active users is reachable by push
    _populate(push_reachable_users_gauge)

    assert _labeled_sample_values(push_reachable_users_gauge)[("24h",)] == 1
    assert _labeled_sample_values(push_reachable_fraction_gauge)[("24h",)] == pytest.approx(0.25)


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
