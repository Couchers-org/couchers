import json
from datetime import date

import pytest
from growthbook.common_types import FeatureResult
from sqlalchemy import select, update

from couchers import experimentation
from couchers.config import config
from couchers.context import make_background_user_context, make_logged_out_context
from couchers.db import session_scope
from couchers.experimentation import GrowthBookUnavailableError, _record_feature_usage, setup_experimentation
from couchers.i18n import LocalizationContext
from couchers.models.logging import ExperimentExposure, FeatureUsage
from couchers.models.users import User
from couchers.proto import bugs_pb2
from tests.fixtures.db import generate_user, make_volunteer
from tests.fixtures.sessions import bugs_session

# Raw GrowthBook feature definitions for exercising the framework's own bucketing/exposure mechanics.
# Most tests just need feature_flags.set(key, value); these go through feature_flags.set_definition().
# A rollout with explicit coverage: bucketing needs a hash, so anonymous (logged-out) users are
# excluded even at 100% coverage and get the feature's default value instead.
_ROLLOUT_FLAG = {"defaultValue": "control", "rules": [{"force": "treatment", "coverage": 1.0}]}
# A global force with no coverage: applies to everyone, including anonymous users.
_GLOBAL_FORCE_FLAG = {"defaultValue": False, "rules": [{"force": True}]}
# An actual experiment: a logged-in user gets bucketed (coverage 1), which fires the exposure callback.
_EXPERIMENT_FLAG = {
    "defaultValue": "control",
    "rules": [{"key": "my_experiment", "variations": ["control", "treatment"], "coverage": 1.0}],
}
# Flags that only force "on" when the matching per-user evaluator attribute is set - used to assert
# that experimental_features_enabled and is_volunteer actually reach the GrowthBook evaluator.
_EXPERIMENTAL_FEATURES_FLAG = {
    "defaultValue": "off",
    "rules": [{"condition": {"experimental_features_enabled": True}, "force": "on"}],
}
_VOLUNTEER_FLAG = {
    "defaultValue": "off",
    "rules": [{"condition": {"is_volunteer": True}, "force": "on"}],
}


def test_logged_in_user_is_bucketed_into_rollout(db, feature_flags):
    feature_flags.set_definition("rollout_flag", _ROLLOUT_FLAG)
    context = make_background_user_context(123)
    assert context.get_string_value("rollout_flag", "fallback") == "treatment"


def test_experimental_features_enabled_attribute_reaches_evaluator(db, feature_flags):
    feature_flags.set_definition("experimental_features_flag", _EXPERIMENTAL_FEATURES_FLAG)
    user, _ = generate_user()
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(enable_experimental_features=True))
    context = make_background_user_context(user.id)
    assert context.get_string_value("experimental_features_flag", "fallback") == "on"


def test_experimental_features_disabled_by_default(db, feature_flags):
    feature_flags.set_definition("experimental_features_flag", _EXPERIMENTAL_FEATURES_FLAG)
    user, _ = generate_user()
    context = make_background_user_context(user.id)
    assert context.get_string_value("experimental_features_flag", "fallback") == "off"


def test_is_volunteer_attribute_reaches_evaluator(db, feature_flags):
    feature_flags.set_definition("volunteer_flag", _VOLUNTEER_FLAG)
    user, _ = generate_user()
    with session_scope() as session:
        session.add(make_volunteer(user_id=user.id, role="Tester", started_volunteering=date(2020, 6, 1)))
    context = make_background_user_context(user.id)
    assert context.get_string_value("volunteer_flag", "fallback") == "on"


def test_is_volunteer_false_for_non_volunteer(db, feature_flags):
    feature_flags.set_definition("volunteer_flag", _VOLUNTEER_FLAG)
    user, _ = generate_user()
    context = make_background_user_context(user.id)
    assert context.get_string_value("volunteer_flag", "fallback") == "off"


def test_anonymous_user_excluded_from_rollout_gets_feature_default(feature_flags):
    feature_flags.set_definition("rollout_flag", _ROLLOUT_FLAG)
    context = make_logged_out_context(LocalizationContext.en_utc())
    # Previously this raised NotLoggedInContextException via context.user_id.
    assert context.get_string_value("rollout_flag", "fallback") == "control"


def test_anonymous_user_still_gets_global_force_on_flag(feature_flags):
    feature_flags.set_definition("global_flag", _GLOBAL_FORCE_FLAG)
    context = make_logged_out_context(LocalizationContext.en_utc())
    assert context.get_boolean_value("global_flag", default=False) is True


def test_unknown_feature_returns_in_code_default(feature_flags):
    context = make_logged_out_context(LocalizationContext.en_utc())
    assert context.get_string_value("does_not_exist", "my_default") == "my_default"


def test_value_method_returns_in_code_default_when_disabled(monkeypatch, feature_flags):
    feature_flags.set("global_flag", True)
    monkeypatch.setitem(config, "EXPERIMENTATION_ENABLED", False)
    context = make_background_user_context(123)
    assert context.get_string_value("global_flag", "off") == "off"


def test_evaluating_an_experiment_flag_records_exactly_one_exposure(db, feature_flags):
    # Evaluating an experiment-backed flag for a bucketed user records exactly one exposure - this is
    # the whole point of per-flag evaluation: exposure is logged only for flags the user actually hits.
    feature_flags.set_definition("experiment_flag", _EXPERIMENT_FLAG)
    context = make_background_user_context(123)
    assert context.get_object_value("experiment_flag", "control") in {"control", "treatment"}

    with session_scope() as session:
        rows = session.execute(select(ExperimentExposure).where(ExperimentExposure.user_id == 123)).scalars().all()
        assert len(rows) == 1
        assert rows[0].experiment_key == "my_experiment"


def test_evaluate_feature_flag_servicer_returns_value(feature_flags, db):
    feature_flags.set("global_flag", True)
    with bugs_session() as bugs:
        res = bugs.EvaluateFeatureFlag(bugs_pb2.EvaluateFeatureFlagReq(flag_key="global_flag"))
    assert res.value.bool_value is True


def test_evaluate_feature_flag_servicer_unknown_leaves_value_unset(feature_flags, db):
    with bugs_session() as bugs:
        res = bugs.EvaluateFeatureFlag(bugs_pb2.EvaluateFeatureFlagReq(flag_key="does_not_exist"))
    assert not res.HasField("value")


def _get_usage(session, user_id):
    return (
        session.execute(select(FeatureUsage).where(FeatureUsage.user_id == user_id).order_by(FeatureUsage.id))
        .scalars()
        .all()
    )


def test_record_feature_usage_appends_a_row(db):
    _record_feature_usage(1, "my_feature", FeatureResult(value=True, source="defaultValue"))

    with session_scope() as session:
        rows = _get_usage(session, 1)
        assert len(rows) == 1
        assert rows[0].feature_key == "my_feature"
        assert rows[0].value is True
        assert rows[0].time is not None


def test_record_feature_usage_appends_a_row_per_check(db):
    # every check appends - the log is append-only, not deduplicated per (user, feature)
    _record_feature_usage(1, "my_feature", FeatureResult(value="first", source="force"))
    _record_feature_usage(1, "my_feature", FeatureResult(value="second", source="force"))

    with session_scope() as session:
        rows = _get_usage(session, 1)
        assert len(rows) == 2
        assert [row.value for row in rows] == ["first", "second"]


def test_record_feature_usage_records_each_user_and_feature(db):
    _record_feature_usage(1, "feature_a", FeatureResult(value=1, source="force"))
    _record_feature_usage(1, "feature_b", FeatureResult(value=2, source="force"))
    _record_feature_usage(2, "feature_a", FeatureResult(value=3, source="force"))

    with session_scope() as session:
        assert {row.feature_key for row in _get_usage(session, 1)} == {"feature_a", "feature_b"}
        assert len(_get_usage(session, 2)) == 1


def test_record_feature_usage_none_value(db):
    # unknown features evaluate to a None value - must persist without violating NOT NULL
    _record_feature_usage(1, "unknown_feature", FeatureResult(value=None, source="unknownFeature"))

    with session_scope() as session:
        rows = _get_usage(session, 1)
        assert len(rows) == 1
        assert rows[0].value is None


def test_global_evaluation_excluded_from_rollout_gets_feature_default(feature_flags):
    # global (no-user) evaluation can't bucket into a rollout, so it gets the feature default
    feature_flags.set_definition("rollout_flag", _ROLLOUT_FLAG)
    assert experimentation.get_global_string_value("rollout_flag", "fallback") == "control"


def test_global_evaluation_gets_global_force_on_flag(feature_flags):
    feature_flags.set_definition("global_flag", _GLOBAL_FORCE_FLAG)
    assert experimentation.get_global_boolean_value("global_flag", default=False) is True


def test_global_evaluation_unknown_feature_returns_in_code_default(feature_flags):
    assert experimentation.get_global_string_value("does_not_exist", "my_default") == "my_default"


@pytest.fixture
def setup_isolation(monkeypatch, tmp_path):
    """Run setup_experimentation() against a clean module state and a tmp cache path, and make sure the
    background refresh thread it starts is stopped afterwards."""
    monkeypatch.setattr(experimentation, "_initialized", False)
    monkeypatch.setattr(experimentation, "_last_fetch_time", None)
    monkeypatch.setattr(experimentation, "_state", {"features": {}, "savedGroups": {}})
    monkeypatch.setitem(config, "EXPERIMENTATION_ENABLED", True)
    monkeypatch.setitem(config, "GROWTHBOOK_CACHE_PATH", str(tmp_path / "cache.json"))
    yield tmp_path / "cache.json"
    experimentation._refresh_stop.set()
    if experimentation._refresh_thread is not None:
        experimentation._refresh_thread.join(timeout=5)
    experimentation._refresh_stop.clear()
    experimentation._refresh_thread = None


def test_setup_writes_cache_and_records_fetch_time(setup_isolation, monkeypatch):
    cache = setup_isolation
    payload = {"features": {"f": {"defaultValue": True}}, "savedGroups": {}}
    monkeypatch.setattr(experimentation, "_fetch_features", lambda: payload)

    setup_experimentation()

    assert experimentation._state["features"] == {"f": {"defaultValue": True}}
    assert experimentation.seconds_since_last_fetch() is not None
    written = json.loads(cache.read_text())
    assert written["response"] == payload
    assert "fetched_at" in written


def test_setup_falls_back_to_disk_cache_when_fetch_fails(setup_isolation, monkeypatch):
    cache = setup_isolation
    cached_payload = {"features": {"cached": {"defaultValue": "x"}}, "savedGroups": {}}
    cache.write_text(json.dumps({"fetched_at": 1000.0, "response": cached_payload}))
    monkeypatch.setattr(experimentation, "_fetch_features", lambda: None)

    setup_experimentation()

    assert experimentation._state["features"] == {"cached": {"defaultValue": "x"}}
    # fetch time reflects the cached pull time, so staleness is large immediately
    staleness = experimentation.seconds_since_last_fetch()
    assert staleness is not None and staleness > 0


def test_setup_raises_when_fetch_fails_and_no_cache(setup_isolation, monkeypatch):
    monkeypatch.setattr(experimentation, "_fetch_features", lambda: None)

    with pytest.raises(GrowthBookUnavailableError):
        setup_experimentation()


def test_setup_raises_on_corrupt_cache(setup_isolation, monkeypatch):
    cache = setup_isolation
    cache.write_text("this is not json")
    monkeypatch.setattr(experimentation, "_fetch_features", lambda: None)

    with pytest.raises(json.JSONDecodeError):
        setup_experimentation()


def test_seconds_since_last_fetch_none_when_never_fetched(setup_isolation):
    assert experimentation.seconds_since_last_fetch() is None
