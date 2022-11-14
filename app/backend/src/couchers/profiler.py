import io
import logging
import pstats
from contextvars import ContextVar
from cProfile import Profile
from threading import get_ident
from time import perf_counter_ns

from couchers.utils import now

logger = logging.getLogger(__name__)

do_profile_ctx = ContextVar("do_profile_ctx", default=False)
sql_queries = ContextVar("sql_queries", default=[])


def add_sql_statement(statement, params, start, start_ns, end, end_ns):
    if do_profile_ctx.get():
        sql_queries.get().append((statement, params, start, start_ns, end, end_ns))


def format_ns(ns):
    return f"{ns/1e6:0.2f} ms"


class CouchersProfiler:
    def __init__(self, do_profile=False):
        self._do_profile = do_profile
        do_profile_ctx.set(do_profile)
        sql_queries.set([])

    def __enter__(self):
        self.report = None
        if self._do_profile:
            self._pr = Profile()
            self._pr.enable()
            self._start = now()
            self._start_ns = perf_counter_ns()
        return self

    def __exit__(self, exc_type, exc_obj, exc_tb):
        if self._do_profile:
            self._end_ns = perf_counter_ns()
            self._end = now()
            self._pr.disable()
            s = io.StringIO()
            ps = pstats.Stats(self._pr, stream=s).sort_stats("cumulative")
            ps.print_stats()

            def sql_time(item):
                statement, params, start, start_ns, end, end_ns = item
                return end_ns - start_ns

            queries = sql_queries.get()
            total_sql_ns = sum(map(sql_time, queries))

            def format_sql(item):
                statement, params, start, start_ns, end, end_ns = item
                return f"* SQL query from {format_ns(start_ns-self._start_ns)} to {format_ns(end_ns-self._start_ns)} (duration: {format_ns(end_ns-start_ns)}), aka {start} to {end}\n\n{statement}\n\nParams: {params}"

            sql_query_info = f"==== SQL queries ====\n\nTotal {len(queries)} queries\n\n" + "\n\n\n".join(
                map(format_sql, queries)
            )
            total_ns = self._end_ns - self._start_ns
            basics = f"==== Run info ====\n\nStart: {self._start}\nEnd: {self._end}\nDuration: {format_ns(total_ns)}\nTotal SQL: {format_ns(total_sql_ns)}\nSQL %: {100.*total_sql_ns/total_ns:0.2f}\nSQL queries: {len(queries)}\nThread: {get_ident()}"
            cprofile = f"==== cProfile ====\n\n{s.getvalue()}"

            self.report = "\n\n\n\n".join([basics, cprofile, sql_query_info])
        sql_queries.set([])
        do_profile_ctx.set(False)
