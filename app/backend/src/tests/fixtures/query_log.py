"""Records every SQL query the suite issues, grouped by test and by the RPC (or background job) that issued it.

Off unless --query-log is passed, so ordinary local runs pay nothing. CI dumps one JSON file per pytest-split node;
app/scripts/query_log_report.py merges those, diffs them against develop's and renders the browsable report.

Each query is stored twice: a fingerprint with the bound parameters replaced by "?" (the stable key used for
grouping and diffing) and one concrete rendering with the values inlined by psycopg, so it can be copy-pasted
straight into a psql prompt.
"""

import hashlib
import json
import os
import re
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import psycopg
from sqlalchemy import Engine, event

# Bind parameters as psycopg's pyformat paramstyle renders them, plus positional %s for good measure.
_PARAM_RE = re.compile(r"%\([^)]*\)s|%s")
# Trailing sqlcommenter-style comments. Nothing emits these in tests today (tracing is only set up in prod), but a
# future change that turns the commenter on would otherwise invalidate every fingerprint at once.
_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
# Expanded IN (...) lists, whose length varies with the test data.
_PARAM_LIST_RE = re.compile(r"\?(?:\s*,\s*\?)+")
# Repeated VALUES tuples from a multi-row insert, whose count varies with the test data.
_VALUES_LIST_RE = re.compile(r"\(\?\)(?:\s*,\s*\(\?\))+")
# Literals inlined into the statement text rather than bound. Bulk resource loads do this: the real
# timezone_areas.sql applied by the migrations is a few hundred INSERTs each carrying megabytes of WKB hex, so
# without collapsing them every row becomes its own multi-megabyte shape.
_LONG_LITERAL_RE = re.compile(r"'[^']{64,}'")
_WHITESPACE_RE = re.compile(r"\s+")
_WRITE_RE = re.compile(r"^\s*(INSERT|UPDATE|DELETE)\b", re.IGNORECASE)

# Hard cap on what is stored per statement. Nothing this long is an access pattern worth diffing, and the cap is
# what bounds the artifact: uncapped, the timezone_areas load alone took a CI node's dump to 495 MB.
_MAX_SQL_CHARS = 4096
_TRUNCATION_MARKER = " /* truncated by the query log */"

# test_db rebuilds the schema from migrations to diff it against the models. That is schema plumbing rather than an
# access pattern, it is already covered by the schema-diff artifact, and in CI it loads the real timezone_areas.sql.
_EXCLUDED_MODULES = ("src/tests/test_db.py",)


@dataclass(slots=True)
class _Shape:
    id: str
    sql: str
    example: str
    params: str | None
    write: bool
    # The test that first produced this shape. Kept only to make the choice of `example` deterministic.
    first_seen_in: str


@dataclass(slots=True)
class _Span:
    kind: str
    name: str | None
    queries: list[str] = field(default_factory=list)


_lock = threading.Lock()
_local = threading.local()

_enabled = False
_current_test: str | None = None
_shapes: dict[str, _Shape] = {}
_tests: dict[str, list[_Span]] = {}


def _truncate(sql: str) -> str:
    return sql if len(sql) <= _MAX_SQL_CHARS else sql[:_MAX_SQL_CHARS] + _TRUNCATION_MARKER


def _fingerprint(statement: str) -> str:
    sql = _COMMENT_RE.sub("", statement)
    sql = _PARAM_RE.sub("?", sql)
    sql = _PARAM_LIST_RE.sub("?", sql)
    sql = _VALUES_LIST_RE.sub("(?)", sql)
    sql = _LONG_LITERAL_RE.sub("'...'", sql)
    return _truncate(_WHITESPACE_RE.sub(" ", sql).strip())


def _shape_id(fingerprint: str) -> str:
    # Content-addressed, so the three pytest-split nodes agree on ids and merging is a plain dict union. A counter
    # would be assigned in per-node encounter order and collide across nodes.
    return hashlib.blake2b(fingerprint.encode(), digest_size=6).hexdigest()


def _render_example(conn: Any, statement: str, parameters: Any) -> tuple[str, str | None]:
    """Inline the bound values so the statement can be pasted into psql.

    psycopg's ClientCursor.mogrify applies the same adaptation and escaping the driver would otherwise do
    server-side, which is far more faithful than re-implementing literal binding for bytea, arrays and PostGIS
    geometries. It is purely client-side, so it issues nothing on the connection.
    """
    # executemany passes a sequence of parameter sets; one row is enough to have something runnable.
    if isinstance(parameters, (list, tuple)) and parameters and isinstance(parameters[0], (dict, list, tuple)):
        parameters = parameters[0]
    try:
        params = json.dumps(parameters, default=repr) if parameters else None
    except TypeError, ValueError:
        params = None
    if params is not None:
        params = _truncate(params)
    try:
        cursor = psycopg.ClientCursor(conn.connection.driver_connection)
        # Truncated past the cap, so the marker is a SQL comment: the result is visibly not runnable rather than
        # silently invalid.
        return _truncate(cursor.mogrify(statement, parameters)), params
    except Exception:
        # Not worth losing the whole entry over; the fingerprint plus the parameters is still pasteable by hand.
        return _truncate(statement), params


def _current_span() -> _Span | None:
    return getattr(_local, "span", None)


def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    test = _current_test
    if test is None or test.startswith(_EXCLUDED_MODULES):
        return
    fingerprint = _fingerprint(statement)
    with _lock:
        shape = _shapes.get(fingerprint)
        if shape is None or test < shape.first_seen_in:
            example, params = _render_example(conn, statement, parameters)
            is_write = bool(
                (context is not None and (context.isinsert or context.isupdate or context.isdelete))
                or _WRITE_RE.match(statement)
            )
            _shapes[fingerprint] = _Shape(
                id=_shape_id(fingerprint),
                sql=fingerprint,
                example=example,
                params=params,
                write=is_write,
                first_seen_in=test,
            )
            shape = _shapes[fingerprint]

        span = _current_span()
        if span is None:
            # A query outside any RPC or job: fixture setup, or the test body using session_scope() directly.
            spans = _tests.setdefault(test, [])
            if spans and spans[-1].kind == "body":
                span = spans[-1]
            else:
                span = _Span(kind="body", name=None)
                spans.append(span)
        span.queries.append(shape.id)


class _SpanScope:
    """Marks the queries issued inside it as belonging to one RPC call or background job run.

    The span is registered against the current test on entry, so the recorded order matches call order. It is held
    in a thread-local because the real-server sessions run handlers on a gRPC executor thread while the test body
    runs on the main thread; FakeChannel runs them inline, and the same thread-local covers that too.
    """

    def __init__(self, kind: str, name: str | None):
        self._span = _Span(kind=kind, name=name)
        self._previous: _Span | None = None

    def __enter__(self) -> _SpanScope:
        if _current_test is not None:
            with _lock:
                _tests.setdefault(_current_test, []).append(self._span)
        self._previous = _current_span()
        _local.span = self._span
        return self

    def __exit__(self, *exc: object) -> None:
        _local.span = self._previous


def span(kind: str, name: str | None) -> Any:
    """Open a recording span. A no-op unless --query-log is active, so callers need no guard of their own."""
    if not _enabled:
        return _NULL_SPAN
    return _SpanScope(kind, name)


class _NullSpan:
    def __enter__(self) -> _NullSpan:
        return self

    def __exit__(self, *exc: object) -> None:
        pass


_NULL_SPAN = _NullSpan()


def enable(engine: Engine) -> None:
    global _enabled
    _enabled = True
    event.listen(engine, "after_cursor_execute", _after_cursor_execute)


def set_current_test(test_id: str | None) -> None:
    global _current_test
    _current_test = test_id
    _local.span = None


def dump(directory: Path) -> Path:
    """Write this node's recording. The node suffix keeps the parallel CI jobs from overwriting each other."""
    node = os.environ.get("CI_NODE_INDEX", "local")
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"data.{node}.json"
    with _lock:
        data = {
            "shapes": {
                shape.id: {
                    "sql": shape.sql,
                    "example": shape.example,
                    "params": shape.params,
                    "write": shape.write,
                    # The merge step uses this to pick the same `example` the single-node run would have picked.
                    "first_seen_in": shape.first_seen_in,
                }
                for shape in _shapes.values()
            },
            "tests": {
                test: [{"kind": s.kind, "name": s.name, "queries": s.queries} for s in spans]
                for test, spans in sorted(_tests.items())
            },
        }
    path.write_text(json.dumps(data, separators=(",", ":"), sort_keys=True))
    return path
