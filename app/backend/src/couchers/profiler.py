import contextvars
import io
import logging
import pstats
from cProfile import Profile
from time import perf_counter_ns

from couchers.utils import now

logger = logging.getLogger(__name__)

do_profile_ctx = contextvars.ContextVar("do_profile_ctx", default=False)
sql_queries = contextvars.ContextVar("sql_queries")


def add_sql_statement(statement, params, start, start_ns, end, end_ns):
    if do_profile_ctx.get():
        sql_queries.get().append((statement, params, start, start_ns, end, end_ns))


class CouchersProfiler:
    def __init__(self, do_profile=False):
        self._do_profile = do_profile
        do_profile_ctx.set(do_profile)

    def __enter__(self):
        self.report = None
        sql_queries.set([])
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
            ps.print_stats(0.1)
            basics = f"==== Run info ====\n\nStart: {self._start}\nEnd: {self._end}\nDuration: {(self._end_ns-self._start_ns)/1e6:0.2f} ms"
            cprofile = f"==== cProfile ====\n\n{s.getvalue()}"

            def format_sql(item):
                statement, params, start, start_ns, end, end_ns = item
                return f"* SQL query from {start} to {end} ({(end_ns-start_ns)/1e6:0.2f} ms)\n\n{statement}\n\nParams: {params}"

            queries = sql_queries.get()
            sql_query_info = f"==== SQL queries ====\n\nTotal {len(queries)} queries\n\n" + "\n\n\n".join(
                map(format_sql, queries)
            )
            self.report = "\n\n\n\n".join([basics, cprofile, sql_query_info])
        do_profile_ctx.set(False)
