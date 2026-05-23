import pytest

from couchers import experimentation
from couchers.config import config
from couchers.context import make_background_user_context, make_logged_out_context
from couchers.i18n import LocalizationContext


@pytest.fixture
def experimentation_snapshot(monkeypatch):
    """Enable experimentation with an in-memory feature snapshot for evaluation."""
    monkeypatch.setattr(experimentation, "_initialized", True)
    features = {
        # A rollout with explicit coverage: bucketing needs a hash, so anonymous (logged-out) users
        # are excluded even at 100% coverage and get the feature's default value instead.
        "rollout_flag": {"defaultValue": "control", "rules": [{"force": "treatment", "coverage": 1.0}]},
        # A global force with no coverage: applies to everyone, including anonymous users.
        "global_flag": {"defaultValue": False, "rules": [{"force": True}]},
    }
    monkeypatch.setattr(experimentation, "_state", {"features": features, "savedGroups": {}})
    monkeypatch.setitem(config, "EXPERIMENTATION_ENABLED", True)
    monkeypatch.setitem(config, "EXPERIMENTATION_PASS_ALL_GATES", False)


def test_logged_in_user_is_bucketed_into_rollout(experimentation_snapshot):
    context = make_background_user_context(123)
    assert context.get_string_value("rollout_flag", "fallback") == "treatment"


def test_anonymous_user_excluded_from_rollout_gets_feature_default(experimentation_snapshot):
    context = make_logged_out_context(LocalizationContext.en_utc())
    # Previously this raised NotLoggedInContextException via context.user_id.
    assert context.get_string_value("rollout_flag", "fallback") == "control"


def test_anonymous_user_still_gets_global_force_on_flag(experimentation_snapshot):
    context = make_logged_out_context(LocalizationContext.en_utc())
    assert context.get_boolean_value("global_flag", default=False) is True


def test_unknown_feature_returns_in_code_default(experimentation_snapshot):
    context = make_logged_out_context(LocalizationContext.en_utc())
    assert context.get_string_value("does_not_exist", "my_default") == "my_default"
