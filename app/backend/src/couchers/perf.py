import threading
from dataclasses import dataclass
from time import perf_counter_ns, thread_time_ns

from sqlalchemy import Engine, event

# Per-request resource accounting. The gRPC server is thread-per-request with synchronous psycopg, so the SQLAlchemy
# cursor-execute listeners fire on the same thread that runs the handler. We keep a thread-local accumulator that the
# interceptor arms (start_perf) right before invoking the handler and reads back (read_perf) right after, so the
# captured numbers cover the handler span only (not auth lookup or the _store_log insert that runs afterwards).

_local = threading.local()


@dataclass(slots=True)
class _PerfAccumulator:
    cpu_start_ns: int
    db_query_count: int = 0
    db_write_query_count: int = 0
    db_time_ms: float = 0.0


@dataclass(frozen=True, slots=True)
class PerfResult:
    db_query_count: int
    db_write_query_count: int
    db_time_ms: float
    cpu_ms: float


def start_perf() -> None:
    """Arm per-request resource accounting on the current thread."""
    _local.acc = _PerfAccumulator(cpu_start_ns=thread_time_ns())


def read_perf() -> PerfResult | None:
    """Snapshot and clear the current thread's accumulator, or None if accounting wasn't armed.

    Clearing means queries that run after this (e.g. the _store_log insert, or background work reusing the thread)
    aren't attributed to the just-finished request.
    """
    acc: _PerfAccumulator | None = getattr(_local, "acc", None)
    if acc is None:
        return None
    _local.acc = None
    return PerfResult(
        db_query_count=acc.db_query_count,
        db_write_query_count=acc.db_write_query_count,
        db_time_ms=acc.db_time_ms,
        cpu_ms=(thread_time_ns() - acc.cpu_start_ns) / 1e6,
    )


def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):  # type: ignore[no-untyped-def]
    # A stack handles re-entrant/nested executes on the same connection.
    conn.info.setdefault("_perf_query_starts", []).append(perf_counter_ns())


def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):  # type: ignore[no-untyped-def]
    starts = conn.info.get("_perf_query_starts")
    if not starts:
        return
    elapsed_ms = (perf_counter_ns() - starts.pop()) / 1e6
    acc: _PerfAccumulator | None = getattr(_local, "acc", None)
    if acc is None:
        # Query on a thread with no active request (background job, metrics scrape, etc.) - don't attribute it.
        return
    acc.db_query_count += 1
    acc.db_time_ms += elapsed_ms
    # SQLAlchemy sets these when it compiled an INSERT/UPDATE/DELETE.
    if context.isinsert or context.isupdate or context.isdelete:
        acc.db_write_query_count += 1


def register_perf_listeners(engine: Engine) -> None:
    event.listen(engine, "before_cursor_execute", _before_cursor_execute)
    event.listen(engine, "after_cursor_execute", _after_cursor_execute)
