#!/usr/bin/env python3
"""Merges the per-node SQL query logs from the backend test run, diffs them against develop's and renders a report.

The recorder is src/tests/fixtures/query_log.py, which writes one data.<node>.json per pytest-split node. This script
unions those, compares against the baseline published by the last develop pipeline, and writes:

  data.json    the merged log, which becomes the next baseline
  index.html   a self-contained browsable report, by test and by RPC, defaulting to what changed

Usage:
  query_log_report.py --input DIR --output DIR [--baseline data.json] [--summary-file FILE]

Diffing canonicalises each span to a multiset of query shapes. Ordering within a span is not stable: background jobs
are drained with ORDER BY priority DESC, next_attempt_after ASC, and jobs queued in one transaction tie on both, so
Postgres picks freely. The report still displays the real recorded order.
"""

import argparse
import collections
import difflib
import html
import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

Span = dict[str, Any]


def merge_nodes(input_dir: Path) -> dict[str, Any]:
    shapes: dict[str, dict[str, Any]] = {}
    tests: dict[str, list[Span]] = {}
    files = sorted(input_dir.glob("data.*.json"))
    if not files:
        raise SystemExit(f"no data.*.json found in {input_dir}")
    for path in files:
        data = json.loads(path.read_text())
        for shape_id, shape in data["shapes"].items():
            existing = shapes.get(shape_id)
            # Shape ids are content hashes so nodes agree on them; pick the same `example` a single-node run
            # would have, i.e. the one from the lexicographically first test that produced it.
            if existing is None or shape["first_seen_in"] < existing["first_seen_in"]:
                shapes[shape_id] = shape
        # pytest-split gives each test to exactly one node, so this cannot collide.
        tests.update(data["tests"])
    print(f"merged {len(files)} node files: {len(tests)} tests, {len(shapes)} distinct query shapes")
    return {"shapes": shapes, "tests": dict(sorted(tests.items()))}


def canonical(span: Span) -> tuple[Any, ...]:
    counts = tuple(sorted(collections.Counter(span["queries"]).items()))
    return (span["kind"], span["name"], counts)


def diff(current: dict[str, Any], baseline: dict[str, Any] | None) -> dict[str, Any]:
    if baseline is None:
        return {"has_baseline": False, "tests": {}, "added_shapes": [], "removed_shapes": [], "rpcs": {}}

    cur_shape_ids, base_shape_ids = set(current["shapes"]), set(baseline["shapes"])
    added_shapes = sorted(cur_shape_ids - base_shape_ids)
    removed_shapes = [
        {"id": sid, "sql": baseline["shapes"][sid]["sql"]} for sid in sorted(base_shape_ids - cur_shape_ids)
    ]

    per_test: dict[str, Any] = {}
    for test, spans in current["tests"].items():
        base_spans = baseline["tests"].get(test)
        if base_spans is None:
            per_test[test] = {"status": "added", "spans": [{"status": "new"} for _ in spans], "removed": []}
            continue
        cur_keys = [canonical(s) for s in spans]
        base_keys = [canonical(s) for s in base_spans]
        if cur_keys == base_keys:
            continue

        annotations: list[dict[str, Any]] = [{"status": "same"} for _ in spans]
        removed: list[dict[str, Any]] = []
        matcher = difflib.SequenceMatcher(a=base_keys, b=cur_keys, autojunk=False)
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                continue
            if tag in ("insert", "replace"):
                for offset, j in enumerate(range(j1, j2)):
                    # Within a replace block, pair positionally so the before-counts line up where they can.
                    before_index = i1 + offset
                    if tag == "replace" and before_index < i2:
                        annotations[j] = {
                            "status": "changed",
                            "before": len(base_spans[before_index]["queries"]),
                            "before_counts": dict(collections.Counter(base_spans[before_index]["queries"])),
                        }
                    else:
                        annotations[j] = {"status": "new"}
            if tag in ("delete", "replace"):
                for i in range(i1 + (j2 - j1) if tag == "replace" else i1, i2):
                    if i < len(base_spans):
                        span = base_spans[i]
                        removed.append({"kind": span["kind"], "name": span["name"], "count": len(span["queries"])})
        per_test[test] = {"status": "changed", "spans": annotations, "removed": removed}

    for test in baseline["tests"]:
        if test not in current["tests"]:
            per_test[test] = {"status": "removed", "spans": [], "removed": []}

    return {
        "has_baseline": True,
        "tests": per_test,
        "added_shapes": added_shapes,
        "removed_shapes": removed_shapes,
        "rpcs": rpc_rollup(current, baseline),
    }


def rpc_rollup(current: dict[str, Any], baseline: dict[str, Any] | None) -> dict[str, Any]:
    """Per-RPC totals. Max queries in a single call is the useful N+1 signal; averages hide it."""

    def totals(data: dict[str, Any]) -> dict[str, dict[str, int]]:
        out: dict[str, dict[str, int]] = {}
        for spans in data["tests"].values():
            for span in spans:
                if span["kind"] != "rpc":
                    continue
                name = (span["name"] or "").split("/")[-1]
                entry = out.setdefault(name, {"calls": 0, "total": 0, "max": 0})
                entry["calls"] += 1
                entry["total"] += len(span["queries"])
                entry["max"] = max(entry["max"], len(span["queries"]))
        return out

    cur = totals(current)
    base = totals(baseline) if baseline else {}
    rolled: dict[str, Any] = {}
    for name in sorted(set(cur) | set(base)):
        c = cur.get(name, {"calls": 0, "total": 0, "max": 0})
        b = base.get(name, {"calls": 0, "total": 0, "max": 0})
        if c != b:
            rolled[name] = {"current": c, "baseline": b}
    return rolled


def summarise(report: dict[str, Any]) -> str:
    if not report["has_baseline"]:
        return "no develop baseline to compare against"
    changed = [t for t, v in report["tests"].items() if v["status"] == "changed"]
    added = [t for t, v in report["tests"].items() if v["status"] == "added"]
    removed = [t for t, v in report["tests"].items() if v["status"] == "removed"]
    parts = [f"+{len(report['added_shapes'])}/-{len(report['removed_shapes'])} query shapes"]
    if changed:
        parts.append(f"{len(changed)} test{'s' if len(changed) != 1 else ''} changed")
    if added or removed:
        parts.append(f"{len(added)} added, {len(removed)} removed")
    worst = None
    for name, v in report["rpcs"].items():
        delta = v["current"]["max"] - v["baseline"]["max"]
        if v["baseline"]["calls"] and (worst is None or delta > worst[1]):
            worst = (name, delta, v)
    if worst and worst[1] > 0:
        name, _, v = worst
        parts.append(f"worst: {name} {v['baseline']['max']}->{v['current']['max']} queries/call")
    if not changed and not added and not removed and not report["added_shapes"]:
        return "no change in DB access patterns"
    return " · ".join(parts)


PAGE_CSS = """
:root { color-scheme: light dark; --bg:#fff; --fg:#1a1a1a; --muted:#666; --line:#e2e2e2;
        --card:#fafafa; --add:#1a7f37; --del:#b3261e; --chg:#8a5a00; --code:#f6f8fa; }
@media (prefers-color-scheme: dark) {
  :root { --bg:#131313; --fg:#e8e8e8; --muted:#9a9a9a; --line:#2e2e2e;
          --card:#1b1b1b; --add:#4ec36f; --del:#ef6f66; --chg:#d9a441; --code:#1e1e1e; }
}
* { box-sizing:border-box; }
body { margin:0; padding:1.5rem; background:var(--bg); color:var(--fg);
       font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
h1 { font-size:1.3rem; margin:0 0 .25rem; }
.sub { color:var(--muted); margin-bottom:1rem; }
.bar { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-bottom:1rem;
       position:sticky; top:0; background:var(--bg); padding:.5rem 0; border-bottom:1px solid var(--line); z-index:2; }
button, input { font:inherit; color:inherit; background:var(--card);
                border:1px solid var(--line); border-radius:6px; padding:.35rem .7rem; }
button { cursor:pointer; }
button.on { background:var(--fg); color:var(--bg); border-color:var(--fg); }
input[type=search] { flex:1; min-width:12rem; }
.summary { background:var(--card); border:1px solid var(--line); border-radius:8px;
           padding:.75rem 1rem; margin-bottom:1rem; }
.summary b { font-weight:600; }
details { border:1px solid var(--line); border-radius:8px; margin-bottom:.5rem; background:var(--card); }
details > summary { cursor:pointer; padding:.6rem .8rem; list-style:none; display:flex;
                    gap:.5rem; align-items:center; flex-wrap:wrap; }
details > summary::-webkit-details-marker { display:none; }
.name { font-weight:600; }
.tag { font-size:.75rem; padding:.1rem .45rem; border-radius:99px; border:1px solid var(--line); color:var(--muted); }
.tag.new { color:var(--add); border-color:var(--add); }
.tag.changed { color:var(--chg); border-color:var(--chg); }
.tag.removed { color:var(--del); border-color:var(--del); }
.body { padding:0 .8rem .8rem; }
.span { border-top:1px solid var(--line); padding:.5rem 0; }
.span-head { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
.kind { font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
.q { margin:.35rem 0 0 0; padding:.4rem .6rem; background:var(--code);
     border:1px solid var(--line); border-radius:6px; }
.q-head { display:flex; gap:.5rem; align-items:center; }
.q pre { margin:.35rem 0 0; overflow-x:auto; white-space:pre-wrap; word-break:break-word;
         font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace; max-height:22em; overflow-y:auto; }
.rep { font-weight:600; color:var(--chg); }
.copy { padding:.15rem .5rem; font-size:.75rem; }
.muted { color:var(--muted); }
table { border-collapse:collapse; width:100%; }
th, td { text-align:left; padding:.3rem .6rem; border-bottom:1px solid var(--line); }
th { color:var(--muted); font-weight:600; }
.num { text-align:right; font-variant-numeric:tabular-nums; }
.up { color:var(--del); font-weight:600; }
.down { color:var(--add); }
.hidden { display:none; }
"""

PAGE_JS = r"""
const $ = s => document.querySelector(s);
const diff = DIFF;
let shapes = {}, tests = {}, byRpc = {};

let mode = 'test', changedOnly = diff.has_baseline, showRunnable = true, filter = '';

function buildIndex() {
  // RPC -> [{test, spanIndex}]. The second index: same recording, read the other direction.
  byRpc = {};
  for (const [test, spans] of Object.entries(tests))
    spans.forEach((s, i) => {
      if (s.kind !== 'rpc') return;
      const name = (s.name || '').split('/').pop();
      (byRpc[name] = byRpc[name] || []).push({test, spanIndex: i});
    });
}

const esc = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const testStatus = t => (diff.tests[t] || {}).status || 'same';
const spanAnn = (t, i) => ((diff.tests[t] || {}).spans || [])[i] || {status: 'same'};

function shapeHtml(id, reps) {
  const sh = shapes[id];
  if (!sh) return '';
  const sql = showRunnable ? sh.example : sh.sql;
  const repBadge = reps > 1 ? `<span class="rep">×${reps}</span>` : '';
  const nPlusOne = reps > 3 ? `<span class="tag changed">possible N+1</span>` : '';
  const write = sh.write ? '<span class="tag">write</span>' : '';
  const isNew = diff.added_shapes && diff.added_shapes.includes(id) ? '<span class="tag new">new shape</span>' : '';
  return `<div class="q"><div class="q-head">${repBadge}${nPlusOne}${write}${isNew}
    <button class="copy" data-sql="${esc(sql).replace(/"/g, '&quot;')}">copy</button></div>
    <pre>${esc(sql)}</pre></div>`;
}

function spanHtml(test, span, i) {
  const ann = spanAnn(test, i);
  const label = span.kind === 'body' ? 'test body' : (span.name || '').split('/').pop();
  let delta = '';
  if (ann.status === 'changed') delta = `<span class="tag changed">${ann.before} → ${span.queries.length}</span>`;
  if (ann.status === 'new') delta = `<span class="tag new">new</span>`;
  // Collapse consecutive repeats so an N+1 reads as one row with a count.
  const runs = [];
  for (const id of span.queries) {
    const last = runs[runs.length - 1];
    if (last && last.id === id) last.n++; else runs.push({id, n: 1});
  }
  return `<div class="span"><div class="span-head"><span class="kind">${span.kind}</span>
    <span class="name">${esc(label)}</span><span class="muted">${span.queries.length} queries</span>${delta}</div>
    ${runs.map(r => shapeHtml(r.id, r.n)).join('')}</div>`;
}

function renderByTest() {
  const names = Object.keys(tests).filter(t => {
    if (changedOnly && testStatus(t) === 'same') return false;
    return !filter || t.toLowerCase().includes(filter);
  });
  if (!names.length) return '<p class="muted">Nothing matches.</p>';
  return names.map(t => {
    const st = testStatus(t);
    const spans = tests[t];
    const tag = st === 'same' ? '' : `<span class="tag ${st}">${st}</span>`;
    const rem = ((diff.tests[t] || {}).removed || []).map(r =>
      `<div class="span"><span class="tag removed">removed</span> <span class="name">${esc((r.name || r.kind))}</span>
       <span class="muted">${r.count} queries</span></div>`).join('');
    const total = spans.reduce((a, s) => a + s.queries.length, 0);
    return `<details><summary><span class="name">${esc(t)}</span>${tag}
      <span class="muted">${spans.length} spans, ${total} queries</span></summary>
      <div class="body">${spans.map((s, i) => spanHtml(t, s, i)).join('')}${rem}</div></details>`;
  }).join('');
}

function renderByRpc() {
  const names = Object.keys(byRpc).sort().filter(n => {
    if (changedOnly && !(diff.rpcs && diff.rpcs[n])) return false;
    return !filter || n.toLowerCase().includes(filter);
  });
  if (!names.length) return '<p class="muted">Nothing matches.</p>';
  return names.map(n => {
    const callers = byRpc[n];
    const d = diff.rpcs && diff.rpcs[n];
    let tag = '';
    if (d) {
      const cls = d.current.max > d.baseline.max ? 'up' : 'down';
      tag = `<span class="tag changed">max/call <span class="${cls}">${d.baseline.max} → ${d.current.max}</span></span>`;
    }
    const worst = Math.max(...callers.map(c => tests[c.test][c.spanIndex].queries.length));
    const inner = callers
      .sort((a, b) => tests[b.test][b.spanIndex].queries.length - tests[a.test][a.spanIndex].queries.length)
      .map(c => `<div class="span"><div class="span-head"><span class="kind">called from</span>
        <span class="name">${esc(c.test)}</span>
        <span class="muted">${tests[c.test][c.spanIndex].queries.length} queries</span>
        ${testStatus(c.test) !== 'same' ? `<span class="tag ${testStatus(c.test)}">${testStatus(c.test)}</span>` : ''}
        </div>${(() => {
          const span = tests[c.test][c.spanIndex];
          const runs = [];
          for (const id of span.queries) {
            const last = runs[runs.length - 1];
            if (last && last.id === id) last.n++; else runs.push({id, n: 1});
          }
          return runs.map(r => shapeHtml(r.id, r.n)).join('');
        })()}</div>`).join('');
    return `<details><summary><span class="name">${esc(n)}</span>${tag}
      <span class="muted">${callers.length} calls, worst ${worst} queries</span></summary>
      <div class="body">${inner}</div></details>`;
  }).join('');
}

function render() {
  $('#list').innerHTML = mode === 'test' ? renderByTest() : renderByRpc();
  $('#m-test').classList.toggle('on', mode === 'test');
  $('#m-rpc').classList.toggle('on', mode === 'rpc');
  $('#changed').classList.toggle('on', changedOnly);
  $('#runnable').classList.toggle('on', showRunnable);
  $('#runnable').textContent = showRunnable ? 'runnable SQL' : 'parameterized';
}

$('#m-test').onclick = () => { mode = 'test'; render(); };
$('#m-rpc').onclick = () => { mode = 'rpc'; render(); };
$('#changed').onclick = () => { changedOnly = !changedOnly; render(); };
$('#runnable').onclick = () => { showRunnable = !showRunnable; render(); };
$('#q').oninput = e => { filter = e.target.value.toLowerCase(); render(); };
document.addEventListener('click', e => {
  const b = e.target.closest('.copy');
  if (!b) return;
  navigator.clipboard.writeText(b.dataset.sql).then(() => {
    b.textContent = 'copied'; setTimeout(() => { b.textContent = 'copy'; }, 1200);
  });
});

// The log runs to tens of megabytes, so it is fetched rather than inlined. data.json doubles as the baseline
// the next develop pipeline compares against.
fetch('data.json').then(r => r.json()).then(d => {
  shapes = d.shapes; tests = d.tests;
  buildIndex();
  render();
}).catch(err => {
  $('#list').innerHTML = `<p class="muted">Could not load data.json (${esc(String(err))}).
    Opening this file over file:// will not work; serve the directory over HTTP.</p>`;
});
"""


def render_html(current: dict[str, Any], report: dict[str, Any], commit: str) -> str:
    n_tests = len(current["tests"])
    n_shapes = len(current["shapes"])
    summary_rows = ""
    if report["has_baseline"] and report["rpcs"]:
        rows = []
        for name, v in sorted(
            report["rpcs"].items(), key=lambda kv: kv[1]["baseline"]["max"] - kv[1]["current"]["max"]
        ):
            cur, base = v["current"], v["baseline"]
            cls = "up" if cur["max"] > base["max"] else "down" if cur["max"] < base["max"] else ""
            rows.append(
                f"<tr><td>{html.escape(name)}</td>"
                f"<td class='num'>{base['calls']} → {cur['calls']}</td>"
                f"<td class='num'>{base['total']} → {cur['total']}</td>"
                f"<td class='num {cls}'>{base['max']} → {cur['max']}</td></tr>"
            )
        summary_rows = (
            "<table><tr><th>RPC</th><th class='num'>calls</th><th class='num'>total queries</th>"
            f"<th class='num'>max/call</th></tr>{''.join(rows)}</table>"
        )
    baseline_note = (
        "Compared against the last <code>develop</code> pipeline."
        if report["has_baseline"]
        else "<b>No baseline available</b> — showing this run only."
    )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SQL query log — {html.escape(commit)}</title>
<style>{PAGE_CSS}</style></head><body>
<h1>SQL query log</h1>
<div class="sub">{n_tests} tests · {n_shapes} distinct query shapes · commit <code>{html.escape(commit)}</code></div>
<div class="summary"><b>{html.escape(summarise(report))}</b><div class="sub">{baseline_note}
Ordering within a span is not compared: background jobs tie on their queue ordering, so the drain order varies
between runs. Query counts and shapes are compared.</div>{summary_rows}</div>
<div class="bar">
  <button id="m-test">by test</button><button id="m-rpc">by RPC</button>
  <button id="changed">changed only</button><button id="runnable">runnable SQL</button>
  <input type="search" id="q" placeholder="filter by test or RPC name">
</div>
<div id="list"><p class="muted">Loading…</p></div>
<script>const DIFF = {json.dumps(report, separators=(",", ":"))};</script>
<script>{PAGE_JS}</script>
</body></html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="directory holding data.<node>.json files")
    parser.add_argument("--output", required=True, type=Path, help="directory to write data.json and index.html to")
    parser.add_argument("--baseline", type=Path, help="develop's merged data.json, if available")
    parser.add_argument("--baseline-url", help="fetch the baseline from here instead; missing or broken is not fatal")
    parser.add_argument("--summary-file", type=Path, help="write the one-line summary here for the PR comment")
    parser.add_argument("--commit", default="", help="commit sha, shown in the report header")
    args = parser.parse_args()

    current = merge_nodes(args.input)
    baseline = None
    if args.baseline and args.baseline.exists() and args.baseline.stat().st_size:
        baseline = json.loads(args.baseline.read_text())
    elif args.baseline_url:
        # Absent until develop has published one, and a broken baseline must not fail the pipeline: the report
        # simply falls back to describing this run.
        try:
            with urllib.request.urlopen(args.baseline_url, timeout=60) as response:
                baseline = json.loads(response.read())
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            print(f"could not fetch baseline from {args.baseline_url}: {e}")
    if baseline is not None:
        print(f"baseline: {len(baseline['tests'])} tests, {len(baseline['shapes'])} shapes")
    else:
        print("no usable baseline; reporting this run only")

    report = diff(current, baseline)
    summary = summarise(report)
    print(f"summary: {summary}")

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "data.json").write_text(json.dumps(current, separators=(",", ":"), sort_keys=True))
    (args.output / "index.html").write_text(render_html(current, report, args.commit))
    if args.summary_file:
        args.summary_file.write_text(summary)


if __name__ == "__main__":
    main()
