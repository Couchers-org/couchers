"""
Deterministic rules for the PR review bot.

Everything in here is pure: no network, no GitHub, no LLM. The bot gathers facts about a pull request, feeds them to
`gate()`, and gets back a decision about whether to skip the PR, approve it outright, or spend an LLM review on it.
Keeping the rules pure is what makes them testable, and the auto-approve paths are exactly the ones that should not
depend on a model's mood.

The gate answers two separate questions:

  what to do now      skip / approve unchanged / run a review
  what may follow     whether an approval is even permitted once the review comes back

The second is `auto_stamp_eligible`. A review can never approve a PR the gate did not already mark eligible, so
widening what the bot will stamp is a change to this file, not to a prompt.
"""

import hashlib
import re
from dataclasses import dataclass, field
from enum import Enum

# ============================================================================
# Configuration
# ============================================================================

# Authors whose PRs are machine-generated and reviewed by their own workflow.
SKIP_AUTHORS = {"CouchersBot", "couchersbot", "couchersbot[bot]", "weblate"}

# Paths where a change is never small enough to stamp on size alone, either because it is hard to reverse once
# merged (migrations, proto field numbers), because it decides who can do what (auth, crypto, visibility), or
# because it changes what CI itself does and so could disable the checks the stamp leans on.
SENSITIVE_PATTERNS = (
    "/app/backend/src/couchers/migrations/",
    "/app/proto/",
    "/app/backend/proto/",
    "/app/backend/src/couchers/models/",
    "/app/backend/src/couchers/crypto.py",
    "/app/backend/src/couchers/sql.py",
    "/app/backend/src/couchers/servicers/auth.py",
    "/app/backend/src/couchers/interceptors.py",
    "/app/deployment/",
    "/.github/",
    "/.gitlab-ci.yml",
    "/app/.gitlab-ci.yml",
    "**/pyproject.toml",
    "**/uv.lock",
    "**/package.json",
    "**/yarn.lock",
)

# A stamp is for a change a reviewer would skim, not read. Past this, a human looks.
MAX_STAMP_FILES = 10
MAX_STAMP_LINES = 150

# Marker left in the bot's own comment so a later run can recognise its previous verdict. The fingerprint is what
# rebase detection compares against.
MARKER_RE = re.compile(r"<!--\s*code-review-bot\s+fingerprint=(?P<fingerprint>[0-9a-f]{64})\s+verdict=(?P<verdict>\w+)\s*-->")


def marker(fingerprint: str, verdict: str) -> str:
    return f"<!-- code-review-bot fingerprint={fingerprint} verdict={verdict} -->"


def parse_marker(body: str) -> tuple[str, str] | None:
    """Pull (fingerprint, verdict) back out of a previous bot comment, or None if this isn't one."""
    match = MARKER_RE.search(body or "")
    return (match["fingerprint"], match["verdict"]) if match else None


# ============================================================================
# Patch fingerprinting
# ============================================================================

_INDEX_RE = re.compile(r"^index [0-9a-f]+\.\.[0-9a-f]+.*$")
_HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@")


def normalise_patch(patch: str) -> str:
    """Strip the parts of a diff that a rebase moves but a code change does not.

    GitHub serves a PR's diff against the merge base, so rebasing onto a newer develop, or merging develop in, leaves
    the diff identical as long as no line actually changed. Two things still shift: blob hashes on the `index` lines,
    and the line numbers in hunk headers. Both are dropped here.

    The text after a hunk header (the enclosing function git guesses at) is deliberately kept, as is every context
    line. Those do change when develop edits the surrounding code, which makes the fingerprint conservative: it can
    say "this differs" about a rebase that touched nothing, and the PR then gets a normal review. It cannot say
    "unchanged" about a diff whose content moved, which is the direction that matters.
    """
    lines = []
    for line in patch.splitlines():
        if _INDEX_RE.match(line):
            continue
        lines.append(_HUNK_RE.sub("@@", line))
    return "\n".join(lines)


def patch_fingerprint(patch: str) -> str:
    return hashlib.sha256(normalise_patch(patch).encode()).hexdigest()


# ============================================================================
# CODEOWNERS
# ============================================================================


def _translate(body: str) -> str:
    """Convert the glob part of a CODEOWNERS pattern to a regex, gitignore-style."""
    out = []
    i = 0
    while i < len(body):
        if body.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif body.startswith("**", i):
            out.append(".*")
            i += 2
        elif body[i] == "*":
            out.append("[^/]*")
            i += 1
        elif body[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(body[i]))
            i += 1
    return "".join(out)


def compile_pattern(pattern: str) -> re.Pattern[str]:
    """Compile one CODEOWNERS path pattern against repo-root-relative paths (no leading slash).

    A separator at the start or middle anchors the pattern to the repo root; otherwise it may match at any depth. A
    trailing separator makes it a directory, matching everything beneath it.
    """
    directory = pattern.endswith("/")
    anchored = pattern.startswith("/") or "/" in pattern.rstrip("/")
    body = pattern.strip("/")
    prefix = "" if anchored else "(?:.*/)?"
    suffix = "/.*$" if directory else "$"
    return re.compile(f"^{prefix}{_translate(body)}{suffix}")


@dataclass(frozen=True)
class Codeowners:
    """The CODEOWNERS file, as rules in file order."""

    rules: tuple[tuple[re.Pattern[str], frozenset[str]], ...] = ()

    @classmethod
    def parse(cls, text: str) -> "Codeowners":
        rules = []
        for raw in text.splitlines():
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            pattern, *owners = line.split()
            if not owners:
                continue
            rules.append((compile_pattern(pattern), frozenset(o.lstrip("@").lower() for o in owners)))
        return cls(tuple(rules))

    def owners_for(self, path: str) -> frozenset[str]:
        """Owners of one path. Only the last matching rule counts, which is how GitHub reads the file."""
        owners: frozenset[str] = frozenset()
        for pattern, rule_owners in self.rules:
            if pattern.match(path):
                owners = rule_owners
        return owners

    def owns_all(self, login: str, teams: frozenset[str], paths: list[str]) -> bool:
        """Whether `login` (or one of their `teams`, as `org/team` slugs) owns every one of `paths`.

        Every path, not any: a PR that reaches outside what its author owns is not one to stamp.
        """
        if not paths:
            return False
        identities = {login.lower()} | {t.lower() for t in teams}
        return all(self.owners_for(path) & identities for path in paths)


# ============================================================================
# Facts and decisions
# ============================================================================


class Action(str, Enum):
    SKIP = "skip"
    APPROVE_UNCHANGED = "approve_unchanged"
    REVIEW = "review"


@dataclass(frozen=True)
class ChangedFile:
    path: str
    additions: int = 0
    deletions: int = 0


@dataclass(frozen=True)
class PullRequestFacts:
    author: str
    draft: bool
    files: list[ChangedFile]
    fingerprint: str | None
    author_teams: frozenset[str] = frozenset()
    codeowners: Codeowners = field(default_factory=Codeowners)
    # (fingerprint, verdict) from the bot's most recent review of this PR, if it has one.
    previous: tuple[str, str] | None = None

    @property
    def paths(self) -> list[str]:
        return [f.path for f in self.files]

    @property
    def changed_lines(self) -> int:
        return sum(f.additions + f.deletions for f in self.files)


@dataclass(frozen=True)
class GateDecision:
    action: Action
    reason: str
    auto_stamp_eligible: bool = False
    # Why a stamp is off the table, for the PR comment. Empty when eligible.
    stamp_blockers: tuple[str, ...] = ()


def sensitive_paths(paths: list[str]) -> list[str]:
    patterns = [compile_pattern(p) for p in SENSITIVE_PATTERNS]
    return [p for p in paths if any(pattern.match(p) for pattern in patterns)]


def stamp_blockers(facts: PullRequestFacts) -> tuple[str, ...]:
    """Every deterministic reason this PR may not be auto-approved. Empty means a clean review is allowed to stamp."""
    blockers = []
    if not facts.codeowners.owns_all(facts.author, facts.author_teams, facts.paths):
        blockers.append(f"@{facts.author} is not a code owner of every changed path")
    sensitive = sensitive_paths(facts.paths)
    if sensitive:
        shown = ", ".join(f"`{p}`" for p in sensitive[:5])
        more = f" (+{len(sensitive) - 5} more)" if len(sensitive) > 5 else ""
        blockers.append(f"touches paths that always need a human: {shown}{more}")
    if len(facts.files) > MAX_STAMP_FILES:
        blockers.append(f"{len(facts.files)} files changed, over the {MAX_STAMP_FILES} file limit")
    if facts.changed_lines > MAX_STAMP_LINES:
        blockers.append(f"{facts.changed_lines} lines changed, over the {MAX_STAMP_LINES} line limit")
    return tuple(blockers)


def may_approve(verdict: dict, auto_stamp_eligible: bool) -> bool:
    """Whether a review's verdict may be turned into an approval.

    Every condition can only subtract. `auto_stamp_eligible` comes from the gate and is the permission; the verdict
    can decline to use it but can never supply it. The severity check is redundant against a review that follows its
    instructions and belt-and-braces against one that says "approve" while listing something serious, which is the
    failure mode with the worst consequences here.
    """
    if not auto_stamp_eligible or verdict.get("verdict") != "approve":
        return False
    if verdict.get("architectural_change", True):
        return False
    severities = {str(f.get("severity", "")).lower() for f in verdict.get("findings") or []}
    return not severities & {"high", "medium"}


def gate(facts: PullRequestFacts) -> GateDecision:
    """Decide what to do with a pull request before any model has looked at it."""
    if facts.draft:
        return GateDecision(Action.SKIP, "pull request is a draft")

    if facts.author in SKIP_AUTHORS:
        return GateDecision(Action.SKIP, f"@{facts.author} is an automation account")

    if not facts.files:
        return GateDecision(Action.SKIP, "no files changed")

    # A rebase, or a merge of develop, leaves the diff against the merge base untouched. Nothing about the previous
    # review has been invalidated, so repeat it rather than paying for it again. GitHub dismisses approvals on push
    # when a branch is configured to, so re-approving here is what actually unblocks the merge.
    if facts.previous and facts.fingerprint and facts.previous[0] == facts.fingerprint:
        previous_verdict = facts.previous[1]
        if previous_verdict == "approve":
            return GateDecision(Action.APPROVE_UNCHANGED, "no code changes since the last review (rebase or merge only)")
        return GateDecision(Action.SKIP, f"no code changes since the last review, which said `{previous_verdict}`")

    blockers = stamp_blockers(facts)
    return GateDecision(
        Action.REVIEW,
        "changed since the last review" if facts.previous else "not yet reviewed",
        auto_stamp_eligible=not blockers,
        stamp_blockers=blockers,
    )
