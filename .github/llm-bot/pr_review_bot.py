"""
PR review bot.

Three subcommands, run in order by .github/workflows/code-review.yml:

  gate         gather facts, apply the deterministic rules, approve outright or ask for a review
  query-diff   work out which SQL the branch newly issues, for the review prompt
  apply        turn the review's verdict into a review on the PR

The split exists so that the model is never the thing that approves a pull request. `gate` decides whether an approval
is permitted at all and records that in `auto_stamp_eligible`; the review can only ever spend that permission, never
grant it. `apply` re-reads the gate's decision and refuses to approve without it, so a review that comes back with an
enthusiastic verdict on a migration still gets posted as a comment.

Python also owns the review body, because the body carries the marker that the next run's rebase detection reads. A
64-character hash is not something to ask a model to copy accurately.

The prompt's context and the review's verdict travel between the commands as files in the working directory, so all
three have to run in one job. The gate's decision is the exception: it reaches `apply` as step outputs, because the
review holds a Write tool and so can reach anything on disk. See `_set_outputs`.

The pull request's own code is checked out read-only into `pr-head/` for the review to read, but nothing ever runs it:
no install step touches it, and the review's Bash access is two `gh` subcommands. That matters because
`pull_request_target` hands this job's PR-approving token to forks as well.
"""

import argparse
import gzip
import importlib.util
import json
import os
import time
from pathlib import Path
from typing import Any

import requests
from github import Auth, Github
from github.PullRequest import PullRequest

from pr_review_rules import (
    Action,
    ChangedFile,
    Codeowners,
    GateDecision,
    PullRequestFacts,
    gate,
    marker,
    may_approve,
    parse_marker,
    patch_fingerprint,
)

# ============================================================================
# Configuration
# ============================================================================

REPO_ROOT = Path(__file__).resolve().parents[2]
CODEOWNERS_PATH = REPO_ROOT / ".github" / "CODEOWNERS"
QUERY_LOG_REPORT = REPO_ROOT / "app" / "scripts" / "query_log_report.py"

CONTEXT_FILE = Path("pr-review-context.md")
QUERIES_FILE = Path("pr-review-queries.md")
VERDICT_FILE = Path("pr-review-verdict.json")

PREVIEW_DOMAIN = os.environ.get("PREVIEW_DOMAIN", "preview.couchershq.org")
BASELINE_REF = os.environ.get("BASELINE_REF", "develop")

# GitLab publishes the merged query log under the short sha once the backend pipeline finishes, which is well after
# GitHub fires this workflow. Wait for it, but never let it hold the review hostage.
QUERY_LOG_TIMEOUT = int(os.environ.get("QUERY_LOG_TIMEOUT", "900"))
QUERY_LOG_POLL_INTERVAL = 30
GITLAB_SHORT_SHA_LENGTH = 8

# How many newly-issued statements to put in front of the reviewer. Past this the branch has changed database access
# broadly enough that the full report is the thing to read, not a list.
MAX_QUERIES_SHOWN = 40

BACKEND_PREFIXES = ("app/backend/", "app/proto/")


# ============================================================================
# GitHub plumbing
# ============================================================================


def _client() -> tuple[Github, PullRequest, str]:
    repo_name = os.environ["REPOSITORY"]
    github = Github(auth=Auth.Token(os.environ["GITHUB_TOKEN"]))
    pr = github.get_repo(repo_name).get_pull(int(os.environ["PR_NUMBER"]))
    return github, pr, repo_name


def _fetch_diff(repo_name: str, number: int) -> str | None:
    """The PR's diff against its merge base, or None when GitHub declines to render it."""
    response = requests.get(
        f"https://api.github.com/repos/{repo_name}/pulls/{number}",
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github.v3.diff",
        },
        timeout=60,
    )
    # 406 is GitHub refusing to render a diff that large. There is nothing to fingerprint and no point asking again.
    if response.status_code == 406:
        print("GitHub would not render the diff (too large), skipping the unchanged-diff rule")
        return None
    response.raise_for_status()
    return response.text


def _previous_verdict(pr: PullRequest) -> tuple[str, str] | None:
    """The (fingerprint, verdict) of the most recent review this bot left, if it has left one."""
    for review in reversed(list(pr.get_reviews())):
        found = parse_marker(review.body or "")
        if found:
            return found
    return None


def _author_teams(github: Github, repo_name: str, login: str, codeowners: Codeowners) -> frozenset[str]:
    """Team slugs (`org/team`) the author belongs to, so CODEOWNERS team entries resolve to a person.

    Skipped entirely when CODEOWNERS names no teams, which is the case today and saves an org-scoped API call that
    the bot's token is not otherwise required to be able to make.
    """
    if not any("/" in owner for _, owners in codeowners.rules for owner in owners):
        return frozenset()
    org_name = repo_name.split("/")[0]
    org = github.get_organization(org_name)
    user = org.get_named_user(login)
    return frozenset(f"{org_name}/{team.slug}".lower() for team in org.get_teams() if team.has_in_members(user))


def _set_outputs(**outputs: Any) -> None:
    """Publish the gate's decision as step outputs.

    These, and not a file, are how the decision reaches `apply`. A step's outputs are captured when it ends, so
    nothing that runs afterwards can alter them — including the review, which holds a Write tool and would otherwise
    be able to grant itself the approval permission it is supposed to be unable to grant.
    """
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        print(f"(no GITHUB_OUTPUT set) outputs: {outputs}")
        return
    with open(path, "a") as f:
        for key, value in outputs.items():
            f.write(f"{key}={str(value).lower() if isinstance(value, bool) else value}\n")


# ============================================================================
# gate
# ============================================================================


def _write_context(pr: PullRequest, facts: PullRequestFacts, decision: GateDecision) -> None:
    """Write the deterministic findings out for the review prompt to read."""
    lines = [
        "# Deterministic facts about this pull request",
        "",
        "These were established before any model looked at the PR. Treat them as given.",
        "",
        f"- Title: {pr.title}",
        f"- Author: @{facts.author}",
        f"- Files changed: {len(facts.files)}",
        f"- Lines changed: {facts.changed_lines}",
        f"- Auto-approval permitted if the review is clean: {'yes' if decision.auto_stamp_eligible else 'no'}",
    ]
    if decision.stamp_blockers:
        lines += ["", "Auto-approval is ruled out because:", ""]
        lines += [f"- {blocker}" for blocker in decision.stamp_blockers]
    lines += ["", "## Changed files", ""]
    lines += [f"- `{f.path}` (+{f.additions}/-{f.deletions})" for f in facts.files]
    CONTEXT_FILE.write_text("\n".join(lines) + "\n")


def cmd_gate() -> None:
    github, pr, repo_name = _client()
    diff = _fetch_diff(repo_name, pr.number)
    codeowners = Codeowners.parse(CODEOWNERS_PATH.read_text()) if CODEOWNERS_PATH.exists() else Codeowners()

    facts = PullRequestFacts(
        author=pr.user.login,
        draft=pr.draft,
        files=[ChangedFile(f.filename, f.additions, f.deletions) for f in pr.get_files()],
        fingerprint=patch_fingerprint(diff) if diff is not None else None,
        author_teams=_author_teams(github, repo_name, pr.user.login, codeowners),
        codeowners=codeowners,
        previous=_previous_verdict(pr),
    )
    decision = gate(facts)

    print(f"action={decision.action.value} ({decision.reason})")
    for blocker in decision.stamp_blockers:
        print(f"  no stamp: {blocker}")

    if decision.action == Action.APPROVE_UNCHANGED:
        # The fingerprint is unchanged by definition here, so carrying it forward keeps the chain intact across any
        # number of successive rebases.
        _approve(
            pr,
            "### Code review bot\n\nNo code changes since the last review — rebase or merge only, so the previous "
            "approval still stands.",
            facts.fingerprint or "",
        )
    elif decision.action == Action.REVIEW:
        _write_context(pr, facts, decision)

    _set_outputs(
        action=decision.action.value,
        backend_touched=any(p.startswith(BACKEND_PREFIXES) for p in facts.paths),
        auto_stamp_eligible=decision.auto_stamp_eligible,
        fingerprint=facts.fingerprint or "",
        # JSON so this stays on one line, which is all GITHUB_OUTPUT takes without a heredoc.
        stamp_blockers=json.dumps(list(decision.stamp_blockers)),
    )


# ============================================================================
# query-diff
# ============================================================================


def _load_query_log_report() -> Any:
    """Import app/scripts/query_log_report.py so the bot diffs query logs exactly the way CI does."""
    spec = importlib.util.spec_from_file_location("query_log_report", QUERY_LOG_REPORT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load {QUERY_LOG_REPORT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _fetch_query_log(url: str) -> dict[str, Any] | None:
    """Read a published query log, or None if the pipeline has not put one there."""
    response = requests.get(url, timeout=60)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    payload = response.content
    if payload[:2] == b"\x1f\x8b":
        payload = gzip.decompress(payload)
    return json.loads(payload)


def _await_query_log(sha: str) -> dict[str, Any] | None:
    """Poll for this commit's query log until the GitLab pipeline publishes it, or the deadline passes."""
    url = f"https://{sha[:GITLAB_SHORT_SHA_LENGTH]}--test-artifacts.{PREVIEW_DOMAIN}/queries/data.json.gz"
    deadline = time.monotonic() + QUERY_LOG_TIMEOUT
    while True:
        log = _fetch_query_log(url)
        if log is not None:
            return log
        if time.monotonic() >= deadline:
            print(f"gave up waiting for {url}")
            return None
        print(f"{url} not published yet, retrying in {QUERY_LOG_POLL_INTERVAL}s")
        time.sleep(QUERY_LOG_POLL_INTERVAL)


def _render_queries(current: dict[str, Any], report: dict[str, Any]) -> str:
    lines = [
        "# SQL this branch changes",
        "",
        "Recorded by the backend test suite and diffed against develop's published log. A shape is one statement with "
        "its bound parameters replaced by `?`. The inlined version below each one comes from a truncated test "
        "database, so read its values as a template rather than as representative data.",
        "",
    ]

    if not report["has_baseline"]:
        lines += ["Develop has published no query log to compare against, so nothing can be diffed.", ""]
        return "\n".join(lines)

    added, removed = report["added_shapes"], report["removed_shapes"]
    lines += [f"**{len(added)} new query shapes, {len(removed)} no longer issued.**", ""]

    if not added and not removed:
        lines += ["No change to the SQL the test suite issues.", ""]
        return "\n".join(lines)

    for shape_id in added[:MAX_QUERIES_SHOWN]:
        shape = current["shapes"][shape_id]
        lines += [
            f"## New, first seen in `{shape['first_seen_in']}`",
            "",
            "```sql",
            shape["sql"],
            "```",
            "",
            "<details><summary>with values inlined</summary>",
            "",
            "```sql",
            shape["example"],
            "```",
            "",
            "</details>",
            "",
        ]
    if len(added) > MAX_QUERIES_SHOWN:
        lines += [f"_{len(added) - MAX_QUERIES_SHOWN} further new shapes omitted._", ""]

    if removed:
        lines += ["## No longer issued", ""]
        for shape in removed[:MAX_QUERIES_SHOWN]:
            lines += ["```sql", shape["sql"], "```", ""]

    changed_tests = [t for t, v in report["tests"].items() if v["status"] == "changed"]
    if changed_tests:
        lines += ["## Tests whose query pattern changed", ""]
        lines += [f"- `{t}`" for t in changed_tests[:MAX_QUERIES_SHOWN]]
        lines += [""]
    return "\n".join(lines)


def cmd_query_diff() -> None:
    _, pr, _ = _client()
    current = _await_query_log(pr.head.sha)
    if current is None:
        QUERIES_FILE.write_text(
            "# SQL this branch changes\n\nThe query log for this commit was not published in time, so no SQL diff is "
            "available. Review any new or modified queries from the PR diff directly.\n"
        )
        return

    baseline = _fetch_query_log(f"https://{BASELINE_REF}--test-artifacts.{PREVIEW_DOMAIN}/queries/data.json.gz")
    report = _load_query_log_report().diff(current, baseline)
    QUERIES_FILE.write_text(_render_queries(current, report))
    print(f"wrote {QUERIES_FILE}: {len(report['added_shapes'])} new shapes")


# ============================================================================
# apply
# ============================================================================


def _approve(pr: PullRequest, body: str, fingerprint: str) -> None:
    pr.create_review(body=f"{body}\n\n{marker(fingerprint, 'approve')}", event="APPROVE")
    print(f"approved #{pr.number}")


def _comment(pr: PullRequest, body: str, fingerprint: str) -> None:
    # Deliberately COMMENT rather than REQUEST_CHANGES: the bot should be able to say a change looks wrong without
    # taking the merge button away from the people who can tell whether it is.
    pr.create_review(body=f"{body}\n\n{marker(fingerprint, 'comment')}", event="COMMENT")
    print(f"commented on #{pr.number}")


def _render_review(verdict: dict[str, Any], approved: bool, blockers: list[str]) -> str:
    lines = ["### Code review bot", "", str(verdict.get("summary", "")).strip(), ""]

    findings = verdict.get("findings") or []
    if findings:
        lines += ["#### Findings", ""]
        for finding in findings:
            severity = str(finding.get("severity", "note")).upper()
            where = f" (`{finding['file']}`)" if finding.get("file") else ""
            lines.append(f"- **{severity}**{where}: {str(finding.get('description', '')).strip()}")
        lines.append("")

    if approved:
        lines += ["Approved: a code owner made a small change with nothing outstanding against it.", ""]
    elif verdict.get("verdict") == "approve" and blockers:
        lines += ["The review found nothing outstanding, but this PR cannot be approved automatically:", ""]
        lines += [f"- {blocker}" for blocker in blockers]
        lines += ["", "It needs a human reviewer.", ""]
    return "\n".join(lines).strip()


def cmd_apply() -> None:
    _, pr, _ = _client()
    # From the gate's step outputs, not from a file: the review cannot reach these. See _set_outputs.
    fingerprint = os.environ.get("FINGERPRINT", "")
    eligible = os.environ["AUTO_STAMP_ELIGIBLE"] == "true"
    blockers = json.loads(os.environ.get("STAMP_BLOCKERS") or "[]")

    if not VERDICT_FILE.exists():
        print(f"{VERDICT_FILE} missing, the review did not finish; leaving the PR alone")
        return

    verdict = json.loads(VERDICT_FILE.read_text())
    print(f"verdict={verdict.get('verdict')} eligible={eligible} architectural={verdict.get('architectural_change')}")

    approved = may_approve(verdict, eligible)
    body = _render_review(verdict, approved, blockers)

    if not fingerprint:
        # Without a fingerprint the next run cannot tell a rebase from a real change, so it will just review again.
        print("no fingerprint available, this review will not be reusable after a rebase")

    if approved:
        _approve(pr, body, fingerprint)
    else:
        _comment(pr, body, fingerprint)


# ============================================================================
# Main Entry Point
# ============================================================================

COMMANDS = {"gate": cmd_gate, "query-diff": cmd_query_diff, "apply": cmd_apply}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=COMMANDS)
    COMMANDS[parser.parse_args().command]()
