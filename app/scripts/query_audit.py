#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = ["sqlglot>=27"]
# ///
"""Audits every SQL query shape the backend test suite issues, against the schema those queries run on.

The input is the query log published by the last develop pipeline (app/scripts/query_log_report.py's merged
data.json.gz) plus the schema dump published alongside it. Run it with uv, which resolves sqlglot from the header
above:

  uv run app/scripts/query_audit.py --data data.json.gz --schema schema.sql

Both arguments accept a URL as well as a path, so the published artifacts can be audited directly:

  --data https://develop--test-artifacts.preview.couchershq.org/queries/data.json.gz
  --schema https://develop--schema.preview.couchershq.org/schema.sql

Every shape is judged on each dimension below, and a shape is only retired once every dimension has cleared it.
A dimension clears a shape either because it cannot exhibit that class of bug at all (a statement with one table
and no subquery has no join predicate to get wrong) or because it demonstrably satisfies the invariant. Anything
else stays open and is listed for review. Nothing is dropped for being uninteresting: the point is that the shapes
still open at the end are the complete set of queries a human has to read.

A clear is only worth as much as the check behind it, so app/scripts/query_audit_selftest.py runs each dimension
against statements built to fail it and re-derives every clear from the raw statement text by unrelated means.
"""

import argparse
import gzip
import json
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from collections.abc import Callable, Iterable, Iterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, NamedTuple

import sqlglot
from sqlglot import exp

# The recorder caps both the fingerprint and the concrete example at 4096 chars and marks what it cut. A cut
# statement is not valid SQL, so it cannot be parsed and cannot be cleared by anything here.
TRUNCATION_MARKER = "truncated by the query log"

DIALECT = "postgres"


# ---------------------------------------------------------------------------- schema


@dataclass
class Schema:
    """Primary keys, unique constraints and foreign keys, read out of the published pg_dump."""

    primary_keys: dict[str, tuple[str, ...]] = field(default_factory=dict)
    uniques: dict[str, list[tuple[str, ...]]] = field(default_factory=lambda: defaultdict(list))
    # (table, column) -> (referenced table, referenced column), one entry per column of the constraint
    foreign_keys: dict[tuple[str, str], tuple[str, str]] = field(default_factory=dict)
    tables: set[str] = field(default_factory=set)
    # (view, column) -> the base table column it is a plain copy of. Views carry no constraints of their own, so
    # without this every join to lite_users looks like it relates two unrelated columns.
    view_columns: dict[tuple[str, str], tuple[str, str]] = field(default_factory=dict)
    # (table, column) -> whether the column is declared NOT NULL. Base tables only.
    not_null: set[tuple[str, str]] = field(default_factory=set)
    columns: set[tuple[str, str]] = field(default_factory=set)

    def resolve(self, column: tuple[str, str]) -> tuple[str, str]:
        return self.view_columns.get(column, column)

    def nullable(self, column: tuple[str, str]) -> bool | None:
        """Whether this column can hold NULL, or None when the schema does not say.

        A view column is always None even when it copies a NOT NULL column: every view in this schema is built
        over an outer join or a union, either of which manufactures NULLs the base table never holds.
        """
        if column in self.not_null:
            return False
        if column in self.columns:
            return True
        return None

    def root(self, column: tuple[str, str]) -> tuple[str, str]:
        """Follow foreign keys to the column this one ultimately identifies a row of.

        Conversations are subtyped: host_requests.id and group_chats.id are both the primary key of their table
        and a foreign key to conversations.id, so a join of messages.conversation_id to host_requests.id relates a
        message to its own conversation even though neither column references the other.
        """
        current = self.resolve(column)
        seen = {current}
        while (parent := self.foreign_keys.get(current)) is not None and parent not in seen:
            current = parent
            seen.add(current)
        return current

    def is_key(self, table: str, column: str) -> bool:
        """Whether this column on its own identifies at most one row of the table."""
        return self.primary_keys.get(table) == (column,) or (column,) in self.uniques.get(table, [])

    def key_columns(self, table: str) -> list[tuple[str, ...]]:
        """Every column set that identifies at most one row: the primary key and each unique constraint."""
        keys = list(self.uniques.get(table, []))
        pk = self.primary_keys.get(table)
        if pk:
            keys.append(pk)
        return keys


def _split_columns(raw: str) -> tuple[str, ...]:
    return tuple(part.strip().strip('"') for part in raw.split(","))


def parse_schema(sql: str) -> Schema:
    """Reads constraints out of a pg_dump. Regex rather than a SQL parse: the input is machine-generated with a
    fixed shape, while the dump as a whole contains function bodies and extension DDL a parser trips over."""
    # Identifiers that collide with a SQL keyword come out quoted, "references" among them.
    name = r'"?(\w+)"?'
    qualifier = r'(?:"?\w+"?\.)?'
    schema = Schema()
    for match in re.finditer(rf"^CREATE (?:UNLOGGED )?TABLE {qualifier}{name} \(", sql, re.M):
        schema.tables.add(match.group(1))
    for match in re.finditer(rf"^CREATE (?:MATERIALIZED )?VIEW {qualifier}{name}", sql, re.M):
        schema.tables.add(match.group(1))

    constraint = re.compile(
        rf"ALTER TABLE (?:ONLY )?{qualifier}{name}\s+ADD CONSTRAINT \w+ (PRIMARY KEY|UNIQUE|FOREIGN KEY) \(([^)]*)\)"
        rf"(?:\s+REFERENCES {qualifier}{name}\(([^)]*)\))?",
        re.M,
    )
    for match in constraint.finditer(sql):
        table, kind, columns, ref_table, ref_columns = match.groups()
        cols = _split_columns(columns)
        if kind == "PRIMARY KEY":
            schema.primary_keys[table] = cols
        elif kind == "UNIQUE":
            schema.uniques[table].append(cols)
        elif ref_table:
            for column, ref_column in zip(cols, _split_columns(ref_columns)):
                schema.foreign_keys[(table, column)] = (ref_table, ref_column)

    # Unique indexes carry the same guarantee as unique constraints and SQLAlchemy emits plenty of them.
    for match in re.finditer(rf"^CREATE UNIQUE INDEX \w+ ON {qualifier}{name} USING \w+ \(([^)]*)\)(.*)$", sql, re.M):
        table, columns, tail = match.groups()
        # A partial index only identifies a row within the subset it covers, which is not a guarantee we can use
        # without reading the predicate, so leave those out.
        if "WHERE" in tail.upper():
            continue
        if all(re.fullmatch(r'"?\w+"?', part.strip()) for part in columns.split(",")):
            schema.uniques[table].append(_split_columns(columns))

    for match in re.finditer(rf"^CREATE (?:MATERIALIZED )?VIEW {qualifier}{name} AS\b(.*?);\n", sql, re.M | re.S):
        schema.view_columns.update(view_column_origins(match.group(1), match.group(2)))

    for match in re.finditer(rf"^CREATE (?:UNLOGGED )?TABLE {qualifier}{name} \((.*?)^\);", sql, re.M | re.S):
        table, body = match.groups()
        for line in body.splitlines():
            line = line.strip().rstrip(",")
            column = re.match(rf"{name}\s+(.*)$", line)
            if not column or line.upper().startswith(("CONSTRAINT", "PRIMARY KEY", "UNIQUE", "FOREIGN KEY", "CHECK")):
                continue
            schema.columns.add((table, column.group(1)))
            if "NOT NULL" in column.group(2).upper():
                schema.not_null.add((table, column.group(1)))
    return schema


def view_column_origins(view: str, body: str) -> dict[tuple[str, str], tuple[str, str]]:
    """Maps a view's output columns to the base table columns they are a plain copy of.

    A view is a named query, so its columns resolve exactly the way a derived table's do.
    """
    try:
        select = sqlglot.parse_one(body.replace("WITH NO DATA", ""), dialect=DIALECT)
    except Exception:  # noqa: BLE001 - a view we cannot read simply contributes nothing
        return {}
    return {(view, name): origin for name, origin in projection_origins(select, []).items()}


# ---------------------------------------------------------------------------- shapes


@dataclass
class Shape:
    id: str
    sql: str
    example: str
    write: bool
    ast: exp.Expression | None
    parse_error: str | None
    # Call sites and spans this shape was seen under, most frequent first.
    sites: list[str] = field(default_factory=list)
    spans: list[str] = field(default_factory=list)
    executions: int = 0

    @property
    def app_sites(self) -> list[str]:
        return [site for site in self.sites if "couchers/" in site]


def _parse(sql: str) -> exp.Expression | None:
    parsed = sqlglot.parse_one(sql, dialect=DIALECT, error_level=sqlglot.ErrorLevel.RAISE)
    return parsed if isinstance(parsed, exp.Expression) else None


def parse_statement(shape: dict[str, Any]) -> tuple[exp.Expression | None, str | None]:
    """The concrete example first: it is the statement as the driver sent it, so it parses without help. The
    fingerprint is the fallback for the handful whose example was truncated but whose binds collapsed enough to
    fit; its ? placeholders are rewritten to $1, which the postgres dialect understands."""
    failure = "statement truncated by the recorder's 4096 char cap"
    for candidate in (shape["example"], shape["sql"].replace("?", "$1")):
        if TRUNCATION_MARKER in candidate:
            continue
        try:
            parsed = _parse(candidate)
        except Exception as error:  # noqa: BLE001 - the message is the finding
            failure = str(error).split("\n")[0]
            continue
        if parsed is not None:
            return parsed, None
        failure = "parsed to nothing"
    return None, failure


def load_shapes(data: dict[str, Any]) -> dict[str, Shape]:
    sites: dict[str, str] = data["sites"]
    site_counts: dict[str, Counter[str]] = defaultdict(Counter)
    span_counts: dict[str, Counter[str]] = defaultdict(Counter)
    executions: Counter[str] = Counter()
    for spans in data["tests"].values():
        for span in spans:
            label = f"{span['kind']}:{span['name']}" if span["name"] else span["kind"]
            for shape_id, site_id in zip(span["queries"], span["sites"]):
                site_counts[shape_id][sites.get(site_id, site_id)] += 1
                span_counts[shape_id][label] += 1
                executions[shape_id] += 1

    shapes: dict[str, Shape] = {}
    for shape_id, raw in data["shapes"].items():
        ast, error = parse_statement(raw)
        shapes[shape_id] = Shape(
            id=shape_id,
            sql=raw["sql"],
            example=raw["example"],
            write=raw["write"],
            ast=ast,
            parse_error=error,
            sites=[site for site, _ in site_counts[shape_id].most_common()],
            spans=[span for span, _ in span_counts[shape_id].most_common()],
            executions=executions[shape_id],
        )
    return shapes


# ---------------------------------------------------------------------------- ast helpers


def statement_tables(ast: exp.Expression) -> set[str]:
    """Every relation the statement reads or writes, by name. Aliases collapse onto the underlying table, which is
    what matters for deciding whether more than one relation is in play."""
    return {table.name for table in ast.find_all(exp.Table) if table.name}


def has_subquery(ast: exp.Expression) -> bool:
    """Any nested query at all: a derived table, a scalar or IN subquery, a CTE or a set operation."""
    if any(ast.find_all(exp.Subquery, exp.With, exp.SetOperation)):
        return True
    # A bare Select nested under the root, as scalar subqueries and EXISTS produce.
    return any(node is not ast for node in ast.find_all(exp.Select))


def conjuncts(predicate: exp.Expression | None) -> list[exp.Expression]:
    """The top level AND terms of a predicate. Only terms that must all hold, so an OR stays whole: a key equality
    inside one arm of an OR does not bound the statement to one row."""
    if predicate is None:
        return []
    if isinstance(predicate, exp.And):
        return conjuncts(predicate.left) + conjuncts(predicate.right)
    if isinstance(predicate, exp.Paren):
        return conjuncts(predicate.this)
    return [predicate]


def _bound_value(node: exp.Expression) -> bool:
    """A parameter or a constant, i.e. something fixed per execution rather than another column."""
    # A cast, a sign or a parenthesis around a constant is still a constant, and the log has all three: psycopg
    # renders a bound -1 as `-1::BIGINT`, which is a negation of a cast of a literal.
    while isinstance(node, (exp.Cast, exp.Paren, exp.Neg)):
        node = node.this
    return isinstance(node, (exp.Placeholder, exp.Parameter, exp.Literal, exp.Boolean, exp.Null))


def bound_columns(predicate: exp.Expression | None) -> set[tuple[str, str]]:
    """Columns pinned to a fixed value by a top level equality, as (qualifier, column).

    Only the top level conjunction: an equality inside one arm of an OR does not pin anything, because the other
    arm can still match.
    """
    bound: set[tuple[str, str]] = set()
    for term in conjuncts(predicate):
        if not isinstance(term, exp.EQ):
            continue
        for side, other in ((term.left, term.right), (term.right, term.left)):
            if isinstance(side, exp.Column) and _bound_value(other):
                bound.add((side.table, side.name))
    return bound


def equality_bound_columns(predicate: exp.Expression | None) -> set[str]:
    return {column for _, column in bound_columns(predicate)}


def from_clause(node: exp.Expression) -> exp.From | None:
    # sqlglot spells the key "from_" since v30 and "from" before it.
    origin = node.args.get("from_") or node.args.get("from")
    return origin if isinstance(origin, exp.From) else None


# A base table column, as (table, column).
Origin = tuple[str, str]


@dataclass
class Frame:
    """What one query level can refer to.

    `sources` maps the name a column is qualified with to the real table behind it, or None when it is a derived
    table. `origins` covers those derived tables, mapping their output columns back to the base table columns they
    forward, so a join onto a subquery can still be judged against real keys.
    """

    sources: dict[str, str | None] = field(default_factory=dict)
    origins: dict[tuple[str, str], Origin] = field(default_factory=dict)


def projection_origins(select: exp.Expression, frames: list[Frame]) -> dict[str, Origin]:
    """For each output column of a query level, the base table column it is a plain copy of.

    Only straight column references are followed: a computed column is not a column of any table, and nothing here
    should claim it identifies rows the way its inputs do. For a set operation only the columns both sides agree
    on are kept, since either side can supply the row.
    """
    if isinstance(select, exp.SetOperation):
        left = projection_origins(select.this, frames)
        right = projection_origins(select.expression, frames)
        return {name: origin for name, origin in left.items() if right.get(name) == origin}
    if isinstance(select, exp.Subquery):
        return projection_origins(select.this, frames)
    if not isinstance(select, exp.Select):
        return {}
    inner = frames + [scope_frame(select, frames)]
    origins: dict[str, Origin] = {}
    for projection in select.expressions:
        column = projection.this if isinstance(projection, exp.Alias) else projection
        # max(messages.id) is still a value of messages.id, so a derived table that picks the latest row per group
        # still forwards a real column and can be judged against its keys.
        if isinstance(column, (exp.Min, exp.Max)):
            column = column.this
        if isinstance(column, exp.Column):
            resolved = resolve_column(column, inner)
            if resolved:
                origins[projection.alias_or_name] = resolved
    return origins


def scope_frame(node: exp.Expression, frames: list[Frame] | None = None) -> Frame:
    """The relations a SELECT, UPDATE or DELETE puts in scope, keyed by the name its columns are qualified with."""
    frame = Frame()
    outer = frames or []

    def add(relation: exp.Expression | None) -> None:
        if relation is None:
            return
        alias = relation.alias_or_name
        # A parenthesised join tree, which is how pg_dump writes the FROM of a view, parses as an unaliased
        # subquery around the join. Its relations are in scope just as if the parentheses were not there.
        if isinstance(relation, exp.Subquery) and not alias:
            add(relation.this)
            for nested in relation.args.get("joins") or []:
                add(nested.this)
            return
        if isinstance(relation, exp.Table):
            # A CTE is referenced exactly like a table, including from inside its own body when it recurses, so a
            # name an enclosing level already defined as a query resolves to that query rather than to a table.
            for enclosing in reversed(outer):
                if enclosing.sources.get(relation.name, "") is None:
                    frame.sources[alias] = None
                    for (source, column), origin in enclosing.origins.items():
                        if source == relation.name:
                            frame.origins[(alias, column)] = origin
                    return
            frame.sources[alias] = relation.name
            # SQLAlchemy qualifies columns of an unaliased table by its own name, and of an aliased one by the
            # alias; a schema qualified table can be referred to either way.
            frame.sources.setdefault(relation.name, relation.name)
        elif alias:
            frame.sources[alias] = None
            # The frame being built is in scope for its own FROM clause: a derived table can select from a CTE
            # this same statement declares.
            for name, origin in projection_origins(relation, outer + [frame]).items():
                frame.origins[(alias, name)] = origin

    # A CTE is referenced by name like a table, so it has to be in scope before the FROM that uses it is read.
    with_clause = node.args.get("with_") or node.args.get("with")
    for cte in with_clause.expressions if with_clause else []:
        name = cte.alias_or_name
        frame.sources[name] = None
        origins = projection_origins(cte.this, outer + [frame])
        # `WITH parents(id, parent_node_id, level) AS (...)` renames the body's columns positionally.
        declared = [column.name for column in (cte.args.get("alias").columns if cte.args.get("alias") else [])]
        if declared:
            inner_names = [projection.alias_or_name for projection in cte.this.selects]
            origins = {
                outer_name: origins[inner_name]
                for outer_name, inner_name in zip(declared, inner_names)
                if inner_name in origins
            }
        for column, origin in origins.items():
            frame.origins[(name, column)] = origin

    origin_clause = from_clause(node)
    if origin_clause is not None:
        add(origin_clause.this)
    if isinstance(node, (exp.Update, exp.Delete)):
        add(node.this)
    for join in node.args.get("joins") or []:
        add(join.this)
    return frame


def resolve_column(column: exp.Column, frames: list[Frame]) -> Origin | None:
    """The base table column this reference ultimately names, looking outwards for correlated references."""
    qualifier = column.table
    if not qualifier:
        # An unqualified column, as pg_dump writes view bodies. Attributable only when the level it sits in has a
        # single relation, in which case there is nothing else it could have come from.
        for frame in reversed(frames):
            # A table is registered under both its name and its alias, so count relations, not keys.
            distinct = {table if table else alias for alias, table in frame.sources.items()}
            if len(distinct) != 1:
                continue
            only = distinct.pop()
            if only in frame.sources and frame.sources[only] is None:
                return frame.origins.get((only, column.name))
            return (only, column.name)
        return None
    for frame in reversed(frames):
        if qualifier not in frame.sources:
            continue
        table = frame.sources[qualifier]
        if table is not None:
            return (table, column.name)
        return frame.origins.get((qualifier, column.name))
    return None


def own_nodes[T: exp.Expression](node: exp.Expression, *types: type[T]) -> Iterator[T]:
    """Nodes of the given types that belong to this query level rather than to one nested inside it.

    A nested query has its own relations in scope, so its columns say nothing about the level above: counting them
    as the outer level's would make an ordinary subquery look like it reads relations that are not there.
    """
    for child in node.args.values():
        for item in child if isinstance(child, list) else [child]:
            if not isinstance(item, exp.Expression) or isinstance(item, (exp.Select, exp.Subquery, exp.SetOperation)):
                continue
            if isinstance(item, types):
                yield item
            yield from own_nodes(item, *types)


def column_equalities(predicate: exp.Expression | None) -> list[tuple[exp.Column, exp.Column]]:
    """Every column to column equality in a predicate, including inside ORs and NOTs.

    Deliberately not limited to the top level conjunction: a join predicate that only correlates inside one arm of
    an OR still correlates, and this reads the predicate for what relates the two sides, not for what it filters.
    Equalities inside a nested query belong to that query's own level and are left to it.
    """
    if predicate is None:
        return []
    candidates = [predicate, *own_nodes(predicate, exp.EQ)]
    return [
        (node.left, node.right)
        for node in candidates
        if isinstance(node, exp.EQ) and isinstance(node.left, exp.Column) and isinstance(node.right, exp.Column)
    ]


def is_literal_row_source(source: exp.Expression) -> bool:
    """Whether an INSERT's source is just the rows it was handed.

    SQLAlchemy's insertmanyvalues wraps a plain multi row insert in `SELECT p0, p1 FROM (VALUES (...)) AS
    imp_sen(p0, p1, sen_counter) ORDER BY sen_counter` so it can use RETURNING and still match results back to
    input rows. It reads no table, so it carries no more risk than a VALUES insert, but only if the projection
    really is the columns of that VALUES list and nothing else.
    """
    if isinstance(source, exp.Values):
        return True
    if not isinstance(source, exp.Select):
        return False
    if source.args.get("joins") or source.args.get("where") or source.args.get("group"):
        return False
    # sqlglot spells the key "from_" since v30 and "from" before it.
    origin = source.args.get("from_") or source.args.get("from")
    if not isinstance(origin, exp.From):
        return False
    relation = origin.this
    if isinstance(relation, exp.Subquery):
        relation = relation.this
    if not isinstance(relation, exp.Values):
        return False
    # Every projected value must come from that VALUES list, so no lookup can hide in the select list. Casts are
    # the one call allowed: the wrapper types every column it forwards.
    for projection in source.expressions:
        for node in projection.find_all(exp.Select, exp.Subquery, exp.Func):
            if not isinstance(node, exp.Cast):
                return False
    return True


def key_anchored(ast: exp.Expression, table: str, schema: Schema) -> tuple[str, ...] | None:
    """The key that pins this statement to at most one row of `table`, or None if nothing does."""
    where = ast.args.get("where")
    bound = equality_bound_columns(where.this if isinstance(where, exp.Where) else None)
    for key in schema.key_columns(table):
        if set(key) <= bound:
            return key
    return None


# ---------------------------------------------------------------------------- checks

CLEAR = "clear"
OPEN = "open"
# Read by a person and found correct, or read and found wrong. Both are recorded per shape id in the ledger beside
# this script; the id is a hash of the statement, so editing the query invalidates its review and it comes back.
REVIEWED = "reviewed"
BUG = "bug"

# How a join relates its two sides, best first. A join is only as good as its strongest equality.
KEY = "key"
PINNED = "pinned"
SHARED_PARENT = "shared parent"
EXPRESSION = "expression"
NON_KEY = "non key"
UNRESOLVED = "unresolved"
NO_EQUALITY = "no equality"
JOIN_RANK = [KEY, PINNED, SHARED_PARENT, EXPRESSION, NON_KEY, UNRESOLVED, NO_EQUALITY]
# The two that need no reading: the join either follows a key, or brings in a single row named by its key.
JOIN_SAFE = {KEY, PINNED}


def classify_pair(left: tuple[str, str], right: tuple[str, str], schema: Schema) -> str:
    """How strongly one column equality ties two rows together.

    KEY means one side is a foreign key to the other's primary key, so the equality picks out the one parent row
    the child names. SHARED_PARENT means both sides point at the same third table, which relates rows that happen
    to share a parent rather than rows that reference each other. NON_KEY means the equality carries no key at
    all: matching on a birthdate is the shape that let a verification attempt attach to a stranger's account.
    """
    left, right = schema.resolve(left), schema.resolve(right)
    root = schema.root(left)
    if root != schema.root(right):
        return NON_KEY
    # Both sides identify a row of the same thing. If either side is a key of its own table the equality picks out
    # at most one row there, which is a real parent-child relation.
    if schema.is_key(*left) or schema.is_key(*right):
        return KEY
    # Otherwise it is only a relation at all if both sides are references to that shared row, which relates every
    # pair that hangs off it. Two copies of a plain attribute reach a shared root trivially and relate nothing:
    # that is what matching users on their birthdate was.
    if left != root and right != root:
        return SHARED_PARENT
    return NON_KEY


def _render(resolved: Origin | None, column: exp.Column) -> str:
    return f"{resolved[0]}.{resolved[1]}" if resolved else f"?.{column.name}"


def join_condition(join: exp.Join, host: exp.Expression) -> exp.Expression | None:
    """What relates this join's relation to the rest of the query.

    For an inner join the WHERE is part of it: `A JOIN B ON X WHERE Y` and `A, B WHERE X AND Y` are the same
    query, and the strong verification leak was written the second way, so reading only the ON clause would have
    missed the very bug this check exists for. An outer join is judged on its ON alone, because there a WHERE
    filters the joined result instead of deciding what joins to what.
    """
    on = join.args.get("on")
    if join.args.get("side"):
        return on
    where = host.args.get("where")
    filtering = where.this if isinstance(where, exp.Where) else None
    if on is None or filtering is None:
        return on or filtering
    return exp.and_(on, filtering)


def classify_join(join: exp.Join, host: exp.Expression, frames: list[Frame], schema: Schema) -> tuple[str, str]:
    """The kind of the join and a description of what related the two sides."""
    if join.args.get("using"):
        return KEY, "USING(...)"
    condition = join_condition(join, host)
    if condition is None:
        return NO_EQUALITY, "no join condition"
    introduced = join.this.alias_or_name if isinstance(join.this, exp.Expression) else None

    best, detail = NO_EQUALITY, "nothing relates the two sides"
    for left_column, right_column in column_equalities(condition):
        left = resolve_column(left_column, frames)
        right = resolve_column(right_column, frames)
        # For a comma join the condition is the whole WHERE, most of which is ordinary filtering; only the
        # equalities that reach the relation this join introduces say anything about the join itself.
        if introduced and introduced not in (left_column.table, right_column.table):
            continue
        rendered = f"{_render(left, left_column)} = {_render(right, right_column)}"
        if left is None or right is None:
            kind = UNRESOLVED
        else:
            kind = classify_pair(left, right, schema)
        if JOIN_RANK.index(kind) < JOIN_RANK.index(best):
            best, detail = kind, rendered
    # A relation whose own key is equated to a bound value contributes exactly one row, so it cannot mis-relate or
    # multiply anything regardless of what else the join says. SQLAlchemy's join_from(a, b, b.id == some_id) does
    # this to pull one known user into a query so a visibility clause can reference it.
    if introduced and JOIN_RANK.index(best) > JOIN_RANK.index(PINNED):
        table = frames[-1].sources.get(introduced)
        pinned = {column for qualifier, column in bound_columns(condition) if qualifier == introduced}
        if table and any(set(key) <= pinned for key in schema.key_columns(table)):
            return PINNED, f"{introduced} pinned to one row by its key"
    if best != NO_EQUALITY:
        return best, detail
    # No equality, but a predicate that mentions both sides still relates them, as a spatial containment join
    # does. Not something that can be checked against keys, so it is reported rather than cleared.
    qualifiers = {column.table for column in condition.find_all(exp.Column) if column.table}
    if introduced in qualifiers and qualifiers - {introduced}:
        return EXPRESSION, f"related by a predicate, not an equality: {condition.sql(dialect=DIALECT)[:80]}"
    return best, detail


UNCORRELATED = "uncorrelated"
CORRELATION_RANK = [KEY, UNCORRELATED, SHARED_PARENT, EXPRESSION, NON_KEY, UNRESOLVED, NO_EQUALITY]
CORRELATION_SAFE = {KEY, UNCORRELATED}


def level_predicates(node: exp.Expression) -> list[exp.Expression]:
    """Everything at this query level that can relate its rows to anything: its WHERE and its join conditions."""
    predicates = []
    where = node.args.get("where")
    if isinstance(where, exp.Where):
        predicates.append(where.this)
    for join in node.args.get("joins") or []:
        on = join.args.get("on")
        if on is not None:
            predicates.append(on)
    having = node.args.get("having")
    if isinstance(having, exp.Having):
        predicates.append(having.this)
    return predicates


def classify_correlation(node: exp.Expression, frames: list[Frame], schema: Schema) -> tuple[str, str]:
    """How a nested query level ties itself to the query around it.

    A subquery that reads no outer column stands on its own: it is a complete query whose own joins are checked
    like any other, and there is no correlation to get wrong. One that does read an outer column relates its rows
    to the outer row through a predicate, exactly as a join does, and is judged the same way.
    """
    local, outer = frames[-1], frames[:-1]

    def is_outer(column: exp.Column) -> bool:
        qualifier = column.table
        return bool(qualifier) and qualifier not in local.sources and any(qualifier in f.sources for f in outer)

    # A qualifier that belongs to no level we resolved is a relation this walk does not understand, and treating
    # it as local would silently turn a correlated subquery into a standalone one.
    own = list(own_nodes(node, exp.Column))
    unknown = {
        column.table
        for column in own
        if column.table and column.table not in local.sources and not any(column.table in f.sources for f in outer)
    }
    if unknown:
        return UNRESOLVED, f"reads {', '.join(sorted(unknown))}, which resolves to no known relation"

    correlated = [column for column in own if is_outer(column)]
    if not correlated:
        return UNCORRELATED, "reads nothing from the enclosing query"

    best, detail = NO_EQUALITY, f"reads {correlated[0].sql(dialect=DIALECT)} but no equality ties the two levels"
    for predicate in level_predicates(node):
        for left_column, right_column in column_equalities(predicate):
            # Only equalities that cross the boundary say anything about the correlation.
            if is_outer(left_column) == is_outer(right_column):
                continue
            left = resolve_column(left_column, frames)
            right = resolve_column(right_column, frames)
            rendered = f"{_render(left, left_column)} = {_render(right, right_column)}"
            kind = UNRESOLVED if left is None or right is None else classify_pair(left, right, schema)
            if CORRELATION_RANK.index(kind) < CORRELATION_RANK.index(best):
                best, detail = kind, rendered
    return best, detail


def walk_correlations(ast: exp.Expression, schema: Schema) -> list[tuple[str, str]]:
    """Every nested query level in the statement, classified by how it ties itself to the level above."""
    found: list[tuple[str, str]] = []

    def visit(node: exp.Expression, frames: list[Frame]) -> None:
        hosts_relations = isinstance(node, (exp.Select, exp.Update, exp.Delete))
        inner = frames + [scope_frame(node, frames)] if hosts_relations else frames
        # Every query level below the statement itself, which includes ones with no enclosing relations of their
        # own: a CTE body and a set operation's branches are nested text even though nothing can correlate them.
        if hosts_relations and node is not ast:
            found.append(classify_correlation(node, inner, schema))
        for child in node.args.values():
            for item in child if isinstance(child, list) else [child]:
                if isinstance(item, exp.Expression):
                    visit(item, inner)

    visit(ast, [])
    return found


def walk_joins(ast: exp.Expression, schema: Schema) -> list[tuple[str, str]]:
    """Every join in the statement, at every level of nesting, classified."""
    found: list[tuple[str, str]] = []

    def visit(node: exp.Expression, frames: list[Frame]) -> None:
        hosts_relations = isinstance(node, (exp.Select, exp.Update, exp.Delete))
        inner = frames + [scope_frame(node, frames)] if hosts_relations else frames
        if hosts_relations:
            for join in node.args.get("joins") or []:
                found.append(classify_join(join, node, inner, schema))
        for child in node.args.values():
            for item in child if isinstance(child, list) else [child]:
                if isinstance(item, exp.Expression):
                    visit(item, inner)

    visit(ast, [])
    return found


@dataclass
class Verdict:
    state: str
    reason: str


Check = Callable[[Shape, Schema], Verdict]
CHECKS: dict[str, Check] = {}


def check(dimension: str) -> Callable[[Check], Check]:
    def register(function: Check) -> Check:
        CHECKS[dimension] = function
        return function

    return register


@check("nesting")
def check_nesting(shape: Shape, schema: Schema) -> Verdict:
    """Does a nested query relate itself to the query around it correctly?

    A correlated subquery ties its rows to the outer row through a predicate the same way a join does, and can get
    that tie wrong the same way. Statements with nothing nested inside them clear here; the rest are the material
    for the correlation pass.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    if isinstance(shape.ast, exp.Command):
        # SET, SHOW, REFRESH MATERIALIZED VIEW: no relational content of their own.
        return Verdict(CLEAR, "not a relational statement")
    tables = statement_tables(shape.ast)
    has_cte = bool(shape.ast.args.get("with_") or shape.ast.args.get("with"))
    if (
        isinstance(shape.ast, exp.Insert)
        and len(tables) == 1
        and not has_cte
        and is_literal_row_source(shape.ast.expression)
    ):
        return Verdict(CLEAR, f"insert of literal rows into {next(iter(tables))}, reads no relation")
    levels = walk_correlations(shape.ast, schema)
    if not levels:
        return Verdict(CLEAR, "nothing nested")
    worst = max(levels, key=lambda item: CORRELATION_RANK.index(item[0]))
    if worst[0] in CORRELATION_SAFE:
        return Verdict(CLEAR, f"{len(levels)} nested level(s), each standalone or correlated on a key")
    return Verdict(OPEN, f"{worst[0]}: {worst[1]}")


@check("joins")
def check_joins(shape: Shape, schema: Schema) -> Verdict:
    """Does every join relate the two sides by a key?

    This is the dimension the strong verification leak lived in: the lite_users view joined an attempt to a user
    on birthdate and sex, columns that are equal for plenty of pairs of rows that have nothing to do with each
    other. A join carrying a foreign key cannot do that, so those clear here and the rest are listed.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    joins = walk_joins(shape.ast, schema)
    if not joins:
        return Verdict(CLEAR, "no joins")
    worst = max(joins, key=lambda item: JOIN_RANK.index(item[0]))
    if worst[0] in JOIN_SAFE:
        return Verdict(CLEAR, f"{len(joins)} join(s), each on a key or pinned to one row")
    return Verdict(OPEN, f"{worst[0]}: {worst[1]}")


# ---------------------------------------------------------------------------- visibility

# The relations that carry a user's identity. lite_users is the materialized view of the same rows, and folds the
# banned and deleted test into a single is_visible column.
USER_RELATIONS = {"users", "lite_users"}

# The three things couchers.sql.users_visible hides, each detected by the predicate it emits.
BANNED = "banned"
DELETED = "deleted"
SHADOW = "shadow"
BLOCKS = "blocks"
IS_VISIBLE = "is_visible"

# How thoroughly one user relation is filtered, best first.
FULL = "filtered"
MUTUAL = "mutually filtered"
UNSHADOWED = "visible and unshadowed"
VISIBLE_ONLY = "visible only"
UNFILTERED = "unfiltered"
VISIBILITY_RANK = [FULL, MUTUAL, UNSHADOWED, VISIBLE_ONLY, UNFILTERED]
# users_visible for a logged in caller, and the viewer side of users_visible_to_each_other. Both are what the
# helpers emit; anything weaker is either an anonymous caller, a deliberate exemption, or a leak.
VISIBILITY_SAFE = {FULL, MUTUAL}


def _is_null(term: exp.Expression, alias: str, column: str) -> bool:
    return (
        isinstance(term, exp.Is)
        and isinstance(term.this, exp.Column)
        and term.this.table == alias
        and term.this.name == column
        and isinstance(term.expression, exp.Null)
    )


def _mentions(term: exp.Expression, alias: str, column: str) -> bool:
    return any(node.table == alias and node.name == column for node in term.find_all(exp.Column))


def clause_marks(term: exp.Expression, alias: str, table: str) -> set[str]:
    """Which parts of the visibility filter this one conjunct applies to the given user relation."""
    if isinstance(term, exp.Paren):
        return clause_marks(term.this, alias, table)
    if isinstance(term, exp.Column) and term.table == alias and term.name == IS_VISIBLE:
        return {IS_VISIBLE}
    if _is_null(term, alias, "banned_at"):
        return {BANNED}
    if _is_null(term, alias, "deleted_at"):
        return {DELETED}
    if _is_null(term, alias, "shadowed_at"):
        return {SHADOW}
    # `shadowed_at IS NULL OR id = <the caller>`: a shadowbanned user still sees themselves.
    if isinstance(term, exp.Or):
        arms = [arm.this if isinstance(arm, exp.Paren) else arm for arm in term.flatten()]
        shadow = [arm for arm in arms if _is_null(arm, alias, "shadowed_at")]
        self_id = [
            arm
            for arm in arms
            if isinstance(arm, exp.EQ)
            and isinstance(arm.left, exp.Column)
            and arm.left.table == alias
            and arm.left.name == "id"
            and _bound_value(arm.right)
        ]
        if shadow and len(shadow) + len(self_id) == len(arms):
            return {SHADOW}
    # ~id.in_(_relevant_user_blocks(...)) and ~_users_block_each_other(a, b): either way a negated predicate over
    # user_blocks that names this relation's id.
    if isinstance(term, exp.Not):
        blocks = any(source.name == "user_blocks" for source in term.find_all(exp.Table))
        if blocks and _mentions(term, alias, "id"):
            return {BLOCKS}
    return set()


def level_relations(node: exp.Expression) -> list[tuple[str, str]]:
    """The base tables this level reads, as (the name its columns are qualified with, the table)."""
    found: list[tuple[str, str]] = []

    def add(relation: exp.Expression | None) -> None:
        if isinstance(relation, exp.Subquery) and not relation.args.get("alias"):
            # A parenthesised join tree, as pg_dump writes a view's FROM.
            add(relation.this)
            for nested in relation.args.get("joins") or []:
                add(nested.this)
        elif isinstance(relation, exp.Table):
            found.append((relation.alias_or_name, relation.name))

    origin = from_clause(node)
    if origin is not None:
        add(origin.this)
    if isinstance(node, (exp.Update, exp.Delete)):
        add(node.this)
    for join in node.args.get("joins") or []:
        add(join.this)
    return found


def level_filters(node: exp.Expression) -> list[tuple[exp.Expression, str | None]]:
    """Conjuncts that filter rows at this level, each with the relation it is restricted to, or None for all.

    An inner join's ON filters the joined result exactly as the WHERE does, so it counts for every relation. An
    outer join's ON only decides what the joined relation contributes, so it counts for that relation alone.
    """
    terms: list[tuple[exp.Expression, str | None]] = []
    where = node.args.get("where")
    if isinstance(where, exp.Where):
        terms += [(term, None) for term in conjuncts(where.this)]
    for join in node.args.get("joins") or []:
        on = join.args.get("on")
        if on is None:
            continue
        introduced = join.this.alias_or_name if isinstance(join.this, exp.Expression) else None
        scope = introduced if join.args.get("side") else None
        terms += [(term, scope) for term in conjuncts(on)]
    return terms


# Neither is a visibility clause. Both say the relation is restricted to users the statement was handed rather
# than users it chose, so whether that is safe depends on where the identifiers came from, not on the statement.
PINNED_ID = "pinned"  # named by bound values: a lookup of users the caller or an earlier query named
KEYED_ID = "keyed"  # equated to a column of the enclosing query: an attribute lookup on a row already in play
# The columns that name one user.
USER_IDENTIFIERS = {"id", "username", "email"}


def identity_mark(term: exp.Expression, alias: str) -> str | None:
    """How, if at all, this conjunct restricts the relation to users named elsewhere."""
    if isinstance(term, exp.Paren):
        return identity_mark(term.this, alias)
    # `username IN (...) OR id IN (...)`, as GetLiteUsers builds: still only the users it was handed.
    if isinstance(term, exp.Or):
        arms = [identity_mark(arm, alias) for arm in term.flatten()]
        if any(mark is None for mark in arms):
            return None
        return PINNED_ID if all(mark == PINNED_ID for mark in arms) else KEYED_ID
    if isinstance(term, exp.EQ):
        column, values = term.left, [term.right]
    elif isinstance(term, exp.In) and term.args.get("expressions"):
        column, values = term.this, term.args["expressions"]
    else:
        return None
    if not (isinstance(column, exp.Column) and column.table == alias and column.name in USER_IDENTIFIERS):
        return None
    if all(_bound_value(value) for value in values):
        return PINNED_ID
    if all(isinstance(value, exp.Column) and value.table != alias for value in values):
        return KEYED_ID
    return None


def classify_marks(marks: set[str]) -> str:
    if not (IS_VISIBLE in marks or {BANNED, DELETED} <= marks):
        return UNFILTERED
    if SHADOW in marks and BLOCKS in marks:
        return FULL
    if BLOCKS in marks:
        return MUTUAL
    if SHADOW in marks:
        return UNSHADOWED
    return VISIBLE_ONLY


def share_identity(term: exp.Expression, aliases: set[str]) -> tuple[str, str] | None:
    """The two user relations this equality proves are the same person, if that is what it does.

    `FROM users JOIN lite_users ON lite_users.id = users.id` reads one person through two relations, so a filter
    on either side decides which rows both of them contribute.
    """
    if not isinstance(term, exp.EQ):
        return None
    left, right = term.left, term.right
    if not (isinstance(left, exp.Column) and isinstance(right, exp.Column)):
        return None
    if left.name != "id" or right.name != "id":
        return None
    if left.table in aliases and right.table in aliases and left.table != right.table:
        return (left.table, right.table)
    return None


def keyed_columns(filters: list[tuple[exp.Expression, str | None]], alias: str) -> set[tuple[str, str]]:
    """The columns of other relations that this user relation's id is equated to."""
    keyed: set[tuple[str, str]] = set()
    for term, scope in filters:
        if scope is not None and scope != alias:
            continue
        if not isinstance(term, exp.EQ):
            continue
        for side, other in ((term.left, term.right), (term.right, term.left)):
            if (
                isinstance(side, exp.Column)
                and side.table == alias
                and side.name == "id"
                and isinstance(other, exp.Column)
                and other.table != alias
            ):
                keyed.add((other.table, other.name))
    return keyed


def guaranteed_visible(filters: list[tuple[exp.Expression, str | None]]) -> dict[tuple[str, str], set[str]]:
    """Columns a filtered EXISTS proves name a visible user, which is what where_users_column_visible builds.

    Only a top level EXISTS counts. One inside an OR, or negated, holds for some rows and not others, so it
    proves nothing about the column.
    """
    guaranteed: dict[tuple[str, str], set[str]] = {}
    for term, scope in filters:
        if scope is not None:
            continue
        node = term.this if isinstance(term, exp.Paren) else term
        if not isinstance(node, exp.Exists):
            continue
        inner = node.this
        if isinstance(inner, exp.Subquery):
            inner = inner.this
        if not isinstance(inner, exp.Select):
            continue
        for alias, (_, marks) in level_user_marks(inner).items():
            if classify_marks(marks) not in VISIBILITY_SAFE:
                continue
            for column in keyed_columns(level_filters(inner), alias):
                guaranteed[column] = guaranteed.get(column, set()) | marks
    return guaranteed


def level_user_marks(
    node: exp.Expression, inherited: dict[tuple[str, str], set[str]] | None = None
) -> dict[str, tuple[str, set[str]]]:
    """For each user relation this level reads, the table and the visibility clauses that apply to it."""
    relations = {alias: table for alias, table in level_relations(node) if table in USER_RELATIONS}
    if not relations:
        return {}
    filters = level_filters(node)
    marks = {alias: set[str]() for alias in relations}
    for term, scope in filters:
        for alias in relations:
            if scope is None or scope == alias:
                marks[alias] |= clause_marks(term, alias, relations[alias])
                identity = identity_mark(term, alias)
                if identity is not None:
                    marks[alias].add(identity)
    # An identity equality carries a filter from one relation to the other. From an outer join's ON it only
    # carries into the relation that join brings in, since the other side keeps its unmatched rows either way.
    edges: list[tuple[str, str]] = []
    for term, scope in filters:
        pair = share_identity(term, set(relations))
        if pair is None:
            continue
        edges += [(pair[0], pair[1]), (pair[1], pair[0])] if scope is None else [(pair[0], scope), (pair[1], scope)]
    for _ in range(len(relations)):
        for source, sink in edges:
            if source != sink:
                marks[sink] |= marks[source]
    # A relation read through a column an EXISTS has already proved visible is that same visible user. A proof
    # made at an enclosing level holds here too: it constrains every row this level is evaluated against.
    proved = {**(inherited or {}), **guaranteed_visible(filters)}
    for alias in relations:
        for column in keyed_columns(filters, alias):
            if column in proved:
                marks[alias] |= proved[column]
    return {alias: (relations[alias], marks[alias]) for alias in relations}


def walk_user_relations(ast: exp.Expression) -> list[tuple[str, str, str, set[str]]]:
    """Every read of users or lite_users in the statement, as (alias, table, how filtered, which clauses)."""
    found: list[tuple[str, str, str, set[str]]] = []
    # The rows a write touches are the writes dimension's business, not a disclosure question, so the relation it
    # writes to is not judged here. Anything else it reads is.
    target = ast.this.alias_or_name if isinstance(ast, (exp.Update, exp.Delete)) else None

    def visit(node: exp.Expression, inherited: dict[tuple[str, str], set[str]]) -> None:
        if isinstance(node, (exp.Select, exp.Update, exp.Delete)):
            for alias, (table, marks) in level_user_marks(node, inherited).items():
                # Only the statement's own level writes to the target. A nested query reading the same table
                # under the same name is an ordinary read, and exempting it would be a free pass.
                if not (node is ast and alias == target):
                    found.append((alias, table, classify_marks(marks), marks))
            inherited = {**inherited, **guaranteed_visible(level_filters(node))}
        for child in node.args.values():
            for item in child if isinstance(child, list) else [child]:
                if isinstance(item, exp.Expression):
                    visit(item, inherited)

    visit(ast, {})
    return found


@check("visibility")
def check_visibility(shape: Shape, schema: Schema) -> Verdict:
    """Does every read of a user apply the visibility filter?

    Deleted, banned, shadowbanned and blocked users must not be shown, and couchers.sql.users_visible is the one
    predicate that hides all four. A read that carries it clears; a read that carries less is either an anonymous
    caller, an admin surface, or a leak, and which of the three cannot be told from the SQL, so it is listed
    against the call site that issued it.

    Only reads of the user relations themselves are judged. A query that returns bare user ids without joining a
    user relation is outside this dimension, and so is a query that filters a user id column through the EXISTS
    that where_users_column_visible builds, whose own users relation is judged where it stands.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    reads = walk_user_relations(shape.ast)
    if not reads:
        return Verdict(CLEAR, "reads no user relation")
    worst = max(reads, key=lambda item: VISIBILITY_RANK.index(item[2]))
    # The viewer side of users_visible_to_each_other carries no shadow clause, which is right for the viewer and
    # wrong for anybody else, so it only clears alongside the other side it is being compared against.
    if worst[2] == MUTUAL and not any(read[2] == FULL for read in reads):
        return Verdict(OPEN, f"{worst[2]} but no fully filtered relation to pair it with: {worst[0]} ({worst[1]})")
    if worst[2] in VISIBILITY_SAFE:
        return Verdict(CLEAR, f"{len(reads)} user relation(s), each filtered")
    carries = ", ".join(sorted(worst[3])) or "nothing"
    return Verdict(OPEN, f"{worst[2]}: {worst[0]} ({worst[1]}) carries {carries}")


# ---------------------------------------------------------------------------- moderation


# Every table whose rows carry a moderation state, as the schema dump has them. users is left out: it declares
# __moderation_has_own_visibility_mechanism__, and its own visibility is the visibility dimension's business.
# moderation_log and moderation_queue are the moderation machinery itself, only read by the moderation service.
MODERATED_EXEMPT = {"users", "moderation_log", "moderation_queue"}
STATE_TABLE = "moderation_states"
STATE_COLUMN = "moderation_state_id"

# How a read of moderated content is filtered, best first.
STATE_JOINED = "state joined"  # where_moderated_content_visible: joined to its state, visibility constrained
STATE_TESTED = "state tested"  # moderation_state_column_visible: the state is reached through the column instead
# The state is reached, but one of the arms lets the row through without ever naming a visibility.
STATE_PARTLY_TESTED = "state partly tested"
STATE_UNCONSTRAINED = "state unconstrained"  # joined to its state but nothing says which visibilities pass
NO_STATE = "no state"
MODERATION_RANK = [STATE_JOINED, STATE_TESTED, STATE_PARTLY_TESTED, STATE_UNCONSTRAINED, NO_STATE]
MODERATION_SAFE = {STATE_JOINED, STATE_TESTED}


def moderated_tables(schema: Schema) -> set[str]:
    return {
        table for (table, column) in schema.foreign_keys if column == STATE_COLUMN and table not in MODERATED_EXEMPT
    } | {table for (table, column) in schema.view_columns if column == STATE_COLUMN and table not in MODERATED_EXEMPT}


def disjuncts(term: exp.Expression) -> list[exp.Expression]:
    """The arms of a predicate that only one of has to hold. A filter that is not present in every arm filters
    nothing, so this is what a claim about a predicate has to be checked against."""
    if isinstance(term, exp.Paren):
        return disjuncts(term.this)
    if isinstance(term, exp.Or):
        return [arm for side in term.flatten() for arm in disjuncts(side)]
    return [term]


def constrains_visibility(term: exp.Expression, state_alias: str) -> bool:
    """Whether this conjunct says which moderation visibilities pass.

    where_moderated_content_visible emits one OR of the visibilities a viewer may see, so every arm names the
    visibility column. An OR with an arm that does not is a predicate that lets unmoderated rows through.
    """
    return all(
        any(column.table == state_alias and column.name == "visibility" for column in arm.find_all(exp.Column))
        for arm in disjuncts(term)
    )


def state_column_kind(term: exp.Expression, alias: str) -> str | None:
    """How this conjunct reaches the row's moderation state through its moderation_state_id column.

    moderation_state_column_visible emits `moderation_state_id IS NULL OR EXISTS (SELECT ... FROM
    moderation_states WHERE id = moderation_state_id AND <visibilities>)`. Every arm has to be either the NULL
    case or an EXISTS onto that same state, or the conjunct is not this form at all. An arm that reaches the
    state but lets the row through without naming a visibility is reported separately: it is the form, with a
    hole in it.
    """
    reached = False
    complete = True
    for arm in disjuncts(term):
        if _is_null(arm, alias, STATE_COLUMN):
            continue
        node = arm.this if isinstance(arm, exp.Paren) else arm
        if not isinstance(node, exp.Exists):
            return None
        inner = node.this
        if isinstance(inner, exp.Subquery):
            inner = inner.this
        if not isinstance(inner, exp.Select):
            return None
        inner_filters = level_filters(inner)
        matched = [
            name
            for name, table in level_relations(inner)
            if table == STATE_TABLE and (alias, STATE_COLUMN) in keyed_columns(inner_filters, name)
        ]
        if not matched:
            return None
        reached = True
        if not any(constrains_visibility(t, state) for t, _ in inner_filters for state in matched):
            complete = False
    if not reached:
        return None
    return STATE_TESTED if complete else STATE_PARTLY_TESTED


def classify_moderated_relation(
    alias: str, filters: list[tuple[exp.Expression, str | None]], states: list[str]
) -> tuple[str, set[str]]:
    marks: set[str] = set()
    for term, scope in filters:
        if scope is not None and scope != alias:
            continue
        identity = identity_mark(term, alias)
        if identity is not None:
            marks.add(identity)
        through_column = state_column_kind(term, alias)
        if through_column is not None:
            marks.add(through_column)
    joined = [
        state
        for state in states
        if (alias, STATE_COLUMN) in keyed_columns(filters, state)
        # A state brought in by an outer join leaves the content row in the result when nothing matches, so it
        # decides nothing about that row.
        and not any(scope == state for _, scope in filters)
    ]
    if joined:
        marks.add(STATE_UNCONSTRAINED)
        if any(constrains_visibility(term, state) for term, _ in filters for state in joined):
            marks.add(STATE_JOINED)
    for kind in MODERATION_RANK:
        if kind in marks:
            return kind, marks
    return NO_STATE, marks


def walk_moderated_relations(ast: exp.Expression, schema: Schema) -> list[tuple[str, str, str, set[str]]]:
    """Every read of moderated content, as (alias, table, how it is filtered, which marks it carries)."""
    tables = moderated_tables(schema)
    found: list[tuple[str, str, str, set[str]]] = []
    target = ast.this.alias_or_name if isinstance(ast, (exp.Update, exp.Delete)) else None

    def visit(node: exp.Expression) -> None:
        if isinstance(node, (exp.Select, exp.Update, exp.Delete)):
            relations = level_relations(node)
            states = [alias for alias, table in relations if table == STATE_TABLE]
            filters = level_filters(node)
            for alias, table in relations:
                # Only the statement's own level writes to the target; a nested query reading the same table
                # under the same name is an ordinary read.
                if table in tables and not (node is ast and alias == target):
                    kind, marks = classify_moderated_relation(alias, filters, states)
                    found.append((alias, table, kind, marks))
        for child in node.args.values():
            for item in child if isinstance(child, list) else [child]:
                if isinstance(item, exp.Expression):
                    visit(item)

    visit(ast)
    return found


@check("moderation")
def check_moderation(shape: Shape, schema: Schema) -> Verdict:
    """Does every read of moderated content check the visibility its moderation state carries?

    Content under the unified moderation system is hidden, shadowed, unlisted or visible, and the row itself does
    not say which: the answer lives in the moderation_states row its moderation_state_id names. A read that does
    not reach that row shows hidden content to everyone. couchers.sql.where_moderated_content_visible joins the
    state and constrains its visibility; moderation_state_column_visible reaches it through the column instead,
    for rows that carry a state without being the moderated content themselves.

    Which visibilities a given read should accept is not decidable from the SQL: is_list_operation drops the
    unlisted arm, and the moderation service is meant to see everything. So this clears a read that constrains
    the visibility at all, and lists the rest against the call site that issued it.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    reads = walk_moderated_relations(shape.ast, schema)
    if not reads:
        return Verdict(CLEAR, "reads no moderated content")
    unsafe = [read for read in reads if read[2] not in MODERATION_SAFE]
    if not unsafe:
        return Verdict(CLEAR, f"{len(reads)} moderated relation(s), each checked against its state")
    # One statement can read several moderated tables in different ways, and the weakest is not always the one
    # worth reading, so name each of them rather than only the worst.
    seen: dict[tuple[str, str, str], set[str]] = {}
    for alias, table, kind, marks in sorted(unsafe, key=lambda read: MODERATION_RANK.index(read[2])):
        seen.setdefault((kind, alias, table), set()).update(marks - set(MODERATION_RANK))
    parts = [
        f"{kind}: {alias} ({table}) carries {', '.join(sorted(marks)) or 'nothing'}"
        for (kind, alias, table), marks in seen.items()
    ]
    return Verdict(OPEN, "; ".join(parts[:4]))


# ---------------------------------------------------------------------------- nulls


# What a construct that mixes negation with NULL does to the result, best first.
NULL_SAFE = "null safe"
UNKNOWN_NULLS = "nullability unknown"
DROPS_NULLS = "drops null rows"  # rows where the operand is NULL silently fail a test they read as passing
OUTER_DEFEATED = "outer join defeated"  # the padded rows are filtered away again, so the join is really inner
VANISHES = "result can vanish"  # NOT IN over a subquery that can yield NULL: no row matches, ever
NULL_RANK = [NULL_SAFE, UNKNOWN_NULLS, DROPS_NULLS, OUTER_DEFEATED, VANISHES]

# Three valued logic, as a predicate comes out under a set of columns known to be NULL.
TRUE, FALSE, NULL, UNKNOWN = "true", "false", "null", "unknown"

COMPARISONS = (exp.EQ, exp.NEQ, exp.GT, exp.GTE, exp.LT, exp.LTE, exp.Like, exp.ILike)


def outer_aliases(node: exp.Expression) -> set[str]:
    """The relations an outer join at this level can pad with NULLs, whatever their columns are declared."""
    padded: set[str] = set()
    earlier: set[str] = set()
    origin = from_clause(node)
    if origin is not None and isinstance(origin.this, exp.Expression):
        earlier.add(origin.this.alias_or_name)
    for join in node.args.get("joins") or []:
        side = str(join.args.get("side") or "").upper()
        introduced = join.this.alias_or_name if isinstance(join.this, exp.Expression) else None
        if introduced and side in ("LEFT", "FULL"):
            padded.add(introduced)
        if side in ("RIGHT", "FULL"):
            padded |= earlier
        if introduced:
            earlier.add(introduced)
    return padded


@dataclass
class NullScope:
    """What deciding nullability at one query level needs: how to resolve a column, and what can pad it."""

    frames: list[Frame]
    schema: Schema
    padded: set[str]  # relations an outer join at this level can fill with NULLs
    derived: dict[str, exp.Expression]  # the nested query behind each CTE and derived table name in scope


def derived_sources(node: exp.Expression) -> dict[str, exp.Expression]:
    """The nested queries this level names: its CTEs and its aliased derived tables."""
    found: dict[str, exp.Expression] = {}
    with_clause = node.args.get("with_") or node.args.get("with")
    for cte in with_clause.expressions if with_clause else []:
        found[cte.alias_or_name] = cte.this
    origin = from_clause(node)
    candidates = ([origin.this] if origin is not None else []) + [join.this for join in node.args.get("joins") or []]
    for candidate in candidates:
        if isinstance(candidate, exp.Subquery) and candidate.alias_or_name:
            found[candidate.alias_or_name] = candidate.this
    return found


def nested_scope(query: exp.Select, outer: NullScope) -> NullScope:
    return NullScope(
        outer.frames + [scope_frame(query, outer.frames)],
        outer.schema,
        outer_aliases(query),
        {**outer.derived, **derived_sources(query)},
    )


def query_selects(query: exp.Expression) -> list[exp.Expression]:
    """A query's output columns, taken from a set operation's leftmost branch: that is where postgres takes the
    output names from, whatever the other branches call theirs."""
    while isinstance(query, exp.Subquery):
        query = query.this
    if isinstance(query, exp.SetOperation):
        return query_selects(query.this)
    return list(query.selects) if isinstance(query, exp.Select) else []


def query_column_nullable(query: exp.Expression, index: int, scope: NullScope, depth: int = 0) -> bool | None:
    """Whether a nested query's index'th output column can be NULL.

    A set operation is taken branch by branch and positionally, since either branch can supply the row and they
    name their columns independently: `SELECT blocked_user_id ... UNION SELECT blocking_user_id ...` is one
    column, whatever the second branch calls it.
    """
    if depth > 4:
        return None
    while isinstance(query, exp.Subquery):
        query = query.this
    if isinstance(query, exp.SetOperation):
        sides = [
            query_column_nullable(query.this, index, scope, depth + 1),
            query_column_nullable(query.expression, index, scope, depth + 1),
        ]
        return True if True in sides else (None if None in sides else False)
    if not isinstance(query, exp.Select) or index >= len(query.selects):
        return None
    projection = query.selects[index]
    return expression_nullable(
        projection.this if isinstance(projection, exp.Alias) else projection, nested_scope(query, scope), depth + 1
    )


def expression_nullable(node: exp.Expression, scope: NullScope, depth: int = 0) -> bool | None:
    """Whether this expression can come out NULL, or None when the schema does not settle it.

    A bound parameter counts as never NULL: SQLAlchemy renders `column != None` as `column IS NOT NULL` rather
    than binding a NULL, so a `?` here stands for a value the caller actually supplied.
    """
    while isinstance(node, (exp.Paren, exp.Cast, exp.Neg)):
        node = node.this
    if isinstance(node, exp.Null):
        return True
    if isinstance(node, (exp.Literal, exp.Boolean, exp.Placeholder, exp.Parameter)):
        return False
    # count() over no rows is 0, not NULL, and EXISTS is always true or false.
    if isinstance(node, (exp.Count, exp.Exists)):
        return False
    if isinstance(node, exp.Coalesce):
        arms = [expression_nullable(arm, scope, depth) for arm in [node.this, *(node.expressions or [])]]
        return False if False in arms else (None if None in arms else True)
    if isinstance(node, exp.Column):
        if node.table and node.table in scope.padded:
            return True
        # A derived table is followed into rather than resolved through: an outer join or a union inside it can
        # produce a NULL the base column it forwards is declared never to hold.
        query = scope.derived.get(node.table)
        if query is not None and depth <= 4:
            names = [projection.alias_or_name for projection in query_selects(query)]
            return query_column_nullable(query, names.index(node.name), scope, depth) if node.name in names else None
        origin = resolve_column(node, scope.frames)
        return None if origin is None else scope.schema.nullable(origin)
    return None


def predicate_null_free(term: exp.Expression, scope: NullScope) -> bool | None:
    """Whether this predicate is always true or false, never NULL.

    NULL propagates through every comparison, and an AND or an OR of something that can be NULL can be NULL too.
    IS NULL, IS NOT NULL and EXISTS are the forms that are always definite whatever their operands hold.
    """
    if isinstance(term, exp.Paren):
        return predicate_null_free(term.this, scope)
    if isinstance(term, (exp.Is, exp.Exists, exp.Boolean)):
        return True
    if isinstance(term, exp.Not):
        return predicate_null_free(term.this, scope)
    if isinstance(term, (exp.And, exp.Or)):
        sides = [predicate_null_free(side, scope) for side in (term.left, term.right)]
        return False if False in sides else (None if None in sides else True)
    operands: list[exp.Expression] = []
    if isinstance(term, exp.In):
        operands = [term.this, *(term.expressions or [])]
        if term.args.get("query") is not None:
            return None
    elif isinstance(term, COMPARISONS):
        operands = [term.left, term.right]
    elif isinstance(term, exp.Column):
        # A boolean column standing on its own as a predicate, which is how `NOT is_deleted` is written.
        operands = [term]
    else:
        return None
    nullable = [expression_nullable(operand, scope) for operand in operands]
    return False if True in nullable else (None if None in nullable else True)


def _touches(node: exp.Expression, alias: str) -> bool:
    return any(column.table == alias for column in node.find_all(exp.Column))


def _under_nulls(term: exp.Expression, alias: str) -> str:
    """How this predicate comes out with every column of the relation set to NULL and everything else unknown."""
    if isinstance(term, exp.Paren):
        return _under_nulls(term.this, alias)
    if isinstance(term, exp.Is) and isinstance(term.expression, exp.Null):
        if not _touches(term.this, alias):
            return UNKNOWN
        # `alias.column IS NULL` holds for exactly the padded rows, which is the anti join idiom.
        return FALSE if term.args.get("negate") else TRUE
    if isinstance(term, exp.Not):
        return {TRUE: FALSE, FALSE: TRUE, NULL: NULL, UNKNOWN: UNKNOWN}[_under_nulls(term.this, alias)]
    if isinstance(term, (exp.And, exp.Or)):
        sides = [_under_nulls(side, alias) for side in (term.left, term.right)]
        dominant = FALSE if isinstance(term, exp.And) else TRUE
        recessive = TRUE if isinstance(term, exp.And) else FALSE
        if dominant in sides:
            return dominant
        if all(side == recessive for side in sides):
            return recessive
        return NULL if NULL in sides else UNKNOWN
    if isinstance(term, (exp.In, *COMPARISONS)):
        return NULL if _touches(term, alias) else UNKNOWN
    return UNKNOWN


def not_in_kind(node: exp.In, scope: NullScope) -> str:
    """What `x NOT IN (...)` does here, which turns on which side the NULLs can be on.

    A NULL anywhere in the right hand side makes the predicate NULL for every row that does not match, so nothing
    passes and the statement quietly returns nothing at all. A NULL on the left only drops that row.
    """
    query = node.args.get("query")
    if query is not None:
        right = query_column_nullable(query, 0, scope) if len(query_selects(query)) == 1 else None
    else:
        candidates = [expression_nullable(value, scope) for value in node.expressions or []]
        right = True if True in candidates else (None if None in candidates else False)
    if right is True:
        return VANISHES
    left = expression_nullable(node.this, scope)
    if right is None or left is None:
        return UNKNOWN_NULLS
    return DROPS_NULLS if left else NULL_SAFE


def describe(term: exp.Expression) -> str:
    rendered = " ".join(term.sql(dialect=DIALECT).split())
    return rendered if len(rendered) <= 70 else rendered[:69] + "…"


def level_null_kinds(node: exp.Expression, scope: NullScope) -> list[tuple[str, str]]:
    """Every construct at this level whose result turns on how NULL behaves, as (what it does, the construct).

    Only negations are judged. `column = ?` also drops the rows where the column is NULL, but that is what an
    equality means; it is `!=`, `NOT IN` and `NOT (...)` that read as "everything except" and quietly are not.
    """
    found: list[tuple[str, str]] = []
    for term in own_nodes(node, exp.Not, exp.NEQ):
        if isinstance(term, exp.Not):
            if isinstance(term.this, exp.In):
                found.append((not_in_kind(term.this, scope), describe(term)))
                continue
            definite = predicate_null_free(term.this, scope)
            kind = NULL_SAFE if definite else (UNKNOWN_NULLS if definite is None else DROPS_NULLS)
        else:
            sides = [expression_nullable(side, scope) for side in (term.left, term.right)]
            kind = DROPS_NULLS if True in sides else (UNKNOWN_NULLS if None in sides else NULL_SAFE)
        found.append((kind, describe(term)))

    # An outer join says the unmatched rows still belong in the result. A filter at the same level that throws
    # them away again contradicts that, and leaves an inner join written the long way round.
    for alias in sorted(scope.padded):
        defeating = [
            term for term, where in level_filters(node) if where is None and _under_nulls(term, alias) in (FALSE, NULL)
        ]
        kind = OUTER_DEFEATED if defeating else NULL_SAFE
        tail = f", then filtered by {describe(defeating[0])}" if defeating else ""
        found.append((kind, f"{alias} kept by an outer join{tail}"))
    return found


def walk_null_kinds(ast: exp.Expression, schema: Schema) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []

    def visit(node: exp.Expression, scope: NullScope) -> None:
        if isinstance(node, (exp.Select, exp.Update, exp.Delete)):
            scope = NullScope(
                scope.frames + [scope_frame(node, scope.frames)],
                schema,
                outer_aliases(node),
                {**scope.derived, **derived_sources(node)},
            )
            found.extend(level_null_kinds(node, scope))
        for child in node.args.values():
            for item in child if isinstance(child, list) else [child]:
                if isinstance(item, exp.Expression):
                    visit(item, scope)

    visit(ast, NullScope([], schema, set(), {}))
    return found


@check("nulls")
def check_nulls(shape: Shape, schema: Schema) -> Verdict:
    """Does anything here depend on NULL behaving the way it does not?

    Postgres compares against NULL with three valued logic, and a WHERE keeps only the rows its predicate makes
    true, so NULL and false are the same answer to a filter. Negation is where that bites: `x != 'a'` reads as
    "everything but a" and silently omits the rows where x is NULL, and `x NOT IN (subquery)` returns nothing at
    all, for every row, as soon as one row of that subquery is NULL. An outer join is the other half of it, since
    it manufactures NULLs no column is declared to hold.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    kinds = walk_null_kinds(shape.ast, schema)
    if not kinds:
        return Verdict(CLEAR, "nothing that turns on NULL")
    unsafe = [item for item in kinds if item[0] != NULL_SAFE]
    if not unsafe:
        return Verdict(CLEAR, f"{len(kinds)} construct(s), none of which can meet a NULL")
    unsafe.sort(key=lambda item: NULL_RANK.index(item[0]), reverse=True)
    return Verdict(OPEN, "; ".join(f"{kind}: {what}" for kind, what in unsafe[:3]))


# ---------------------------------------------------------------------------- bounds


# Tables whose size is fixed by the repository rather than by use: copy_resources_to_database truncates and
# refills them from files under resources/ (couchers/resources.py:155).
STATIC_TABLES = {"regions", "languages", "timezone_areas"}

# How many rows a read can hand back, best first.
NO_ROWS = "no rows"  # a filter that can never hold, which is what SQLAlchemy renders `column.in_([])` as
ONE_ROW = "one row"  # an aggregate over the whole result, or a single relation pinned to a key
LIMITED = "limited"  # a LIMIT, so the count is whatever the code or the caller asked for
PINNED_LIST = "pinned to a list"  # keyed to identifiers the statement was handed, so bounded by that list
STATIC = "static table"  # every relation it reads is fixed by the repository
SCOPED = "scoped"  # tied to one identified entity, and grows with that entity's own data
UNSCOPED = "unscoped"  # nothing ties it to anything: it grows with the database
BOUNDS_RANK = [NO_ROWS, ONE_ROW, LIMITED, PINNED_LIST, STATIC, SCOPED, UNSCOPED]
# SCOPED counts as bounded: the read grows with one entity the caller named, not with the database. It does not
# promise that entity is small, and this dimension has nothing to say about how many messages one conversation
# can hold.
BOUNDS_SAFE = {NO_ROWS, ONE_ROW, LIMITED, PINNED_LIST, STATIC, SCOPED}


def constantly_false(node: exp.Expression) -> bool:
    """Whether a top level conjunct can never hold. SQLAlchemy renders `column.in_([])` as a false constant, so
    the statement is sent, reads nothing and returns nothing."""
    for term, where in level_filters(node):
        if where is not None:
            continue
        while isinstance(term, exp.Paren):
            term = term.this
        if isinstance(term, exp.Boolean) and not term.this:
            return True
        if isinstance(term, exp.NEQ) and _bound_value(term.left) and term.left.sql() == term.right.sql():
            return True
    return False


class Anchor(NamedTuple):
    """A restriction of a read to rows the statement identified, rather than to rows that share a property."""

    table: str
    column: str
    single: bool  # the predicate allows exactly one value of the column
    key: bool  # one value of the column names at most one row, rather than however many belong to it


def identified(column: exp.Column, relations: dict[str, str], schema: Schema) -> tuple[str, str, bool] | None:
    """The (table, column, is a key) this reference names, if it identifies rows at all.

    Only a key or a foreign key does. `messages.conversation_id = ?` names one conversation and bounds the read by
    that conversation's size; `users.hosting_status = ?` names a property, and the rows that have it grow with the
    database.
    """
    tables = set(relations.values())
    table = relations.get(column.table) or (next(iter(tables)) if not column.table and len(tables) == 1 else None)
    if table is None:
        return None
    if schema.is_key(table, column.name):
        return (table, column.name, True)
    if (table, column.name) in schema.foreign_keys:
        return (table, column.name, False)
    # One column of a composite key names rows only together with the rest of that key, which result_bound
    # checks for; on its own it still says the read is after particular rows rather than after a property.
    if any(column.name in key for key in schema.key_columns(table) if len(key) > 1):
        return (table, column.name, False)
    return None


def anchoring(term: exp.Expression, relations: dict[str, str], schema: Schema) -> list[Anchor]:
    """How this predicate restricts the read to identified rows, empty when it does not restrict it to any."""
    if isinstance(term, exp.Paren):
        return anchoring(term.this, relations, schema)
    if isinstance(term, exp.EQ):
        for side, other in ((term.left, term.right), (term.right, term.left)):
            if isinstance(side, exp.Column) and _bound_value(other):
                named = identified(side, relations, schema)
                return [Anchor(named[0], named[1], True, named[2])] if named else []
    if isinstance(term, exp.In) and isinstance(term.this, exp.Column):
        values = term.args.get("expressions") or []
        named = identified(term.this, relations, schema)
        if values and named and all(_bound_value(value) for value in values):
            return [Anchor(named[0], named[1], False, named[2])]
    if isinstance(term, exp.And):
        return [anchor for side in (term.left, term.right) for anchor in anchoring(side, relations, schema)]
    if isinstance(term, exp.Or):
        # `username = ? OR email = ?` names rows in each arm, so the arms together still name a fixed number of
        # them. Only if every arm does, though: one arm that names nothing lets the whole table through.
        arms = [anchoring(arm, relations, schema) for arm in disjuncts(term)]
        if all(arms):
            return [anchor._replace(single=False) for arm in arms for anchor in arm]
    return []


def anchors(node: exp.Expression, schema: Schema) -> list[Anchor]:
    """Every top level restriction of this level to identified rows."""
    relations = dict(level_relations(node))
    return [
        anchor for term, where in level_filters(node) if where is None for anchor in anchoring(term, relations, schema)
    ]


def result_bound(node: exp.Expression, schema: Schema) -> tuple[str, str]:
    """How many rows this read can hand back, and what decides it."""
    if node.args.get("limit") is not None:
        return LIMITED, "LIMIT"
    if isinstance(node, exp.SetOperation):
        branches = [result_bound(node.this, schema), result_bound(node.expression, schema)]
        return max(branches, key=lambda branch: BOUNDS_RANK.index(branch[0]))
    if isinstance(node, exp.Subquery):
        return result_bound(node.this, schema)
    if not isinstance(node, exp.Select):
        return UNSCOPED, "not a select"
    if constantly_false(node):
        return NO_ROWS, "a filter that can never hold"

    # An aggregate wrapped in something else still aggregates: `coalesce(sum(amount), 0)` and
    # `concat(?, string_agg(geojson, ?), ?)` each collapse the whole result to one row. An aggregate inside a
    # scalar subquery does not, so nested levels are not looked into.
    projections = [p.this if isinstance(p, exp.Alias) else p for p in node.selects]
    aggregated = [isinstance(p, exp.AggFunc) or any(own_nodes(p, exp.AggFunc)) for p in projections]
    if projections and not node.args.get("group") and all(aggregated):
        return ONE_ROW, "aggregate over the whole result"

    relations = dict(level_relations(node))
    if relations and set(relations.values()) <= STATIC_TABLES:
        return STATIC, ", ".join(sorted(set(relations.values())))

    found = anchors(node, schema)
    # Naming one row of one relation only bounds the result when there is nothing to fan out into: a user joined
    # to their messages is one user and as many messages as they have sent.
    if len(set(relations.values())) == 1 and found:
        table = next(iter(relations.values()))
        pinned = {anchor.column for anchor in found if anchor.single}
        if any(set(key) <= pinned for key in schema.key_columns(table)):
            return ONE_ROW, f"{table} named by key"
        keyed = [anchor for anchor in found if anchor.key]
        if keyed:
            return PINNED_LIST, f"{table}.{keyed[0].column}"
    if found:
        return SCOPED, ", ".join(sorted({f"{anchor.table}.{anchor.column}" for anchor in found}))
    if not relations:
        return ONE_ROW, "reads no relation"
    return UNSCOPED, ", ".join(sorted(set(relations.values())))


@check("bounds")
def check_bounds(shape: Shape, schema: Schema) -> Verdict:
    """How many rows can this read hand back, and is that number bounded by anything but the size of the database?

    A statement that works on a test database with ten users and falls over on the real one does so silently until
    it does not. The question is whether the row count is decided by a LIMIT, by an aggregate, by identifiers the
    caller supplied, or by nothing at all.

    Only the rows the statement returns are judged, so only the top level. A nested query's cardinality is a cost,
    not a result, and how it ties itself to the query around it is the nesting dimension's business.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    if not isinstance(shape.ast, (exp.Select, exp.SetOperation)):
        # An INSERT, UPDATE or DELETE returns rows only through RETURNING, and how many it touches is the writes
        # dimension's question.
        return Verdict(CLEAR, "not a read")
    kind, why = result_bound(shape.ast, schema)
    if kind in BOUNDS_SAFE:
        return Verdict(CLEAR, f"{kind}: {why}")
    return Verdict(OPEN, f"{kind}: {why}")


@check("writes")
def check_writes(shape: Shape, schema: Schema) -> Verdict:
    """How many rows can this statement mutate?

    An UPDATE or DELETE anchored on a primary or unique key touches at most the one row it names. Anything else is
    a bulk mutation whose blast radius is decided by its predicate, which is worth reading even when it is right.
    """
    if shape.ast is None:
        return Verdict(OPEN, f"not parsed: {shape.parse_error}")
    # A data modifying CTE mutates rows the outer statement never names, so the outer form says nothing about it.
    if any(node is not shape.ast for node in shape.ast.find_all(exp.Update, exp.Delete, exp.Insert)):
        return Verdict(OPEN, "data modifying CTE")
    if not isinstance(shape.ast, (exp.Update, exp.Delete)):
        if isinstance(shape.ast, exp.Insert):
            conflict = shape.ast.args.get("conflict")
            if conflict is not None and conflict.args.get("expressions"):
                return Verdict(OPEN, "upsert: ON CONFLICT DO UPDATE")
            if is_literal_row_source(shape.ast.expression):
                return Verdict(CLEAR, "insert of literal rows")
            return Verdict(OPEN, "insert from a query")
        return Verdict(CLEAR, "not a write")
    tables = statement_tables(shape.ast)
    target = shape.ast.find(exp.Table)
    if target is None:
        return Verdict(OPEN, "no target table found")
    if len(tables) > 1 or has_subquery(shape.ast):
        return Verdict(OPEN, "write whose target rows are chosen by a join or nested query")
    key = key_anchored(shape.ast, target.name, schema)
    if key is None:
        return Verdict(OPEN, f"unkeyed write to {target.name}")
    return Verdict(CLEAR, f"keyed on {target.name}({', '.join(key)})")


# ---------------------------------------------------------------------------- reporting


def fetch(location: str) -> bytes:
    if location.startswith(("http://", "https://")):
        with urllib.request.urlopen(location) as response:
            return response.read()  # type: ignore[no-any-return]
    return Path(location).read_bytes()


def load_data(location: str) -> dict[str, Any]:
    raw = fetch(location)
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return json.loads(raw)  # type: ignore[no-any-return]


LEDGER = Path(__file__).with_name("query_audit_reviewed.json")


def apply_ledger(verdicts: dict[str, dict[str, Verdict]], ledger: dict[str, Any]) -> None:
    """Fold the recorded human reviews into the verdicts, so only what nobody has read yet stays open."""
    for state, shapes in ((REVIEWED, ledger.get("reviewed", {})), (BUG, ledger.get("bugs", {}))):
        for shape_id, entries in shapes.items():
            for entry in entries:
                verdict = verdicts.get(shape_id, {}).get(entry["dimension"])
                # Only an open verdict is claimed: if a check has since learned to clear the shape by itself, or
                # the shape now fails for a different reason, the entry is stale and should not paper over it.
                if verdict is not None and verdict.state == OPEN:
                    verdict.state = state
                    verdict.reason = f"{verdict.reason} - {entry['note']}"


def summarise(shapes: dict[str, Shape], verdicts: dict[str, dict[str, Verdict]]) -> None:
    print(f"{len(shapes)} query shapes, {sum(s.executions for s in shapes.values())} executions\n")
    print(f"{'dimension':<12} {'clear':>7} {'reviewed':>9} {'bug':>5} {'open':>7}")
    for dimension in CHECKS:
        states = Counter(verdicts[shape_id][dimension].state for shape_id in shapes)
        print(f"{dimension:<12} {states[CLEAR]:>7} {states[REVIEWED]:>9} {states[BUG]:>5} {states[OPEN]:>7}")
    settled = [
        shape_id
        for shape_id in shapes
        if all(verdict.state in (CLEAR, REVIEWED) for verdict in verdicts[shape_id].values())
    ]
    bugs = [shape_id for shape_id in shapes if any(v.state == BUG for v in verdicts[shape_id].values())]
    print(f"\nsettled: {len(settled)}   open: {len(shapes) - len(settled) - len(bugs)}   known bugs: {len(bugs)}")
    for shape_id in bugs:
        for dimension, verdict in verdicts[shape_id].items():
            if verdict.state == BUG:
                print(f"  {shape_id} [{dimension}] {verdict.reason}")


def open_reasons(shapes: dict[str, Shape], verdicts: dict[str, dict[str, Verdict]], dimension: str) -> None:
    reasons: Counter[str] = Counter()
    for shape_id in shapes:
        verdict = verdicts[shape_id][dimension]
        if verdict.state == OPEN:
            # Group by the kind of reason, not the specific tables named in it.
            reasons[re.sub(r":.*", "", verdict.reason)] += 1
    print(f"\nopen on {dimension}:")
    for reason, count in reasons.most_common():
        print(f"  {count:>5}  {reason}")


def listing(shapes: dict[str, Shape], verdicts: dict[str, dict[str, Verdict]], dimension: str, limit: int) -> None:
    print(f"\nshapes open on {dimension}:")
    for shape_id, shape in shapes.items():
        verdict = verdicts[shape_id][dimension]
        if verdict.state != OPEN:
            continue
        site = shape.app_sites[0] if shape.app_sites else (shape.sites[0] if shape.sites else "?")
        print(f"\n  {shape_id}  {verdict.reason}")
        print(f"    {site.split(' <- ')[0]}   [{', '.join(shape.spans[:2])}]")
        print(f"    {shape.sql[:limit]}")


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", required=True, help="path or URL of the merged query log (data.json.gz)")
    parser.add_argument("--schema", required=True, help="path or URL of the schema dump (schema.sql)")
    parser.add_argument("--reasons", action="store_true", help="break the open shapes down by reason")
    parser.add_argument("--list", metavar="DIMENSION", help="print every shape still open on one dimension")
    parser.add_argument("--sql-chars", type=int, default=400, help="how much of each statement --list prints")
    parser.add_argument("--json", metavar="FILE", help="write the full per shape verdicts here")
    parser.add_argument("--ledger", default=str(LEDGER), help="recorded human reviews, keyed by shape id")
    parser.add_argument(
        "--no-ledger", action="store_true", help="ignore the recorded reviews and show every open shape"
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    schema = parse_schema(fetch(args.schema).decode())
    shapes = load_shapes(load_data(args.data))
    verdicts = {
        shape_id: {dimension: function(shape, schema) for dimension, function in CHECKS.items()}
        for shape_id, shape in shapes.items()
    }

    if not args.no_ledger and Path(args.ledger).exists():
        apply_ledger(verdicts, json.loads(Path(args.ledger).read_text()))

    summarise(shapes, verdicts)
    if args.reasons:
        for dimension in CHECKS:
            open_reasons(shapes, verdicts, dimension)
    if args.list:
        if args.list not in CHECKS:
            parser.error(f"unknown dimension {args.list!r}, expected one of {', '.join(CHECKS)}")
        listing(shapes, verdicts, args.list, args.sql_chars)
    if args.json:
        Path(args.json).write_text(
            json.dumps(
                {
                    shape_id: {
                        "sql": shape.sql,
                        "executions": shape.executions,
                        "sites": shape.sites[:5],
                        "spans": shape.spans[:5],
                        "verdicts": {d: vars(v) for d, v in verdicts[shape_id].items()},
                    }
                    for shape_id, shape in shapes.items()
                },
                indent=1,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
