# SQL query log

Every backend test run can record every SQL query it issues, grouped by the test that ran and by the RPC that issued
it. CI diffs that recording against the one `develop` last published and links a browsable report from the PR comment,
so a pull request can be reviewed for how it changes database access patterns before it merges.

The recording answers two questions from the same data:

- **By test** — this test called `WriteFriendReference`, which ran these 25 queries, then called `ModerateContent`,
  which ran these 17.
- **By RPC** — `ListReferences` was called from these tests, and this is what it ran in each.

The queries are stored twice: once with the bound parameters replaced by `?`, which is the key used for grouping and
diffing, and once with the values inlined, so a query can be copied out of the report and pasted straight into a
`psql` prompt to run `EXPLAIN ANALYZE` against real data.

## Running it locally

From `/app/backend`:

```bash
uv run pytest --query-log src
```

This writes `test_artifacts/queries/data.local.json` (gitignored). Without the flag nothing is recorded and the
overhead is nil, so ordinary runs are unaffected.

To render the report locally, then browse it over HTTP (the page fetches its data, so `file://` will not work):

```bash
uv run python ../scripts/query_log_report.py --input test_artifacts/queries --output test_artifacts/queries
python3 -m http.server --directory test_artifacts/queries
```

Passing `--baseline path/to/other/data.json` compares two recordings, which is how the CI diff works.

## How it fits together

| Piece | What it does |
| --- | --- |
| `src/tests/fixtures/query_log.py` | Records queries via a SQLAlchemy `after_cursor_execute` listener, writes `data.<node>.json` |
| `src/tests/conftest.py` | Registers `--query-log`, attributes queries to the running test, dumps at session end |
| `app/scripts/query_log_report.py` | Merges the per-node dumps, diffs against the baseline, renders `index.html` |
| `test:backend` | Runs pytest with `--query-log`; the existing `after_script` collects `test_artifacts` |
| `preview:backend-coverage` | Merges, fetches develop's baseline, renders the report |
| `preview:backend` | Uploads it to the preview bucket and adds the PR comment item |

The report is published at `https://<sha>--test-artifacts.preview.couchershq.org/queries/index.html`. Its `data.json`
is what the next pipeline compares against, fetched from the `develop--test-artifacts` host.

## Attribution

Queries are grouped into spans, in the order they occurred:

- `rpc` — the handler and its session, for both the `FakeChannel` sessions and the real-server ones
- `auth` — the token lookup that precedes a handler. Kept separate so a constant per-call cost is not mistaken for
  the handler's own work; this matches the boundary `couchers/perf.py` uses in production
- `job` — a `process_jobs()` drain
- `body` — anything else: fixture setup, or a test using `session_scope()` directly

## Caveats worth knowing

**Ordering within a span is not compared.** Background jobs are drained with
`ORDER BY priority DESC, next_attempt_after ASC`, and jobs queued in one transaction tie on both columns, so Postgres
is free to pick either. The diff therefore compares the multiset of queries in a span, not their sequence. The report
still displays the real recorded order.

**The inlined values come from a truncated test database.** `RESTART IDENTITY` runs before each test, so ids are small
integers and a query reads `WHERE users.id = 3`. That user has no friends, no references and no messages, and may not
exist in production at all. Treat the values as a template: swap in a representative row before drawing conclusions
from a plan, or the planner will make a choice that has nothing to do with production.

**Job spans are not split by job type.** `Job` is a frozen dataclass that derives its name and payload type from the
handler's `__name__` and type hints, so wrapping handlers to name them breaks `get_type_hints`. Splitting these out
wants a span alongside the existing tracer span in `couchers/jobs/worker.py`.

**A shared fixture change moves everything.** Adding one query to `generate_user()` shifts every test at once. That is
real, but it drowns the report, so treat a diff that touches most tests as a signal to look at the fixture rather than
the tests.
