"""
Evaluates GrowthBook flags inside SQL, for jobs that select the users a flag applies to straight from the database
instead of loading everyone and evaluating per user in Python.

feature_value_sql() compiles a flag from the current GrowthBook snapshot into a SQL expression over a user id
column. It understands only a subset of GrowthBook targeting (unconditional force rules, and experiments hashed on
`id` with hash version 2, which hash the id the same way the SDK does via the gb_bucket SQL function) and raises
UnsupportedTargetingError on anything else, so a flag is never silently evaluated differently from the SDK.

Exposures are not recorded as a side effect of evaluation here: the caller decides who is exposed, through
record_sql_exposures(). Everything evaluated here can be checked against the SDK with check_value_against_sdk().
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from growthbook import GrowthBook
from growthbook.core import getBucketRanges
from sqlalchemy import (
    BigInteger,
    Boolean,
    ColumnElement,
    Float,
    Select,
    SQLColumnExpression,
    String,
    and_,
    case,
    cast,
    false,
    func,
    literal,
    not_,
    or_,
    true,
)
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from sqlalchemy.types import TypeEngine

from couchers import experimentation
from couchers.config import config
from couchers.models.logging import ExperimentExposure, ExposureSource

# keys we understand only when they're absent or empty, as the SDK then skips them
_EMPTY_ONLY_KEYS = {"condition", "parentConditions", "filters", "namespace", "fallbackAttribute", "tracks"}
_FEATURE_KEYS = {"defaultValue", "rules"}
_FORCE_RULE_KEYS = {"id", "force", "coverage", "hashAttribute", "hashVersion", "seed"} | _EMPTY_ONLY_KEYS
_EXPERIMENT_RULE_KEYS = {
    "id",
    "key",
    "variations",
    "weights",
    "coverage",
    "ranges",
    "hashAttribute",
    "hashVersion",
    "seed",
    "name",
    "phase",
    "meta",
    # sticky bucketing settings, inert as we don't use a sticky bucket service
    "bucketVersion",
    "minBucketVersion",
    "disableStickyBucketing",
} | _EMPTY_ONLY_KEYS
_META_KEYS = {"key", "name", "passthrough"}


class UnsupportedTargetingError(Exception):
    """The flag uses GrowthBook targeting that can't be evaluated in SQL."""


class SqlEvaluationMismatchError(Exception):
    """SQL evaluation of a flag disagreed with the GrowthBook SDK."""


@dataclass(frozen=True, kw_only=True)
class SqlVariation:
    id: int
    value: Any
    key: str
    name: str
    # the user evaluates to this variation
    selected: ColumnElement[bool]


@dataclass(frozen=True, kw_only=True)
class SqlExperiment:
    key: str
    name: str | None
    bucket: ColumnElement[float]
    variations: list[SqlVariation]


@dataclass(frozen=True, kw_only=True)
class SqlFeature:
    key: str
    default: Any
    user_id: SQLColumnExpression[int]
    sql_type: TypeEngine[Any]
    # the flag's value for the user
    value: ColumnElement[Any]
    experiments: list[SqlExperiment]

    def literal(self, value: Any) -> ColumnElement[Any]:
        return literal(value, self.sql_type)


def _sql_type(flag_key: str, default: Any) -> TypeEngine[Any]:
    if isinstance(default, bool):
        return Boolean()
    if isinstance(default, int):
        return BigInteger()
    if isinstance(default, float):
        return Float()
    if isinstance(default, str):
        return String()
    raise UnsupportedTargetingError(f"Flag {flag_key}: can't evaluate {type(default).__name__} values in SQL")


def _check_value(flag_key: str, default: Any, value: Any) -> Any:
    if value is None:
        return default
    if isinstance(default, bool):
        ok = isinstance(value, bool)
    elif isinstance(default, int):
        ok = isinstance(value, int) and not isinstance(value, bool)
    elif isinstance(default, float):
        ok = isinstance(value, (int, float)) and not isinstance(value, bool)
        value = float(value)
    else:
        ok = isinstance(value, type(default))
    if not ok:
        raise UnsupportedTargetingError(
            f"Flag {flag_key}: value {value!r} doesn't match the type of default {default!r}"
        )
    return value


def _check_keys(flag_key: str, what: str, obj: dict[str, Any], allowed: set[str]) -> None:
    unknown = obj.keys() - allowed
    if unknown:
        raise UnsupportedTargetingError(f"Flag {flag_key}: {what} uses unsupported keys {sorted(unknown)}")
    for k in _EMPTY_ONLY_KEYS & obj.keys():
        if obj[k]:
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} uses unsupported targeting {k!r}")


def feature_value_sql(flag_key: str, default: Any, user_id: SQLColumnExpression[int]) -> SqlFeature:
    """
    Compile flag_key as the GrowthBook SDK would evaluate it for each user in the user_id column.

    Raises UnsupportedTargetingError if the flag uses anything we can't reproduce exactly.
    """
    sql_type = _sql_type(flag_key, default)

    def done(value: ColumnElement[Any], experiments: list[SqlExperiment]) -> SqlFeature:
        return SqlFeature(
            key=flag_key, default=default, user_id=user_id, sql_type=sql_type, value=value, experiments=experiments
        )

    if config.FEATURE_FLAGS_FILE_OVERRIDE_PATH:
        local = experimentation._load_local_flags(config.FEATURE_FLAGS_FILE_OVERRIDE_PATH)
        return done(literal(_check_value(flag_key, default, local.get(flag_key)), sql_type), [])

    if not experimentation._initialized:
        raise experimentation.ExperimentationNotInitializedError(
            "Experimentation is not initialized - call setup_experimentation() first"
        )
    with experimentation._state_lock:
        feature = experimentation._state["features"].get(flag_key)

    if feature is None:
        return done(literal(default, sql_type), [])

    _check_keys(flag_key, "feature", feature, _FEATURE_KEYS)

    whens: list[tuple[ColumnElement[bool], Any]] = []
    experiments: list[SqlExperiment] = []
    # no earlier rule applied to the user
    unmatched: ColumnElement[bool] = true()
    final_value = _check_value(flag_key, default, feature.get("defaultValue"))

    for i, rule in enumerate(feature.get("rules") or []):
        what = f"rule {i}"
        if "force" in rule:
            _check_keys(flag_key, what, rule, _FORCE_RULE_KEYS)
            if rule["force"] is None:
                raise UnsupportedTargetingError(f"Flag {flag_key}: {what} forces null")
            if rule.get("coverage") not in (None, 1) or rule.get("hashAttribute") not in (None, "id"):
                raise UnsupportedTargetingError(f"Flag {flag_key}: {what} is a partial rollout")
            if rule.get("hashVersion") not in (None, 1, 2):
                raise UnsupportedTargetingError(f"Flag {flag_key}: {what} has unknown hash version")
            # applies to everyone who got this far, so no later rule can match
            final_value = _check_value(flag_key, default, rule["force"])
            break

        if "variations" not in rule:
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} is neither a force rule nor an experiment")
        _check_keys(flag_key, what, rule, _EXPERIMENT_RULE_KEYS)
        if rule.get("hashAttribute") not in (None, "id"):
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} hashes on {rule['hashAttribute']!r}")
        if rule.get("hashVersion") != 2:
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} uses hash version {rule.get('hashVersion')}")

        variations = rule["variations"]
        if len(variations) < 2:
            # the SDK skips such experiments without bucketing anyone
            continue

        meta = rule.get("meta")
        if meta is not None:
            if len(meta) != len(variations):
                raise UnsupportedTargetingError(f"Flag {flag_key}: {what} has meta for the wrong number of variations")
            for m in meta:
                _check_keys(flag_key, what, m, _META_KEYS)
                if m.get("passthrough"):
                    raise UnsupportedTargetingError(f"Flag {flag_key}: {what} has a passthrough variation")

        experiment_key = rule.get("key") or flag_key
        seed = rule.get("seed") or experiment_key
        # the SDK hashes non-ASCII strings by code point, gb_bucket by UTF-8 byte
        if not seed.isascii():
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} has a non-ASCII seed")
        coverage = rule.get("coverage")
        ranges = rule.get("ranges") or getBucketRanges(
            len(variations), coverage if coverage is not None else 1, rule.get("weights")
        )
        if len(ranges) != len(variations):
            raise UnsupportedTargetingError(f"Flag {flag_key}: {what} has ranges for the wrong number of variations")

        bucket = func.gb_bucket(seed, cast(user_id, String), type_=Float)
        sql_variations = []
        for j, (variation, (lo, hi)) in enumerate(zip(variations, ranges)):
            in_range = and_(bucket >= lo, bucket < hi)
            value = _check_value(flag_key, default, variation)
            whens.append((in_range, value))
            sql_variations.append(
                SqlVariation(
                    id=j,
                    value=value,
                    key=meta[j].get("key", str(j)) if meta else str(j),
                    name=meta[j].get("name", "") if meta else "",
                    selected=and_(unmatched, in_range),
                )
            )
            unmatched = and_(unmatched, not_(in_range))
        experiments.append(
            SqlExperiment(key=experiment_key, name=rule.get("name"), bucket=bucket, variations=sql_variations)
        )

    if not whens:
        return done(literal(final_value, sql_type), experiments)
    return done(
        case(*((cond, literal(value, sql_type)) for cond, value in whens), else_=literal(final_value, sql_type)),
        experiments,
    )


def record_sql_exposures(
    session: Session,
    feature: SqlFeature,
    candidates: Select[Any],
    applies: Callable[[ColumnElement[Any]], ColumnElement[bool]],
) -> None:
    """
    Records exposures for the users in `candidates` that the flag's experiments affect, in every arm.

    applies(value) is whether the flag value does anything for the user (e.g. whether they'd be emailed). A user is
    exposed once it holds under any variation of an experiment they're bucketed into, whichever one they got: logging
    only the users the treatment arm acts on would compare them against an unmatched control group.

    Each new exposure is checked against the SDK, raising SqlEvaluationMismatchError on any disagreement.
    """
    for experiment in feature.experiments:
        affected = or_(*(applies(feature.literal(v.value)) for v in experiment.variations))
        for variation in experiment.variations:
            data = func.jsonb_build_object(
                "experiment_name",
                cast(experiment.name, String),
                "variation_key",
                cast(variation.key, String),
                "variation_name",
                cast(variation.name, String),
                "hash_attribute",
                cast("id", String),
                "hash_value",
                cast(feature.user_id, String),
                "bucket",
                experiment.bucket,
                "in_experiment",
                true(),
                "hash_used",
                true(),
                "sticky_bucket_used",
                false(),
                "feature_id",
                cast(feature.key, String),
            )
            rows = candidates.with_only_columns(
                feature.user_id,
                cast(experiment.key, String),
                cast(variation.id, BigInteger),
                cast(ExposureSource.backend, ExperimentExposure.__table__.c.source.type),
                data,
            ).where(variation.selected, affected)
            exposed = session.execute(
                insert(ExperimentExposure)
                .from_select(["user_id", "experiment_key", "variation_id", "source", "data"], rows)
                .on_conflict_do_nothing(constraint="uq_experiment_exposures_user_exp_var")
                .returning(ExperimentExposure.user_id)
            ).scalars()
            for user_id in exposed:
                _check_exposure_against_sdk(feature, user_id, experiment.key, variation.id)


def _sdk_evaluator(user_id: int) -> GrowthBook:
    # no callbacks, so checking doesn't itself record exposures or usage
    with experimentation._state_lock:
        features = experimentation._state["features"]
        saved_groups = experimentation._state["savedGroups"]
    return GrowthBook(attributes={"id": str(user_id)}, features=features, saved_groups=saved_groups)


def check_value_against_sdk(feature: SqlFeature, user_id: int, value: Any) -> None:
    """Raises SqlEvaluationMismatchError unless the SDK also evaluates the flag to `value` for the user."""
    if config.FEATURE_FLAGS_FILE_OVERRIDE_PATH:
        local = experimentation._load_local_flags(config.FEATURE_FLAGS_FILE_OVERRIDE_PATH)
        expected = local.get(feature.key, feature.default)
    else:
        result = _sdk_evaluator(user_id).eval_feature(feature.key)
        expected = result.value
    expected = _check_value(feature.key, feature.default, expected)
    if value != expected:
        raise SqlEvaluationMismatchError(
            f"Flag {feature.key} for user {user_id}: SQL gave {value!r}, the SDK gives {expected!r}"
        )


def _check_exposure_against_sdk(feature: SqlFeature, user_id: int, experiment_key: str, variation_id: int) -> None:
    result = _sdk_evaluator(user_id).eval_feature(feature.key)
    got = (experiment_key, variation_id)
    expected = (
        (result.experiment.key, result.experimentResult.variationId)
        if result.experiment is not None and result.experimentResult is not None
        else None
    )
    if got != expected:
        raise SqlEvaluationMismatchError(
            f"Flag {feature.key} for user {user_id}: SQL bucketed into {got}, the SDK into {expected}"
        )
