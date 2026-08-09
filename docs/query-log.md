# SQL query log

Every backend test run can record every SQL query it issues, grouped by the test that ran and by the RPC that issued it. CI diffs that recording against the one `develop` last published and links a browsable report from the sticky PR comment, so a pull request can be reviewed for how it changes database access patterns before it merges.

The same recording reads two ways: by test (this test called `WriteFriendReference`, which ran these 25 queries, then `ModerateContent`, which ran these 17) and by RPC (`ListReferences` was called from these tests, and this is what it ran in each). Each query is stored twice, once with the bound parameters replaced by `?`, which is the key used for grouping and diffing, and once with the values inlined so it can be pasted straight into a `psql` prompt.

Every execution also records the innermost few `couchers/` frames that issued it:

```
couchers/db.py:164 in are_friends <- couchers/servicers/references.py:243 in WriteFriendReference
```

Consecutive executions of the same query from the same line collapse into one row with a count, so an N+1 shows up as a single entry naming the line responsible. Call sites are deliberately kept out of the diff key: line numbers move whenever anything above them is edited, and a diff that flags every query in a touched file is useless.

## Running it locally

From `/app/backend`:

```bash
uv run pytest --query-log src
```

This writes `test_artifacts/queries/data.local.json.gz` (gitignored; read it with `gunzip -c`). Without the flag nothing is recorded, so ordinary runs are unaffected. To render the report and browse it over HTTP (the page fetches its data, so `file://` will not work):

```bash
uv run python ../scripts/query_log_report.py --input test_artifacts/queries --output test_artifacts/queries
python3 -m http.server --directory test_artifacts/queries
```

Passing `--baseline path/to/other/data.json.gz` compares two recordings, which is how the CI diff works.

## In CI

Governed by the `BACKEND_QUERY_LOG` pipeline variable, alongside `DO_CHECKS` and `BUILD_WEB` at the top of `app/.gitlab-ci.yml`. Set it to anything other than `"true"` and the recording, the report and the PR comment item all drop out together; nothing else in the pipeline changes. Override it for a single run from GitLab's "Run pipeline" form without editing the file.

| Piece | What it does |
| --- | --- |
| `src/tests/fixtures/query_log.py` | Records queries via a SQLAlchemy `after_cursor_execute` listener, writes `data.<node>.json.gz` |
| `src/tests/conftest.py` | Registers `--query-log`, attributes queries to the running test, dumps at session end |
| `app/scripts/query_log_report.py` | Merges the per-node dumps, diffs against the baseline, renders `index.html` |
| `test:backend` | Runs pytest with `--query-log`; the existing `after_script` collects `test_artifacts` |
| `preview:backend-coverage` | Merges, fetches develop's baseline, renders the report |
| `preview:backend` | Uploads it to the preview bucket and adds the PR comment item |

The report is published at `https://<sha>--test-artifacts.preview.couchershq.org/queries/index.html`, and its `data.json.gz` is what the next pipeline compares against. To read one by hand: `curl -s https://develop--test-artifacts.preview.couchershq.org/queries/data.json.gz | gunzip | jq keys`.

The render step cannot fail its job, and the comment item is added only when the report actually exists, so a broken query log never takes the rest of the sticky PR comment — schema, schema diff, emails, coverage — down with it.

## Reading a report

Queries are grouped into spans, in the order they occurred:

- `rpc` — the handler and its session, for both the `FakeChannel` sessions and the real-server ones
- `auth` — the token lookup that precedes a handler, kept separate so a constant per-call cost is not mistaken for the handler's own work; this matches the boundary `couchers/perf.py` uses in production
- `job` — a `process_jobs()` drain, not split by job type
- `body` — anything else: fixture setup, or a test using `session_scope()` directly

Caveats worth knowing:

- **Ordering within a span is not compared**, only the multiset of queries. Background jobs tie on their queue ordering and SQLAlchemy varies the order of a `selectinload()` fan-out, so the sequence differs between otherwise identical runs. The report still displays the real recorded order.
- **The inlined values come from a truncated test database.** `RESTART IDENTITY` runs before each test, so a query reads `WHERE users.id = 3`, and that user has no friends, references or messages. Treat the values as a template and swap in a representative row before drawing conclusions from a plan.
- **The baseline is `develop`'s latest, not your merge base.** A branch that is behind shows `develop`'s own changes back to front, as if the branch had reverted them. Rebase before reading a diff that looks surprising.
- **A shared fixture change moves everything.** Adding one query to `generate_user()` shifts every test at once. That is real, but it drowns the report, so treat a diff that touches most tests as a signal to look at the fixture rather than the tests.
- **Statements are capped at 4 KB and long inlined literals are collapsed.** Some SQL carries its data as literals in the statement text rather than binding it, and nothing can group those by parameter; without the cap a single CI node's dump reached 495 MB. `src/tests/test_db.py` is not recorded at all, being schema plumbing already covered by the schema diff.
