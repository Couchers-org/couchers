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

Every execution also records the line that issued it, as the innermost few `couchers/` frames:

```
couchers/db.py:164 in are_friends <- couchers/servicers/references.py:243 in WriteFriendReference
```

Consecutive executions of the same query from the same line collapse into one row with a count, so an N+1 shows up as
a single entry naming the line responsible. Call sites are deliberately kept out of the diff key: line numbers move
whenever anything above them is edited, and a diff that flags every query in a touched file is useless.

## Running it locally

From `/app/backend`:

```bash
uv run pytest --query-log src
```

This writes `test_artifacts/queries/data.local.json.gz` (gitignored; read it with `gunzip -c`). Without the flag
nothing is recorded and the overhead is nil, so ordinary runs are unaffected.

To render the report locally, then browse it over HTTP (the page fetches its data, so `file://` will not work):

```bash
uv run python ../scripts/query_log_report.py --input test_artifacts/queries --output test_artifacts/queries
python3 -m http.server --directory test_artifacts/queries
```

Passing `--baseline path/to/other/data.json` compares two recordings, which is how the CI diff works.

## Turning it on and off

Locally it is off unless you pass `--query-log`, and costs nothing when off.

In CI it is governed by the `BACKEND_QUERY_LOG` pipeline variable, alongside `DO_CHECKS` and `BUILD_WEB` at the top
of `app/.gitlab-ci.yml`. Set it to anything other than `"true"` and the recording, the report and the PR comment
item all drop out together; nothing else in the pipeline changes. Override it for a single run from GitLab's "Run
pipeline" form without editing the file.

Turn all three off together rather than one of them. The report step treats an empty input directory as an error, so
recording without reporting fails `preview:backend-coverage`, which blocks `preview:backend` and takes the whole
sticky PR comment — schema, schema diff, emails, coverage — with it.

Turning it off leaves the query log item sitting in the comment on any PR that already has one, since each writer
only rewrites the items it owns. New comments simply will not have it.

## How it fits together

| Piece | What it does |
| --- | --- |
| `src/tests/fixtures/query_log.py` | Records queries via a SQLAlchemy `after_cursor_execute` listener, writes `data.<node>.json.gz` |
| `src/tests/conftest.py` | Registers `--query-log`, attributes queries to the running test, dumps at session end |
| `app/scripts/query_log_report.py` | Merges the per-node dumps, diffs against the baseline, renders `index.html` |
| `test:backend` | Runs pytest with `--query-log` when `BACKEND_QUERY_LOG` is on; the existing `after_script` collects `test_artifacts` |
| `preview:backend-coverage` | Merges, fetches develop's baseline, renders the report |
| `preview:backend` | Uploads it to the preview bucket and adds the PR comment item |

The report is published at `https://<sha>--test-artifacts.preview.couchershq.org/queries/index.html`. Its
`data.json.gz` is what the next pipeline compares against, fetched from the `develop--test-artifacts` host.

The recording is stored gzipped and inflated in the browser with `DecompressionStream`, because it is mostly repeated
SQL and compresses about twenty-fold — a few megabytes raw becomes a couple of hundred kilobytes over the wire. The
page copes with a host that sets `Content-Encoding: gzip` and inflates it in transit, and `query_log_report.py`
accepts a baseline either way, since `urllib` does not inflate the way a browser does. To read it by hand:

```bash
curl -s https://develop--test-artifacts.preview.couchershq.org/queries/data.json.gz | gunzip | jq keys
```

## Attribution

Queries are grouped into spans, in the order they occurred:

- `rpc` — the handler and its session, for both the `FakeChannel` sessions and the real-server ones
- `auth` — the token lookup that precedes a handler. Kept separate so a constant per-call cost is not mistaken for
  the handler's own work; this matches the boundary `couchers/perf.py` uses in production
- `job` — a `process_jobs()` drain
- `body` — anything else: fixture setup, or a test using `session_scope()` directly

## Caveats worth knowing

**Ordering within a span is not compared.** The diff compares the multiset of queries in a span, not their sequence.
The report still displays the real recorded order. Two sources make the sequence vary between otherwise identical
runs:

- Background jobs are drained with `ORDER BY priority DESC, next_attempt_after ASC`, and jobs queued in one
  transaction tie on both columns, so Postgres is free to pick either.
- SQLAlchemy emits the `selectinload()` fan-out for a query in an order that is not stable across processes.
  `GetPublicUser` loads four relationships this way and their four `SELECT`s come out in a different order between
  runs. It is deterministic when `test_public.py` runs on its own, so it depends on state built up earlier in the
  session rather than on anything we pass in.

Two full-suite runs currently differ in the sequence of 4 of 960 recorded tests, and in the multiset of none of
them.

**The inlined values come from a truncated test database.** `RESTART IDENTITY` runs before each test, so ids are small
integers and a query reads `WHERE users.id = 3`. That user has no friends, no references and no messages, and may not
exist in production at all. Treat the values as a template: swap in a representative row before drawing conclusions
from a plan, or the planner will make a choice that has nothing to do with production.

**Job spans are not split by job type.** `Job` is a frozen dataclass that derives its name and payload type from the
handler's `__name__` and type hints, so wrapping handlers to name them breaks `get_type_hints`. Splitting these out
wants a span alongside the existing tracer span in `couchers/jobs/worker.py`.

**Statements are capped, and bulk loads are collapsed.** Some SQL inlines its data as literals in the statement text
rather than binding it — the real `timezone_areas.sql` applied by the migrations is a few hundred `INSERT`s each
carrying megabytes of WKB hex. Nothing can group those by parameter, so the recorder collapses long quoted literals
and repeated `VALUES` tuples, and caps each stored statement at 4 KB with a `/* truncated by the query log */`
marker so an over-long entry is visibly not runnable rather than silently invalid. Without this a single CI node's
dump reached 495 MB. `query_log_report.py` warns if the merged recording exceeds 50 MB.

**`src/tests/test_db.py` is not recorded.** It rebuilds the schema from migrations to diff it against the models,
which is schema plumbing rather than an access pattern and is already covered by the schema-diff artifact. This is
not what keeps the real `timezone_areas.sql` out of the recording — `test_migrations` is skipped in `test:backend`
regardless, since the backend image has no `pg_dump` — the statement cap above is what bounds the artifact.

**The baseline is `develop`'s latest, not your merge base.** A branch that is behind will show `develop`'s own
changes back to front, as if the branch had reverted them. Rebase before reading a diff that looks surprising.

**A shared fixture change moves everything.** Adding one query to `generate_user()` shifts every test at once. That is
real, but it drowns the report, so treat a diff that touches most tests as a signal to look at the fixture rather than
the tests.
