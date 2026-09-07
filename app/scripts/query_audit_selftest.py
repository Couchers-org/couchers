#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = ["sqlglot>=27"]
# ///
"""Checks query_audit.py: negative controls per dimension, and an independent cross-check of every clear.

An audit is only worth what its checker is worth, and a checker that fails to see a construct also fails to judge
it, which comes out as a clear rather than as an error. Two independent things are done about that here:

  controls     statements built to fail a dimension, each with the verdict it has to get. A dimension that cannot
               tell the real helper's output from the same statement with one clause dropped is not discriminating,
               and its clears mean nothing.
  cross-check  every clear re-derived from the raw statement text by regex, on unrelated machinery. Where the AST
               walk says it judged n joins and the text holds more JOIN keywords than that, something was not seen.

Both are cheap and neither shares code with the thing it checks. Run with uv, which resolves sqlglot from the
header above:

  uv run app/scripts/query_audit_selftest.py --schema schema.sql --data data.json.gz

Both arguments accept a URL as well as a path, so the artifacts the last develop pipeline published can be used
directly:

  --schema https://develop--schema.preview.couchershq.org/schema.sql
  --data https://develop--test-artifacts.preview.couchershq.org/queries/data.json.gz

--data is optional: without it the controls run and the cross-check is skipped. Exits non-zero if any control
fails or any clear is contradicted.
"""

import argparse
import re
import sys

import query_audit as qa

VERBOSE = False

# ---------------------------------------------------------------------------- visibility controls

# what couchers.sql.users_visible emits, clause by clause, so a case can drop exactly one of them
VISIBLE = "users.banned_at IS NULL AND users.deleted_at IS NULL"
SHADOW = "(users.shadowed_at IS NULL OR users.id = 1)"
BLOCKS = (
    "users.id NOT IN (SELECT anon_1.blocked_user_id FROM (SELECT user_blocks.blocked_user_id AS blocked_user_id "
    "FROM user_blocks WHERE user_blocks.blocking_user_id = 1 UNION SELECT user_blocks.blocking_user_id AS "
    "blocking_user_id FROM user_blocks WHERE user_blocks.blocked_user_id = 1) AS anon_1)"
)
FULL = f"{VISIBLE} AND {SHADOW} AND {BLOCKS}"

VISIBILITY_CASES = [
    # the helper's own output clears, and dropping any one clause of it does not
    (qa.CLEAR, "users_visible's own output", f"SELECT users.id FROM users WHERE {FULL}"),
    (qa.OPEN, "without the block anti join", f"SELECT users.id FROM users WHERE {VISIBLE} AND {SHADOW}"),
    (qa.OPEN, "without the shadow clause", f"SELECT users.id FROM users WHERE {VISIBLE} AND {BLOCKS}"),
    (qa.OPEN, "without banned and deleted", f"SELECT users.id FROM users WHERE {SHADOW} AND {BLOCKS}"),
    (
        qa.OPEN,
        "without the deleted clause",
        f"SELECT users.id FROM users WHERE users.banned_at IS NULL AND {SHADOW} AND {BLOCKS}",
    ),
    # a filter that only applies inside an OR arm filters nothing
    (
        qa.OPEN,
        "the whole filter inside one arm of an OR",
        f"SELECT users.id FROM users WHERE users.city = 'x' OR ({FULL})",
    ),
    # the identity join: lite_users inherits the filter on users, but only across a real id equality
    (
        qa.CLEAR,
        "an identity join carries the filter across",
        f"SELECT lite_users.id FROM users JOIN lite_users ON lite_users.id = users.id WHERE {FULL}",
    ),
    (
        qa.OPEN,
        "the same join on a non-identity column",
        f"SELECT lite_users.id FROM users JOIN lite_users ON lite_users.username = users.username WHERE {FULL}",
    ),
    (
        qa.OPEN,
        "an id equality that names a different person",
        f"SELECT lite_users.id FROM users JOIN lite_users ON lite_users.id = users.profile_gallery_id WHERE {FULL}",
    ),
    # an outer join's ON carries into the joined relation only, not back into the base
    (
        qa.OPEN,
        "an outer join's ON does not filter the base relation",
        "SELECT users.id FROM users LEFT JOIN lite_users ON lite_users.id = users.id AND lite_users.is_visible",
    ),
    # the EXISTS proof: the joined user is the one the EXISTS filtered
    (
        qa.CLEAR,
        "a filtered EXISTS on the column the relation is read through",
        "SELECT host_requests.id FROM host_requests JOIN lite_users ON lite_users.id = host_requests.initiator_user_id "
        f"WHERE EXISTS (SELECT 1 FROM users WHERE users.id = host_requests.initiator_user_id AND {FULL})",
    ),
    # ... but not when the EXISTS is about a different column
    (
        qa.OPEN,
        "the same EXISTS about a different column",
        "SELECT host_requests.id FROM host_requests JOIN lite_users ON lite_users.id = host_requests.initiator_user_id "
        f"WHERE EXISTS (SELECT 1 FROM users WHERE users.id = host_requests.recipient_user_id AND {FULL})",
    ),
    # ... nor when the EXISTS is only one arm of an OR, so it does not hold for every row
    (
        qa.OPEN,
        "the EXISTS as one arm of an OR",
        "SELECT host_requests.id FROM host_requests JOIN lite_users ON lite_users.id = host_requests.initiator_user_id "
        "WHERE host_requests.status = 'pending' OR EXISTS (SELECT 1 FROM users WHERE users.id = "
        f"host_requests.initiator_user_id AND {FULL})",
    ),
    # ... nor when it is negated
    (
        qa.OPEN,
        "the EXISTS negated",
        "SELECT host_requests.id FROM host_requests JOIN lite_users ON lite_users.id = host_requests.initiator_user_id "
        f"WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = host_requests.initiator_user_id AND {FULL})",
    ),
    # ... nor when the EXISTS itself is unfiltered
    (
        qa.OPEN,
        "the EXISTS over an unfiltered users",
        "SELECT host_requests.id FROM host_requests JOIN lite_users ON lite_users.id = host_requests.initiator_user_id "
        "WHERE EXISTS (SELECT 1 FROM users WHERE users.id = host_requests.initiator_user_id)",
    ),
    # a proof made at an enclosing level reaches a correlated subquery at a deeper one
    (
        qa.CLEAR,
        "an enclosing proof reaching a deeper level",
        "SELECT public_trips.id FROM public_trips WHERE EXISTS (SELECT 1 FROM users WHERE users.id = "
        f"public_trips.user_id AND {FULL}) AND (SELECT users.gender FROM users WHERE users.id = public_trips.user_id) "
        "= 'Woman'",
    ),
    # lite_users' own is_visible column, and the same statement without it
    (
        qa.CLEAR,
        "lite_users.is_visible, which is banned and deleted at once",
        "SELECT lite_users.id FROM lite_users WHERE lite_users.is_visible AND lite_users.shadowed_at IS NULL AND "
        "lite_users.id NOT IN (SELECT user_blocks.blocked_user_id FROM user_blocks WHERE "
        "user_blocks.blocking_user_id = 1)",
    ),
    (
        qa.OPEN,
        "the same without is_visible",
        "SELECT lite_users.id FROM lite_users WHERE lite_users.shadowed_at IS NULL AND "
        "lite_users.id NOT IN (SELECT user_blocks.blocked_user_id FROM user_blocks WHERE "
        "user_blocks.blocking_user_id = 1)",
    ),
    # users_visible_to_each_other: the viewer side carries no shadow clause by design and still clears
    (
        qa.CLEAR,
        "users_visible_to_each_other's own output",
        "SELECT users_1.id FROM users AS users_1, users AS users_2 WHERE users_1.banned_at IS NULL AND "
        "users_1.deleted_at IS NULL AND users_2.banned_at IS NULL AND users_2.deleted_at IS NULL AND "
        "users_2.shadowed_at IS NULL AND NOT (EXISTS (SELECT 1 FROM user_blocks WHERE "
        "user_blocks.blocking_user_id = users_1.id AND user_blocks.blocked_user_id = users_2.id OR "
        "user_blocks.blocking_user_id = users_2.id AND user_blocks.blocked_user_id = users_1.id))",
    ),
    # ... and the same with one of the two users left unfiltered does not
    (
        qa.OPEN,
        "the same with one side left unfiltered",
        "SELECT users_1.id FROM users AS users_1, users AS users_2 WHERE users_1.banned_at IS NULL AND "
        "users_1.deleted_at IS NULL AND users_2.shadowed_at IS NULL AND NOT (EXISTS (SELECT 1 FROM user_blocks "
        "WHERE user_blocks.blocking_user_id = users_1.id AND user_blocks.blocked_user_id = users_2.id))",
    ),
    # a relation with no user in it at all
    (qa.CLEAR, "reads no user relation", "SELECT messages.id FROM messages WHERE messages.conversation_id = 1"),
    # the write target is not judged here, but a user it reads is
    (qa.CLEAR, "the write target is not judged here", "UPDATE users SET last_active = now() WHERE users.id = 1"),
    (
        qa.OPEN,
        "a write that reads an unfiltered user",
        "UPDATE user_blocks SET blocked_user_id = 1 FROM users WHERE users.username = 'x'",
    ),
]


def visibility_controls(schema: qa.Schema) -> list[str]:
    failures = []
    for expected, label, sql in VISIBILITY_CASES:
        shape = qa.Shape(id="control", sql=sql, example=sql, write=False, ast=qa._parse(sql), parse_error=None)
        verdict = qa.check_visibility(shape, schema)
        if verdict.state != expected:
            failures.append(f"{label}: want {expected} got {verdict.state} ({verdict.reason})")
        elif VERBOSE:
            print(f"  ok   {label:<58} -> {verdict.state}")
    return failures


# ---------------------------------------------------------------------------- moderation controls

# what where_moderated_content_visible emits for a single item read of a host request
JOINED = (
    "SELECT host_requests.id FROM host_requests "
    "JOIN moderation_states AS moderation_states_1 ON moderation_states_1.id = host_requests.moderation_state_id "
    "WHERE (moderation_states_1.visibility = 'visible' OR moderation_states_1.visibility = 'unlisted' "
    "OR moderation_states_1.visibility = 'shadowed' AND host_requests.initiator_user_id = 1)"
)
# what moderation_state_column_visible would emit if its author arm tested the visibility, as its docstring says
TESTED = (
    "SELECT notifications.id FROM notifications WHERE notifications.moderation_state_id IS NULL OR (EXISTS "
    "(SELECT moderation_states_1.id FROM moderation_states AS moderation_states_1 WHERE moderation_states_1.id = "
    "notifications.moderation_state_id AND (moderation_states_1.visibility = 'visible' OR "
    "moderation_states_1.visibility = 'unlisted' OR moderation_states_1.visibility = 'shadowed' AND "
    "moderation_states_1.object_type = 'comment' AND (EXISTS (SELECT 1 FROM comments WHERE comments.id = "
    "moderation_states_1.object_id AND comments.author_user_id = 1)))))"
)
AUTHOR_ARM = "moderation_states_1.visibility = 'shadowed' AND moderation_states_1.object_type"

# Each case names one relation in a statement and the classification it must get, so a case says something about
# that relation rather than about whatever the weakest relation in the statement happens to be.
MODERATION_CASES = [
    ("host_requests", qa.STATE_JOINED, "the helper's own output", JOINED),
    (
        "host_requests",
        qa.STATE_UNCONSTRAINED,
        "joined but no visibility test",
        "SELECT host_requests.id FROM host_requests JOIN moderation_states AS moderation_states_1 "
        "ON moderation_states_1.id = host_requests.moderation_state_id WHERE host_requests.status = 'pending'",
    ),
    (
        "host_requests",
        qa.NO_STATE,
        "no state at all",
        "SELECT host_requests.id FROM host_requests WHERE host_requests.status = 'pending'",
    ),
    # an OR arm that never names the visibility lets rows through at any visibility: this is the real defect in
    # moderation_state_column_visible, and the check has to see it
    (
        "host_requests",
        qa.STATE_UNCONSTRAINED,
        "an arm that does not name the visibility",
        JOINED.replace("moderation_states_1.visibility = 'shadowed' AND host_requests", "host_requests"),
    ),
    (
        "host_requests",
        qa.NO_STATE,
        "state joined to another table's column",
        "SELECT host_requests.id FROM host_requests JOIN notifications ON notifications.id = host_requests.id "
        "JOIN moderation_states AS moderation_states_1 ON moderation_states_1.id = notifications.moderation_state_id "
        "WHERE moderation_states_1.visibility = 'visible'",
    ),
    (
        "host_requests",
        qa.NO_STATE,
        "outer joined state",
        "SELECT host_requests.id FROM host_requests LEFT JOIN moderation_states AS moderation_states_1 "
        "ON moderation_states_1.id = host_requests.moderation_state_id AND moderation_states_1.visibility = 'visible'",
    ),
    ("notifications", qa.STATE_TESTED, "the column form, with every arm constrained", TESTED),
    (
        "notifications",
        qa.STATE_PARTLY_TESTED,
        "the column form with an unconstrained author arm",
        TESTED.replace(AUTHOR_ARM, "moderation_states_1.object_type"),
    ),
    (
        "notifications",
        qa.NO_STATE,
        "the column form reaching a different column's state",
        TESTED.replace("moderation_states_1.id = notifications.moderation_state_id", "moderation_states_1.id = 7"),
    ),
    (
        "notifications",
        qa.NO_STATE,
        "the column form with the NULL arm replaced by an unrelated one",
        TESTED.replace("notifications.moderation_state_id IS NULL", "notifications.is_seen = false"),
    ),
    # the EXISTS behind the authorship test is itself an unfiltered read of moderated content, and stays open
    ("comments", qa.NO_STATE, "the authorship EXISTS inside the column form", TESTED),
]

MODERATION_STATEMENT_CASES = [
    (qa.CLEAR, "reads no moderated content", "SELECT messages.id FROM messages WHERE messages.conversation_id = 1"),
    (
        qa.CLEAR,
        "the write target is not judged here",
        "UPDATE host_requests SET status = 'accepted' WHERE host_requests.conversation_id = 1",
    ),
    (
        qa.OPEN,
        "a write that reads other moderated content",
        "UPDATE users SET name = 'x' FROM host_requests WHERE host_requests.initiator_user_id = users.id",
    ),
]


def moderation_controls(schema: qa.Schema) -> list[str]:
    failures = []
    for table, expected, label, sql in MODERATION_CASES:
        reads = {read[1]: read[2] for read in qa.walk_moderated_relations(qa._parse(sql), schema)}
        got = reads.get(table)
        if got != expected:
            failures.append(f"{label}: {table} want {expected} got {got}")
        elif VERBOSE:
            print(f"  ok   {label:<58} {table} -> {got}")
    for expected, label, sql in MODERATION_STATEMENT_CASES:
        shape = qa.Shape(id="control", sql=sql, example=sql, write=False, ast=qa._parse(sql), parse_error=None)
        verdict = qa.check_moderation(shape, schema)
        if verdict.state != expected:
            failures.append(f"{label}: want {expected} got {verdict.state} ({verdict.reason})")
        elif VERBOSE:
            print(f"  ok   {label:<58} -> {verdict.state}")
    return failures


# ---------------------------------------------------------------------------- nulls controls

# users.hometown, users.phone and users.profile_gallery_id are nullable; users.id and username are not.
NOT_IN_BLOCKS = (
    "SELECT users.id FROM users WHERE users.id NOT IN (SELECT anon_1.blocked_user_id FROM "
    "(SELECT user_blocks.blocked_user_id AS blocked_user_id FROM user_blocks WHERE user_blocks.blocking_user_id = 1 "
    "UNION SELECT user_blocks.blocking_user_id AS blocking_user_id FROM user_blocks "
    "WHERE user_blocks.blocked_user_id = 1) AS anon_1)"
)

# Each case names the construct it is about and the classification it must get, so a case says something about
# that construct rather than about whatever the weakest one in the statement happens to be.
NULLS_CASES = [
    # --- NOT IN: a NULL on the right makes every row fail, so the statement returns nothing at all
    (qa.NULL_SAFE, "users_visible's block clause, through a union in a derived table", NOT_IN_BLOCKS),
    (
        qa.VANISHES,
        "one branch of that union made nullable",
        NOT_IN_BLOCKS.replace("user_blocks.blocking_user_id AS blocking_user_id", "users.hometown AS hometown").replace(
            "FROM user_blocks WHERE user_blocks.blocked_user_id = 1", "FROM users"
        ),
    ),
    (
        qa.VANISHES,
        "NOT IN over a nullable column",
        "SELECT users.id FROM users WHERE users.username NOT IN (SELECT users.hometown FROM users)",
    ),
    (
        qa.NULL_SAFE,
        "NOT IN over a not null column",
        "SELECT users.id FROM users WHERE users.username NOT IN (SELECT users.username FROM users)",
    ),
    (
        qa.VANISHES,
        "NOT IN over the padded side of an outer join inside the subquery",
        "SELECT users.id FROM users WHERE users.id NOT IN "
        "(SELECT b.blocked_user_id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id)",
    ),
    (
        qa.NULL_SAFE,
        "the same subquery with the join made inner",
        "SELECT users.id FROM users WHERE users.id NOT IN "
        "(SELECT b.blocked_user_id FROM users JOIN user_blocks AS b ON b.blocking_user_id = users.id)",
    ),
    (qa.VANISHES, "NOT IN a literal list holding a NULL", "SELECT users.id FROM users WHERE users.id NOT IN (1, NULL)"),
    (qa.NULL_SAFE, "NOT IN a literal list", "SELECT users.id FROM users WHERE users.id NOT IN (1, 2)"),
    (
        qa.DROPS_NULLS,
        "NOT IN with a nullable left hand side",
        "SELECT users.id FROM users WHERE users.hometown NOT IN (SELECT users.username FROM users)",
    ),
    (
        qa.UNKNOWN_NULLS,
        "NOT IN with a view column on the left",
        "SELECT lite_users.id FROM lite_users WHERE lite_users.id NOT IN (SELECT users.id FROM users)",
    ),
    # --- inequality: the rows where the column is NULL are not "everything except", they are simply gone
    (qa.NULL_SAFE, "!= on a not null column", "SELECT users.id FROM users WHERE users.username != 'x'"),
    (qa.DROPS_NULLS, "!= on a nullable column", "SELECT users.id FROM users WHERE users.hometown != 'x'"),
    (
        qa.DROPS_NULLS,
        "!= against the padded side of an outer join, which is both that and a defeated join",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id "
        "WHERE b.blocked_user_id != users.id",
    ),
    # --- NOT over a compound predicate
    (
        qa.NULL_SAFE,
        "NOT over not null operands",
        "SELECT users.id FROM users WHERE NOT (users.username = 'x' AND users.id = 1)",
    ),
    (
        qa.DROPS_NULLS,
        "NOT over a nullable operand",
        "SELECT users.id FROM users WHERE NOT (users.username = 'x' AND users.hometown = 'y')",
    ),
    (
        qa.NULL_SAFE,
        "NOT over an IS NULL, which is definite whatever the column holds",
        "SELECT users.id FROM users WHERE NOT (users.hometown IS NULL AND users.phone IS NULL)",
    ),
    (
        qa.NULL_SAFE,
        "NOT EXISTS, which is definite too",
        "SELECT users.id FROM users WHERE NOT (EXISTS (SELECT 1 FROM user_blocks "
        "WHERE user_blocks.blocking_user_id = users.id))",
    ),
    (
        qa.NULL_SAFE,
        "NOT over a not null boolean column",
        "SELECT e.id FROM event_occurrences AS e WHERE NOT e.is_deleted",
    ),
    (qa.DROPS_NULLS, "NOT over a nullable boolean column", "SELECT users.id FROM users WHERE NOT users.camping_ok"),
    # --- an outer join that is filtered back into an inner one
    (
        qa.OUTER_DEFEATED,
        "an equality on the padded side, in the WHERE",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id "
        "WHERE b.blocked_user_id = 1",
    ),
    (
        qa.NULL_SAFE,
        "the same equality, in the outer join's own ON",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id "
        "AND b.blocked_user_id = 1",
    ),
    (
        qa.NULL_SAFE,
        "the anti join idiom, which is what an outer join is for",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id WHERE b.id IS NULL",
    ),
    (
        qa.NULL_SAFE,
        "an equality that keeps the padded rows explicitly",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id "
        "WHERE (b.blocked_user_id = 1 OR b.id IS NULL)",
    ),
    (
        qa.OUTER_DEFEATED,
        "IS NOT NULL on the padded side",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id WHERE b.id IS NOT NULL",
    ),
    (
        qa.OUTER_DEFEATED,
        "a right join, which pads what came before it",
        "SELECT users.id FROM users RIGHT JOIN user_blocks AS b ON b.blocking_user_id = users.id WHERE users.id = 1",
    ),
    (
        qa.NULL_SAFE,
        "a filter on the relation the outer join does not pad",
        "SELECT users.id FROM users LEFT JOIN user_blocks AS b ON b.blocking_user_id = users.id WHERE users.id = 1",
    ),
]


def nulls_controls(schema: qa.Schema) -> list[str]:
    failures = []
    for expected, label, sql in NULLS_CASES:
        kinds = {kind for kind, _ in qa.walk_null_kinds(qa._parse(sql), schema)}
        # A case that should be clean has to be clean outright; a case that should be caught has to be caught, and
        # may well be caught twice, as a `!=` against an outer joined relation is.
        ok = kinds == {qa.NULL_SAFE} if expected == qa.NULL_SAFE else expected in kinds
        if not ok:
            failures.append(f"{label}: want {expected} got {sorted(kinds)}")
        elif VERBOSE:
            print(f"  ok   {label:<58} -> {', '.join(sorted(kinds))}")
    return failures


# ---------------------------------------------------------------------------- bounds controls

BOUNDS_CASES = [
    (qa.UNSCOPED, "a bare read of a growing table", "SELECT users.id FROM users"),
    (qa.LIMITED, "a LIMIT", "SELECT users.id FROM users LIMIT 10"),
    (qa.LIMITED, "a bound LIMIT", "SELECT users.id FROM users ORDER BY users.id LIMIT $1"),
    (qa.ONE_ROW, "an aggregate over the whole result", "SELECT count(*) FROM users"),
    (
        qa.ONE_ROW,
        "an aggregate inside another call is still an aggregate",
        "SELECT coalesce(sum(invoices.amount), 0) FROM invoices",
    ),
    (
        qa.UNSCOPED,
        "the same aggregate with a grouping, which returns one row per group",
        "SELECT count(*) FROM users GROUP BY users.city",
    ),
    (
        qa.UNSCOPED,
        "an aggregate in a scalar subquery, which does not collapse the outer result",
        "SELECT (SELECT count(*) FROM user_blocks) AS c, users.id FROM users",
    ),
    (qa.ONE_ROW, "a primary key equality", "SELECT users.id FROM users WHERE users.id = 1"),
    (qa.ONE_ROW, "a unique column equality", "SELECT users.id FROM users WHERE users.username = 'x'"),
    (
        qa.UNSCOPED,
        "an equality on a property rather than an identifier",
        "SELECT users.id FROM users WHERE users.hosting_status = 'can_host'",
    ),
    (
        qa.SCOPED,
        "a foreign key equality, which names one entity and grows with it",
        "SELECT messages.id FROM messages WHERE messages.conversation_id = 1",
    ),
    (qa.PINNED_LIST, "a list of identifiers", "SELECT users.id FROM users WHERE users.id IN (1, 2, 3)"),
    (
        qa.UNSCOPED,
        "IN a subquery, which is not a list the statement was handed",
        "SELECT users.id FROM users WHERE users.id IN (SELECT user_blocks.blocked_user_id FROM user_blocks)",
    ),
    (
        qa.PINNED_LIST,
        "an OR whose every arm names rows",
        "SELECT users.id FROM users WHERE users.username = 'x' OR users.email = 'y'",
    ),
    (
        qa.UNSCOPED,
        "an OR with one arm that names nothing",
        "SELECT users.id FROM users WHERE users.username = 'x' OR users.city = 'y'",
    ),
    (qa.STATIC, "a table the repository fixes the size of", "SELECT regions.code FROM regions"),
    (
        qa.UNSCOPED,
        "a static table joined to a growing one",
        "SELECT regions.code FROM regions JOIN users ON users.geom IS NOT NULL",
    ),
    (qa.NO_ROWS, "an empty IN list, as SQLAlchemy renders it", "SELECT users.id FROM users WHERE false"),
    (
        qa.SCOPED,
        "a key equality on one side of a join that fans out into the other",
        "SELECT messages.id FROM users JOIN messages ON messages.author_id = users.id WHERE users.id = 1",
    ),
    (
        qa.UNSCOPED,
        "a union is only as bounded as its worst branch",
        "SELECT users.id FROM users WHERE users.id = 1 UNION SELECT users.id FROM users",
    ),
    (qa.LIMITED, "a LIMIT on the union itself", "SELECT users.id FROM users UNION SELECT users.id FROM users LIMIT 5"),
    (
        qa.ONE_ROW,
        "every column of a composite unique key",
        "SELECT moderation_states.id FROM moderation_states "
        "WHERE moderation_states.object_type = 'comment' AND moderation_states.object_id = 1",
    ),
    (
        qa.SCOPED,
        "only part of a composite unique key",
        "SELECT moderation_states.id FROM moderation_states WHERE moderation_states.object_type = 'comment'",
    ),
    (qa.ONE_ROW, "no relation at all", "SELECT 1"),
]


def bounds_controls(schema: qa.Schema) -> list[str]:
    failures = []
    for expected, label, sql in BOUNDS_CASES:
        got = qa.result_bound(qa._parse(sql), schema)
        if got[0] != expected:
            failures.append(f"{label}: want {expected} got {got}")
        elif VERBOSE:
            print(f"  ok   {label:<58} -> {got[0]}")
    return failures


CONTROLS = {
    "visibility": (visibility_controls, len(VISIBILITY_CASES)),
    "moderation": (moderation_controls, len(MODERATION_CASES) + len(MODERATION_STATEMENT_CASES)),
    "nulls": (nulls_controls, len(NULLS_CASES)),
    "bounds": (bounds_controls, len(BOUNDS_CASES)),
}


# ---------------------------------------------------------------------------- cross-check

MODERATED = (
    r"comments|discussions|event_occurrences|friend_relationships|group_chats|host_requests|notifications|"
    r"public_trips|\"?references\"?|replies"
)


def cross_check(shapes: dict[str, qa.Shape], verdicts: dict[str, dict[str, qa.Verdict]]) -> list[str]:
    """Re-derive every clear from the raw statement text, by regex rather than from the AST.

    Anything the AST walk fails to see it also fails to judge, and a missed join or subquery turns into a false
    clear, so the counts a verdict reports are compared against what the text plainly holds. Only an undercount is
    a contradiction: the walk resolves views and CTEs, so it legitimately judges more than the text shows.
    """
    bad: list[str] = []

    def flag(shape_id: str, message: str, text: str) -> None:
        bad.append(f"{shape_id} | {message} | {text[:110]}")

    for shape_id, shape in shapes.items():
        sql, ex = shape.sql, shape.example
        verdict = verdicts[shape_id]

        nesting = verdict["nesting"]
        if nesting.state == qa.CLEAR and nesting.reason == "nothing nested":
            for text, label in ((sql, "fp"), (ex, "ex")):
                if re.search(r"\(\s*SELECT\b", text, re.I):
                    flag(shape_id, f"nesting clear but subselect in {label}", text)
                if re.match(r"\s*WITH\b", text, re.I):
                    flag(shape_id, f"nesting clear but CTE in {label}", text)
                if re.search(r"\bUNION\b|\bEXCEPT\b|\bINTERSECT\b", text, re.I):
                    flag(shape_id, f"nesting clear but set op in {label}", text)

        if (
            nesting.state == qa.CLEAR
            and nesting.reason != "nothing nested"
            and "not a relational" not in nesting.reason
        ):
            match = re.match(r"(\d+) nested", nesting.reason)
            if match:
                counted = int(match.group(1))
                # Every nested level opens with SELECT somewhere after the first one.
                # Each branch of a set operation is a sibling, not a nested level.
                branches = len(re.findall(r"\bUNION\b|\bEXCEPT\b|\bINTERSECT\b", ex, re.I))
                seen = max(0, len(re.findall(r"\bSELECT\b", ex, re.I)) - 1 - branches)
                if counted < seen:
                    flag(shape_id, f"nesting clear counting {counted} levels but {seen} nested SELECTs present", ex)

        joins = verdict["joins"]
        if joins.state == qa.CLEAR:
            seen = len(re.findall(r"\bJOIN\b", ex, re.I))
            if joins.reason == "no joins":
                if seen:
                    flag(shape_id, f"joins clear as 'no joins' but {seen} JOIN keywords", ex)
                if re.search(r"\bFROM\s+[\w.\"]+\s*,", ex, re.I):
                    flag(shape_id, "joins clear as 'no joins' but comma join in FROM", ex)
            else:
                counted = int(re.match(r"(\d+) join", joins.reason).group(1))
                if counted < seen:
                    flag(shape_id, f"joins clear counting {counted} but {seen} JOIN keywords present", ex)

        vis = verdict["visibility"]
        if vis.state == qa.CLEAR:
            # Every place a user relation can enter a statement: a FROM, a JOIN, or a comma join.
            relations = re.findall(r'(?:FROM|JOIN|,)\s+(?:public\.)?"?(users|lite_users)"?(?![\w."])', ex, re.I)
            if vis.reason == "reads no user relation":
                if relations:
                    flag(shape_id, f"visibility clear as reading no user relation but {len(relations)} present", ex)
            else:
                counted = int(re.match(r"(\d+) user relation", vis.reason).group(1))
                if counted < len(relations):
                    flag(shape_id, f"visibility counted {counted} user relations but {len(relations)} present", ex)
                # Something has to be doing the filtering the verdict claims.
                if not re.search(r"banned_at IS NULL|\bis_visible\b", ex, re.I):
                    flag(shape_id, "visibility clear but no banned_at or is_visible test in the text", ex)
                if not re.search(r"shadowed_at IS NULL", ex, re.I):
                    flag(shape_id, "visibility clear but no shadowed_at test in the text", ex)
                if not re.search(r"user_blocks", ex, re.I):
                    flag(shape_id, "visibility clear but no user_blocks test in the text", ex)

        mod = verdict["moderation"]
        if mod.state == qa.CLEAR:
            # The relation a write targets is the writes dimension's business and this dimension skips it, so the
            # leading UPDATE / DELETE FROM / INSERT INTO clause is not part of what it claims about.
            body = re.sub(r"^\s*(UPDATE|DELETE FROM|INSERT INTO)\s+[\w.\"]+", "", ex, flags=re.I)
            relations = re.findall(rf"(?:FROM|JOIN|,)\s+(?:public\.)?({MODERATED})(?![\w.\"])", body, re.I)
            if mod.reason == "reads no moderated content":
                if relations:
                    flag(shape_id, f"moderation clear as reading no moderated content but {len(relations)} present", ex)
            else:
                counted = int(re.match(r"(\d+) moderated relation", mod.reason).group(1))
                if counted < len(relations):
                    flag(shape_id, f"moderation counted {counted} relations but {len(relations)} present", ex)
                if not re.search(r"\bmoderation_states\b", ex, re.I):
                    flag(shape_id, "moderation clear but no moderation_states in the text", ex)
                if not re.search(r"\.visibility\b", ex, re.I):
                    flag(shape_id, "moderation clear but no visibility test in the text", ex)

        nulls = verdict["nulls"]
        if nulls.state == qa.CLEAR:
            # A negation inside a string literal is text, not a predicate, and the example carries real values.
            text = re.sub(r"'(?:[^']|'')*'", "''", ex)
            # `IS NOT NULL` and `IS NOT DISTINCT FROM` are one definite operator, not a negation of anything.
            negations = len(re.findall(r"\bNOT\b", text, re.I)) - len(re.findall(r"\bIS\s+NOT\b", text, re.I))
            inequalities = len(re.findall(r"!=|<>", text))
            outer_joins = len(re.findall(r"\b(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?JOIN\b", text, re.I))
            seen = negations + inequalities + outer_joins
            if nulls.reason == "nothing that turns on NULL":
                if seen:
                    flag(shape_id, f"nulls clear as turning on nothing but {seen} negations or outer joins present", ex)
            else:
                counted = int(re.match(r"(\d+) construct", nulls.reason).group(1))
                if counted < seen:
                    flag(shape_id, f"nulls counted {counted} constructs but {seen} present", ex)

        bounds = verdict["bounds"]
        if bounds.state == qa.CLEAR:
            text = re.sub(r"'(?:[^']|'')*'", "''", ex)
            kind, _, why = bounds.reason.partition(": ")
            aggregate = re.search(
                r"\b(count|sum|avg|min|max|string_agg|array_agg|json_agg|bool_or|bool_and)\s*\(", text, re.I
            )
            grouped = re.search(r"\bGROUP BY\b", text, re.I)
            limited = re.search(r"\bLIMIT\b", text, re.I)
            # Whatever else the reason claims, a read with nothing to restrict it cannot be bounded.
            if (
                kind not in ("not a read", "static table")
                and why != "reads no relation"
                and not (
                    re.search(r"\bWHERE\b", text, re.I)
                    or limited
                    or grouped
                    or aggregate
                    or not re.search(r"\bFROM\b", text, re.I)
                )
            ):
                flag(shape_id, f"bounds clear as '{bounds.reason}' but no WHERE, LIMIT, GROUP BY or aggregate", ex)
            if kind == qa.LIMITED and not limited:
                flag(shape_id, "bounds clear as limited but no LIMIT in the text", ex)
            # A GROUP BY is not checked here: the text cannot say which level it belongs to, and a grouped subquery
            # inside an ungrouped aggregate is an ordinary shape.
            if why == "aggregate over the whole result" and not aggregate:
                flag(shape_id, "bounds clear as an aggregate over the whole result but no aggregate in the text", ex)
            # `WITH ... INSERT` is a write however it opens, so a WITH only counts as a read when nothing in it writes.
            reads = re.match(r"\s*SELECT\b", ex, re.I) or (
                re.match(r"\s*WITH\b", ex, re.I) and not re.search(r"\b(INSERT|UPDATE|DELETE)\b", ex, re.I)
            )
            if kind == "not a read" and reads:
                flag(shape_id, "bounds clear as not a read but the statement returns rows", ex)
            if kind == qa.STATIC:
                others = set(re.findall(r"(?:FROM|JOIN)\s+(?:public\.)?\"?(\w+)\"?", text, re.I)) - {
                    "regions",
                    "languages",
                    "timezone_areas",
                }
                if others:
                    flag(shape_id, f"bounds clear as a static table but also reads {sorted(others)}", ex)
            # Every column the verdict rests on has to actually be restricted in the statement.
            if kind in (qa.SCOPED, qa.PINNED_LIST) or why.endswith("named by key"):
                for ref in re.findall(r"\b\w+\.\w+\b", why):
                    column = ref.split(".")[1]
                    # SQLAlchemy writes a bind on either side, so `id = ?` and `? = id` both count.
                    restricted = rf"\b{re.escape(column)}\s*(=|\bIN\b)|=\s*[\w.\"]*\b{re.escape(column)}\b"
                    if not re.search(restricted, text, re.I):
                        flag(shape_id, f"bounds rests on {ref} but it is not restricted in the text", ex)

        writes = verdict["writes"]
        if writes.state == qa.CLEAR and writes.reason.startswith("keyed on"):
            match = re.match(r"keyed on (\w+)\(([^)]*)\)", writes.reason)
            table, columns = match.group(1), [column.strip() for column in match.group(2).split(",")]
            for column in columns:
                if not re.search(rf"\b{re.escape(table)}\.{re.escape(column)}\s*=", sql, re.I) and not re.search(
                    rf"\b{re.escape(column)}\s*=", sql, re.I
                ):
                    flag(shape_id, f"writes keyed on {table}.{column} but no equality found", sql)
        if writes.state == qa.CLEAR and writes.reason == "insert of literal rows":
            if not re.match(r"\s*INSERT\b", sql, re.I):
                flag(shape_id, "insert-clear but not INSERT", sql)
            if re.search(r"\bSELECT\b", sql, re.I) and not re.search(
                r"FROM \(VALUES .*\) AS imp_sen\(", sql, re.I | re.S
            ):
                flag(shape_id, "insert of literal rows but SELECT present", sql)
            if re.search(r"\bJOIN\b", sql, re.I):
                flag(shape_id, "insert of literal rows but JOIN present", sql)
        if writes.state == qa.CLEAR and writes.reason == "not a write":
            if re.match(r"\s*(INSERT|UPDATE|DELETE)\b", sql, re.I):
                flag(shape_id, "not-a-write but is a write", sql)

    return bad


# ---------------------------------------------------------------------------- main


def main(argv: list[str] | None = None) -> int:
    global VERBOSE
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--schema", required=True, help="path or URL of the schema dump (schema.sql)")
    parser.add_argument("--data", help="path or URL of the merged query log; omit to run the controls only")
    parser.add_argument("--verbose", action="store_true", help="print every control, not just the failures")
    args = parser.parse_args(argv)
    VERBOSE = args.verbose

    schema = qa.parse_schema(qa.fetch(args.schema).decode())

    failed = 0
    for dimension, (run, total) in CONTROLS.items():
        failures = run(schema)
        failed += len(failures)
        for failure in failures:
            print(f"FAIL [{dimension}] {failure}")
        print(f"{dimension:<12} {total:>3} controls, {len(failures)} failures")

    if args.data:
        shapes = qa.load_shapes(qa.load_data(args.data))
        # Before the ledger, which only ever moves an open verdict: this checks the checker, not the reviews.
        verdicts = {
            shape_id: {dimension: function(shape, schema) for dimension, function in qa.CHECKS.items()}
            for shape_id, shape in shapes.items()
        }
        contradictions = cross_check(shapes, verdicts)
        failed += len(contradictions)
        seen: set[str] = set()
        for contradiction in contradictions:
            message = contradiction.split(" | ")[1][:45]
            if message not in seen:
                seen.add(message)
                print(f"FAIL [cross-check] {contradiction}")
        print(f"cross-check  {len(shapes):>3} shapes, {len(contradictions)} contradictions")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
