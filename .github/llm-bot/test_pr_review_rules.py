"""Tests for the PR review bot's deterministic rules. These decide what gets approved without a human, so they are
worth pinning down: everything the model contributes is downstream of them."""

import pytest

from pr_review_rules import (
    Action,
    ChangedFile,
    Codeowners,
    PullRequestFacts,
    compile_pattern,
    gate,
    marker,
    may_approve,
    normalise_patch,
    parse_marker,
    patch_fingerprint,
    sensitive_paths,
    stamp_blockers,
)

# The real file, so the tests fail if its semantics are ever misread.
COUCHERS_CODEOWNERS = """
# Only the last matching line's owners are added to the PR
* @aapeliv
/app/**/locales/*.json @tristanlabelle # Watch Weblate integrations
/app/web/ @nabramow
/docs/ @aapeliv @nabramow
"""

PATCH = """diff --git a/app/backend/src/couchers/servicers/api.py b/app/backend/src/couchers/servicers/api.py
index 1111111..2222222 100644
--- a/app/backend/src/couchers/servicers/api.py
+++ b/app/backend/src/couchers/servicers/api.py
@@ -120,7 +120,7 @@ class API(api_pb2_grpc.APIServicer):
     def Ping(self, request, context, session):
-        return api_pb2.PingRes(user_id=context.user_id)
+        return api_pb2.PingRes(user_id=context.user_id, unseen=0)
"""


def facts(**kwargs) -> PullRequestFacts:
    defaults = dict(
        author="aapeliv",
        draft=False,
        files=[ChangedFile("app/backend/src/couchers/servicers/api.py", 3, 1)],
        fingerprint="a" * 64,
        codeowners=Codeowners.parse(COUCHERS_CODEOWNERS),
    )
    return PullRequestFacts(**{**defaults, **kwargs})


# ============================================================================
# Patch fingerprinting
# ============================================================================


def test_rebase_does_not_change_the_fingerprint():
    """A rebase moves blob hashes and hunk line numbers without touching a line of code."""
    rebased = PATCH.replace("index 1111111..2222222", "index 3333333..4444444").replace(
        "@@ -120,7 +120,7 @@", "@@ -137,7 +137,7 @@"
    )
    assert patch_fingerprint(rebased) == patch_fingerprint(PATCH)


def test_changing_a_line_changes_the_fingerprint():
    assert patch_fingerprint(PATCH.replace("unseen=0", "unseen=1")) != patch_fingerprint(PATCH)


def test_changing_a_context_line_changes_the_fingerprint():
    """Conservative by design: develop editing the surrounding code costs a re-review, it does not skip one."""
    moved = PATCH.replace("    def Ping(self, request, context, session):", "    def Ping(self, request, context):")
    assert patch_fingerprint(moved) != patch_fingerprint(PATCH)


def test_normalise_keeps_the_hunk_heading():
    normalised = normalise_patch(PATCH)
    assert "@@ class API(api_pb2_grpc.APIServicer):" in normalised
    assert "index 1111111" not in normalised


def test_marker_round_trips():
    assert parse_marker(f"some review text\n\n{marker('b' * 64, 'approve')}") == ("b" * 64, "approve")


def test_a_comment_without_a_marker_is_not_ours():
    assert parse_marker("Looks good to me!") is None


# ============================================================================
# CODEOWNERS
# ============================================================================


@pytest.mark.parametrize(
    ("pattern", "path", "matches"),
    [
        ("*", "app/backend/src/couchers/models/user.py", True),
        ("/app/web/", "app/web/features/profile/Profile.tsx", True),
        ("/app/web/", "app/backend/x.py", False),
        ("/app/web/", "app/web", False),
        ("/app/**/locales/*.json", "app/web/features/auth/locales/en.json", True),
        ("/app/**/locales/*.json", "app/web/features/auth/locales/nested/en.json", False),
        ("/docs/", "docs/query-log.md", True),
        ("app/backend/**", "app/backend/src/couchers/sql.py", True),
        ("app/backend/**", "app/web/src/x.ts", False),
        ("**/uv.lock", "app/backend/uv.lock", True),
        ("**/uv.lock", "uv.lock", True),
    ],
)
def test_pattern_matching(pattern, path, matches):
    assert bool(compile_pattern(pattern).match(path)) is matches


def test_only_the_last_matching_rule_counts():
    owners = Codeowners.parse(COUCHERS_CODEOWNERS)
    assert owners.owners_for("app/backend/src/couchers/sql.py") == {"aapeliv"}
    # `/app/web/` comes after `*`, so aapeliv is not an owner of web files.
    assert owners.owners_for("app/web/features/profile/Profile.tsx") == {"nabramow"}
    assert owners.owners_for("docs/query-log.md") == {"aapeliv", "nabramow"}
    assert owners.owners_for("app/web/features/auth/locales/en.json") == {"nabramow"}


def test_comments_and_blank_lines_are_ignored():
    assert len(Codeowners.parse(COUCHERS_CODEOWNERS).rules) == 4


def test_owns_all_needs_every_path():
    owners = Codeowners.parse(COUCHERS_CODEOWNERS)
    assert owners.owns_all("aapeliv", frozenset(), ["app/backend/a.py", "docs/b.md"])
    assert not owners.owns_all("aapeliv", frozenset(), ["app/backend/a.py", "app/web/b.tsx"])
    assert not owners.owns_all("aapeliv", frozenset(), [])


def test_team_membership_resolves_ownership():
    owners = Codeowners.parse("/app/backend/ @Couchers-org/backend")
    assert owners.owns_all("someone", frozenset({"couchers-org/backend"}), ["app/backend/a.py"])
    assert not owners.owns_all("someone", frozenset(), ["app/backend/a.py"])


# ============================================================================
# Stamp eligibility
# ============================================================================


def test_sensitive_paths_are_found():
    assert sensitive_paths(["app/backend/src/couchers/migrations/versions/0123_x.py"])
    assert sensitive_paths(["app/proto/api.proto"])
    assert sensitive_paths(["app/backend/src/couchers/models/user.py"])
    assert sensitive_paths([".github/workflows/code-review.yml"])
    assert sensitive_paths(["app/web/yarn.lock"])
    assert not sensitive_paths(["app/backend/src/couchers/servicers/api.py"])


def test_a_small_owned_change_may_be_stamped():
    assert stamp_blockers(facts()) == ()


def test_a_migration_may_never_be_stamped():
    blockers = stamp_blockers(facts(files=[ChangedFile("app/backend/src/couchers/migrations/versions/0123_x.py", 8, 0)]))
    assert any("always need a human" in b for b in blockers)


def test_a_non_owner_may_not_be_stamped():
    blockers = stamp_blockers(facts(author="someone-else"))
    assert any("not a code owner" in b for b in blockers)


def test_a_large_change_may_not_be_stamped():
    blockers = stamp_blockers(facts(files=[ChangedFile("app/backend/src/couchers/servicers/api.py", 400, 20)]))
    assert any("over the" in b and "line limit" in b for b in blockers)


def test_many_files_may_not_be_stamped():
    blockers = stamp_blockers(facts(files=[ChangedFile(f"app/backend/src/couchers/servicers/s{i}.py", 1, 1) for i in range(20)]))
    assert any("file limit" in b for b in blockers)


# ============================================================================
# The gate
# ============================================================================


def test_drafts_are_left_alone():
    assert gate(facts(draft=True)).action == Action.SKIP


def test_automation_accounts_are_left_alone():
    assert gate(facts(author="CouchersBot")).action == Action.SKIP


def test_an_empty_pull_request_is_left_alone():
    assert gate(facts(files=[])).action == Action.SKIP


def test_an_unchanged_diff_repeats_a_previous_approval():
    """The rebase case: GitHub dismissed the approval on push, but nothing about the code changed."""
    decision = gate(facts(fingerprint="c" * 64, previous=("c" * 64, "approve")))
    assert decision.action == Action.APPROVE_UNCHANGED


def test_an_unchanged_diff_does_not_manufacture_an_approval():
    """A rebase must not upgrade a previous review that was not an approval."""
    decision = gate(facts(fingerprint="c" * 64, previous=("c" * 64, "comment")))
    assert decision.action == Action.SKIP


def test_a_changed_diff_is_reviewed_again():
    assert gate(facts(fingerprint="c" * 64, previous=("d" * 64, "approve"))).action == Action.REVIEW


def test_an_unfingerprintable_diff_is_reviewed():
    """No fingerprint means no way to tell a rebase from a rewrite, so the PR gets reviewed."""
    assert gate(facts(fingerprint=None, previous=("c" * 64, "approve"))).action == Action.REVIEW


def test_a_codeowner_making_a_small_change_is_eligible_for_a_stamp():
    decision = gate(facts())
    assert decision.action == Action.REVIEW
    assert decision.auto_stamp_eligible


def test_a_contributor_is_reviewed_but_not_eligible():
    decision = gate(facts(author="new-contributor"))
    assert decision.action == Action.REVIEW
    assert not decision.auto_stamp_eligible
    assert decision.stamp_blockers


# ============================================================================
# Approval authority
# ============================================================================

CLEAN = {"verdict": "approve", "architectural_change": False, "summary": "Fine.", "findings": []}


def test_a_clean_verdict_on_an_eligible_pr_approves():
    assert may_approve(CLEAN, auto_stamp_eligible=True)


def test_the_review_cannot_approve_what_the_gate_did_not_permit():
    """The whole point of the split: a glowing verdict on a migration is still not an approval."""
    assert not may_approve(CLEAN, auto_stamp_eligible=False)


def test_an_architectural_change_is_not_approved():
    assert not may_approve({**CLEAN, "architectural_change": True}, auto_stamp_eligible=True)


def test_a_missing_architectural_flag_is_read_as_architectural():
    assert not may_approve({"verdict": "approve", "findings": []}, auto_stamp_eligible=True)


@pytest.mark.parametrize("severity", ["high", "medium", "HIGH", "Medium"])
def test_a_serious_finding_overrides_an_approve_verdict(severity):
    """Belt and braces: the verdict says approve but contradicts itself."""
    verdict = {**CLEAN, "findings": [{"severity": severity, "description": "off by one"}]}
    assert not may_approve(verdict, auto_stamp_eligible=True)


def test_a_low_severity_suggestion_does_not_block_approval():
    verdict = {**CLEAN, "findings": [{"severity": "low", "description": "could be tidier"}]}
    assert may_approve(verdict, auto_stamp_eligible=True)


def test_a_comment_verdict_is_not_an_approval():
    assert not may_approve({**CLEAN, "verdict": "comment"}, auto_stamp_eligible=True)


def test_an_empty_verdict_is_not_an_approval():
    assert not may_approve({}, auto_stamp_eligible=True)
