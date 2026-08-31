"""
Finds tables in a query that are tied to the rest of the query by a value rather than by a key.

The lite_users strong verification bug was a select over the attempts table and the users table whose only connection
was `passport_date_of_birth = users.birthdate`. Every user sharing a birthdate with a verified user got the badge.

SQLAlchemy's own FROM-linter cannot catch this for two independent reasons: the predicate does syntactically connect
the two tables, so it sees no cartesian product, and a materialized view's select is compiled into DDL and never
executed as a statement, so the lint path is never reached at all. This checks the stronger property the linter can't
express: two tables count as connected only when an equality relates a foreign key to what it references, two foreign
keys to the same target, or a column to itself through a subquery. A birthdate is not an identity.
"""

import itertools
import warnings
from typing import Any

from sqlalchemy import Column, Table
from sqlalchemy.sql import operators
from sqlalchemy.sql.elements import (
    BinaryExpression,
    BooleanClauseList,
    ColumnClause,
    ColumnElement,
    _anonymous_label,
)
from sqlalchemy.sql.selectable import CompoundSelect, FromClause, Join, Select
from sqlalchemy.sql.util import find_tables


def _conjuncts(clause: ColumnElement[Any] | None) -> list[ColumnElement[Any]]:
    """Splits a clause into the conditions that must all hold. Anything under an OR binds nothing, so it isn't split."""
    if clause is None:
        return []
    if isinstance(clause, BooleanClauseList) and clause.operator is operators.and_:
        return [conjunct for sub in clause.clauses for conjunct in _conjuncts(sub)]
    return [clause]


def _origins(expr: Any) -> set[Column[Any]]:
    """The real table columns an expression stands for, seeing through subqueries: sub.c.id -> users.id"""
    if not isinstance(expr, ColumnClause):
        return set()
    return {col for col in expr.proxy_set if isinstance(col, Column) and isinstance(col.table, Table)}


def _fk_targets(col: Column[Any]) -> set[Column[Any]]:
    return {fk.column for fk in col.foreign_keys}


def _is_key_link(left: Any, right: Any) -> bool:
    left_origins, right_origins = _origins(left), _origins(right)
    # the same column reached through a subquery: an identity, not a coincidence
    if left_origins & right_origins:
        return True
    for a, b in itertools.product(left_origins, right_origins):
        if b in _fk_targets(a) or a in _fk_targets(b):
            return True
        # both sides point at the same row of a third table, e.g. two tables' user_id
        if _fk_targets(a) & _fk_targets(b):
            return True
    return False


def _leaves(from_clause: FromClause) -> list[FromClause]:
    if isinstance(from_clause, Join):
        return _leaves(from_clause.left) + _leaves(from_clause.right)
    return [from_clause]


def _join_conditions(from_clause: FromClause) -> list[ColumnElement[Any]]:
    if isinstance(from_clause, Join):
        return [
            *_conjuncts(from_clause.onclause),
            *_join_conditions(from_clause.left),
            *_join_conditions(from_clause.right),
        ]
    return []


def _key(from_clause: FromClause) -> str:
    """
    Identifies a FROM element by its name, which SQL requires to be unique within one FROM list.

    Not by object identity: the ORM annotates its own copy of a table, so the entry in the FROM list and the table a
    condition's column hangs off are equal but distinct objects.
    """
    name = getattr(from_clause, "name", None)
    return str(name) if name is not None else str(id(from_clause))


def _describe(from_clause: FromClause) -> str:
    """Names a FROM element for the error message, falling back to what an unnamed subquery selects from."""
    name = getattr(from_clause, "name", None)
    if name is not None and not isinstance(name, _anonymous_label):
        return str(name)
    inner = getattr(from_clause, "element", None)
    tables = sorted({table.name for table in find_tables(inner)}) if inner is not None else []
    return f"unnamed subquery over {', '.join(tables)}" if tables else "unnamed subquery"


class _Components:
    """Union-find over the FROM elements, to check they end up in one connected component."""

    def __init__(self, keys: list[str]) -> None:
        self._parent = {key: key for key in keys}

    def find(self, key: str) -> str:
        while self._parent[key] != key:
            self._parent[key] = self._parent[self._parent[key]]
            key = self._parent[key]
        return key

    def union(self, left: str, right: str) -> None:
        self._parent[self.find(left)] = self.find(right)

    def count(self) -> int:
        return len({self.find(key) for key in self._parent})


def find_unkeyed_joins(statement: Select[Any] | CompoundSelect[Any], path: str = "query") -> list[str]:
    """
    Returns a problem description for every table not connected to the rest of its query by a key.

    Recurses into subqueries, CTEs and the arms of a union, each of which is checked in its own right.
    """
    if isinstance(statement, CompoundSelect):
        return [
            problem
            for index, arm in enumerate(statement.selects)
            if isinstance(arm, (Select, CompoundSelect))
            for problem in find_unkeyed_joins(arm, f"{path}/union[{index}]")
        ]

    with warnings.catch_warnings():
        # resolving the FROM list builds a compiler for the default dialect, which warns that DISTINCT ON is
        # PostgreSQL-only. We only ever run on PostgreSQL, and this reads structure rather than emitting any SQL.
        warnings.filterwarnings("ignore", "DISTINCT ON is currently supported only by the PostgreSQL dialect")
        froms = statement.get_final_froms()
    leaves = [leaf for from_clause in froms for leaf in _leaves(from_clause)]
    conditions = [
        *(condition for from_clause in froms for condition in _join_conditions(from_clause)),
        *_conjuncts(statement.whereclause),
    ]

    by_key = {_key(leaf): leaf for leaf in leaves}
    components = _Components(list(by_key))
    unkeyed: list[BinaryExpression[Any]] = []
    for condition in conditions:
        if not isinstance(condition, BinaryExpression) or condition.operator is not operators.eq:
            continue
        sides = [getattr(getattr(condition, side), "table", None) for side in ("left", "right")]
        if any(side is None for side in sides):
            continue
        left, right = (_key(side) for side in sides)  # type: ignore[arg-type]
        if left not in by_key or right not in by_key or left == right:
            continue
        if _is_key_link(condition.left, condition.right):
            components.union(left, right)
        else:
            unkeyed.append(condition)

    problems = []
    if components.count() > 1:
        # the unkeyed equalities are what the author probably mistook for a join
        mistaken = "".join(f"\n    only linked by: {condition}" for condition in unkeyed)
        problems.append(
            f"{path}: {', '.join(sorted(_describe(leaf) for leaf in leaves))} are not all connected by keys, so rows "
            f"are paired across every combination{mistaken}"
        )

    for leaf in leaves:
        element = getattr(leaf, "element", None)
        if isinstance(element, (Select, CompoundSelect)):
            problems += find_unkeyed_joins(element, f"{path}/{_describe(leaf)}")
    return problems
