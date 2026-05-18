from datetime import timedelta

import pytest
from sqlalchemy import update

from couchers.db import session_scope
from couchers.metrics import (
    _set_hacky_labeled_gauges_funcs,
    active_users_by_recency_gauge,
    users_per_community_gauge,
)
from couchers.models import User
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
