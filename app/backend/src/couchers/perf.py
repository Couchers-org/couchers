import threading
from dataclasses import dataclass
from time import perf_counter_ns, thread_time_ns

from sqlalchemy import Engine, event

# Per-request resource accounting. The gRPC server is thread-per-request with synchronous psycopg, so the SQLAlchemy
# cursor-execute listeners fire on the same thread that runs the handler. We keep a thread-local accumulator that the
# interceptor arms (start_perf) right before invoking the handler and reads back (read_perf) right after, so the
# captured numbers cover the handler span only (not auth lookup or the _store_log insert that runs afterwards).

_local = threading.local()


@dataclass
class _PerfAccumulator:
    cpu_start_ns: int
    query_count: int = 0
    write_query_count: int = 0
    db_time_ms: float = 0.0


@dataclass(frozen=True, slots=True)
class PerfResult:
    query_count: int
    write_query_count: int
    db_time_ms: float
    cpu_ms: float


def start_perf() -> None:
    """Arm per-request resource accounting on the current thread."""
    _local.acc = _PerfAccumulator(cpu_start_ns=thread_time_ns())


def read_perf() -> PerfResult | None:
    """Snapshot the current thread's accumulator, or None if accounting wasn't armed."""
    acc: _PerfAccumulator | None = getattr(_local, "acc", None)
    if acc is None:
        return None
    return PerfResult(
        query_count=acc.query_count,
        write_query_count=acc.write_query_count,
        db_time_ms=acc.db_time_ms,
        cpu_ms=(thread_time_ns() - acc.cpu_start_ns) / 1e6,
    )


def _is_write(statement: str) -> bool:
    # INSERT/UPDATE/DELETE are all 6 chars; OTel's SQL commenter appends comments at the end, so the leading token is
    # still the verb.
    return statement.lstrip()[:6].upper().startswith(("INSERT", "UPDATE", "DELETE"))


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
    acc.query_count += 1
    acc.db_time_ms += elapsed_ms
    if _is_write(statement):
        acc.write_query_count += 1


def register_perf_listeners(engine: Engine) -> None:
    event.listen(engine, "before_cursor_execute", _before_cursor_execute)
    event.listen(engine, "after_cursor_execute", _after_cursor_execute)
