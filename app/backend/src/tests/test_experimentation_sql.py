from typing import Any

import pytest
from growthbook import GrowthBook
from growthbook.core import gbhash
from sqlalchemy import String, cast, delete, func, select, true

from couchers.context import make_background_user_context
from couchers.db import session_scope
from couchers.experimentation_sql import (
    SqlEvaluationMismatchError,
    UnsupportedTargetingError,
    check_value_against_sdk,
    feature_value_sql,
    record_sql_exposures,
)
from couchers.models.logging import ExperimentExposure

N_USERS = 3000


def _users() -> Any:
    return func.generate_series(1, N_USERS).table_valued("id").render_derived()


def _experiment(key: str, variations: list[Any], **kwargs: Any) -> dict[str, Any]:
    return {"key": key, "seed": f"{key}-seed", "hashVersion": 2, "variations": variations, **kwargs}


SUPPORTED_FEATURES: list[tuple[dict[str, Any], Any]] = [
    ({"defaultValue": 3}, -1),
    ({"rules": [{"force": True}]}, False),
    ({"defaultValue": "a", "rules": [{"id": "fr_1", "force": "b", "coverage": 1, "hashAttribute": "id"}]}, ""),
    ({"defaultValue": -1, "rules": [_experiment("e", [-1, 14])]}, -1),
    ({"defaultValue": 0.5, "rules": [_experiment("e", [0, 1, 2.5], weights=[0.2, 0.3, 0.5], coverage=0.6)]}, 0.0),
    ({"defaultValue": "x", "rules": [_experiment("e", ["a", "b"], weights=[0.9, 0.9])]}, "x"),
    ({"defaultValue": "x", "rules": [_experiment("e", ["a", "b"], ranges=[[0, 0.1], [0.5, 0.55]])]}, "x"),
    ({"defaultValue": "x", "rules": [_experiment("e", ["a", None])]}, "x"),
    (
        {
            "defaultValue": 0,
            "rules": [
                _experiment("first", [1, 2], coverage=0.5, meta=[{"key": "c", "name": "Control"}, {"key": "t"}]),
                _experiment("only", [3]),
                {"key": "second", "hashVersion": 2, "variations": [4, 5, 6], "name": "Second"},
                {"force": 7},
                _experiment("unreachable", [8, 9]),
            ],
        },
        0,
    ),
]

UNSUPPORTED_FEATURES: list[tuple[dict[str, Any], Any]] = [
    ({"defaultValue": {"a": 1}}, {}),
    ({"defaultValue": 1, "rules": [{"force": "string"}]}, 0),
    ({"defaultValue": True, "rules": [{"force": 1}]}, False),
    ({"defaultValue": 1, "rules": [{"force": 2, "condition": {"country": "FI"}}]}, 0),
    ({"defaultValue": 1, "rules": [{"force": 2, "coverage": 0.5}]}, 0),
    ({"defaultValue": 1, "rules": [{"force": 2, "range": [0, 0.5]}]}, 0),
    ({"defaultValue": 1, "rules": [{"force": 2, "parentConditions": [{"id": "other"}]}]}, 0),
    ({"defaultValue": 1, "rules": [{"force": None}]}, 0),
    ({"defaultValue": 1, "rules": [{"foo": 2}]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], condition={"id": {"$in": ["1"]}})]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], namespace=["ns", 0, 0.5])]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], filters=[{"seed": "s", "ranges": [[0, 0.5]]}])]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], hashAttribute="deviceId")]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], hashVersion=1)]}, 0),
    ({"defaultValue": 1, "rules": [{"key": "e", "variations": [1, 2]}]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], meta=[{}, {"passthrough": True}])]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], seed="sëed")]}, 0),
    ({"defaultValue": 1, "rules": [_experiment("e", [1, 2], ranges=[[0, 0.5]])]}, 0),
    ({"defaultValue": 1, "somethingNew": True}, 0),
]


def test_gb_bucket_matches_sdk_hash(db):
    users = _users()
    seeds = ["", "e711893f-13b1-4956-a14f-840dd5de9c30", "host_my_home_nudge", "a b/c"]
    with session_scope() as session:
        for seed in seeds:
            rows = session.execute(select(users.c.id, func.gb_bucket(seed, cast(users.c.id, String)))).all()
            assert len(rows) == N_USERS
            for user_id, bucket in rows:
                assert bucket == gbhash(seed, str(user_id), 2)


@pytest.mark.parametrize("definition,default", SUPPORTED_FEATURES)
def test_feature_value_sql_matches_sdk(db, feature_flags, definition, default):
    feature_flags.set_definition("flag", definition)
    users = _users()
    feature = feature_value_sql("flag", default, users.c.id)
    selections = [(e.key, v.id, v.selected) for e in feature.experiments for v in e.variations]
    with session_scope() as session:
        rows = session.execute(select(users.c.id, feature.value, *(sel for _, _, sel in selections))).all()

    features = {"flag": definition}
    for user_id, value, *selected in rows:
        result = GrowthBook(attributes={"id": str(user_id)}, features=features).eval_feature("flag")
        expected = default if result.value is None else result.value
        assert (value, type(value)) == (expected, type(expected)) or (
            isinstance(default, float) and value == float(expected)
        )
        sdk_selection = (
            (result.experiment.key, result.experimentResult.variationId)
            if result.experiment and result.experimentResult
            else None
        )
        sql_selection = [(key, vid) for (key, vid, _), sel in zip(selections, selected) if sel]
        assert sql_selection == ([sdk_selection] if sdk_selection else [])
        check_value_against_sdk(feature, user_id, value)


@pytest.mark.parametrize("definition,default", UNSUPPORTED_FEATURES)
def test_feature_value_sql_rejects_unsupported_targeting(feature_flags, definition, default):
    feature_flags.set_definition("flag", definition)
    with pytest.raises(UnsupportedTargetingError):
        feature_value_sql("flag", default, _users().c.id)


def test_feature_value_sql_unknown_flag_is_default(db, feature_flags):
    feature = feature_value_sql("missing", 5, _users().c.id)
    assert feature.experiments == []
    with session_scope() as session:
        assert session.execute(select(feature.value)).scalar_one() == 5


def test_feature_value_sql_file_override(db, flags):
    flags.set_integer("flag", 9)
    feature = feature_value_sql("flag", 5, _users().c.id)
    assert feature.experiments == []
    with session_scope() as session:
        assert session.execute(select(feature.value)).scalar_one() == 9
    check_value_against_sdk(feature, 1, 9)
    with pytest.raises(SqlEvaluationMismatchError):
        check_value_against_sdk(feature, 1, 5)


def test_check_value_against_sdk_catches_mismatch(feature_flags):
    feature_flags.set("flag", 3)
    feature = feature_value_sql("flag", 0, _users().c.id)
    with pytest.raises(SqlEvaluationMismatchError):
        check_value_against_sdk(feature, 1, 4)


def _exposures() -> list[tuple[int, str, int, Any, dict[str, Any]]]:
    with session_scope() as session:
        return sorted(
            session.execute(
                select(
                    ExperimentExposure.user_id,
                    ExperimentExposure.experiment_key,
                    ExperimentExposure.variation_id,
                    ExperimentExposure.source,
                    ExperimentExposure.data,
                )
            )
            .tuples()
            .all()
        )


def test_record_sql_exposures_matches_sdk_exposures(db, feature_flags):
    definition = {
        "defaultValue": 0,
        "rules": [
            _experiment("first", [1, 2], coverage=0.5, name="First", meta=[{"key": "c", "name": "Control"}, {}]),
            _experiment("second", [3, 4, 5]),
        ],
    }
    feature_flags.set_definition("flag", definition)
    user_ids = list(range(1, 201))

    for user_id in user_ids:
        assert make_background_user_context(user_id).get_integer_value("flag", 0) in {1, 2, 3, 4, 5}
    from_sdk = _exposures()
    assert {key for _, key, _, _, _ in from_sdk} == {"first", "second"}
    with session_scope() as session:
        session.execute(delete(ExperimentExposure))

    users = _users()
    feature = feature_value_sql("flag", 0, users.c.id)
    with session_scope() as session:
        record_sql_exposures(session, feature, select(users.c.id).where(users.c.id <= 200), lambda value: true())
    assert _exposures() == from_sdk

    # already exposed, so nothing changes
    with session_scope() as session:
        record_sql_exposures(session, feature, select(users.c.id).where(users.c.id <= 200), lambda value: true())
    assert _exposures() == from_sdk


def test_record_sql_exposures_only_users_some_arm_affects(db, feature_flags):
    feature_flags.set_definition("flag", {"defaultValue": 0, "rules": [_experiment("e", [1, 2])]})
    users = _users()
    feature = feature_value_sql("flag", 0, users.c.id)
    with session_scope() as session:
        record_sql_exposures(session, feature, select(users.c.id), lambda value: value == 2)
        record_sql_exposures(session, feature, select(users.c.id), lambda value: value == 3)
    exposures = _exposures()
    assert len(exposures) == N_USERS
    assert {vid for _, _, vid, _, _ in exposures} == {0, 1}
