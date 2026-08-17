"""
Mechanical checks that a query's tables are tied together by keys rather than by values.

This is the bug class behind the lite_users strong verification bug: identity carried by convention instead of by a
key. Nothing else we run can see it. mypy, ruff and the migrations-vs-models diff all check that two representations
agree, which a self-consistently wrong query does; SQLAlchemy's FROM-linter sees the birthdate predicate as a
connection and never runs against DDL anyway.
"""

import re
from annotationlib import Format, get_annotations
from typing import Any

import pytest
from sqlalchemy import CompoundSelect, Select, select
from sqlalchemy.ext.hybrid import hybrid_method
from sqlalchemy_utils.view import CreateView

import couchers.materialized_views  # noqa: F401 -- importing registers the views on the metadata
from couchers.models import Base, StrongVerificationAttempt, User
from tests.sql_linkage import find_unkeyed_joins

@pytest.fixture(autouse=True)
def _(testconfig):
    pass


_MAPPED_CLASSES = {mapper.class_.__name__: mapper.class_ for mapper in Base.registry.mappers}


def _materialized_views() -> list[tuple[str, Select[Any] | CompoundSelect[Any]]]:
    """
    Every materialized view registered on the metadata, which is exactly the set that gets created in the database.

    Read off the metadata rather than listed here, so a new view is covered without anyone remembering to add it.
    """
    return sorted(
        (listener.name, listener.selectable)
        for listener in Base.metadata.dispatch.after_create
        if isinstance(listener, CreateView)
    )


def _subject_predicates() -> list[tuple[str, Any, Any]]:
    """
    Every public hybrid method on a model that takes another model as its subject, as (label, predicate, subject).

    These are the expressions that have to bind their own subject: SQL has no control flow to carry the fact that the
    row and the subject belong together, so a predicate that doesn't say so leaves it to each call site to remember.
    The private helpers they compose are excluded, being documented as not binding.
    """
    found = []
    for model in _MAPPED_CLASSES.values():
        for name, attribute in vars(model).items():
            if name.startswith("_") or not isinstance(attribute, hybrid_method):
                continue
            # read as strings: models annotate each other under TYPE_CHECKING, so the names don't resolve at runtime
            annotations = get_annotations(attribute.func, format=Format.STRING)
            for parameter, annotation in annotations.items():
                if parameter == "return":
                    continue
                for subject_name in re.findall(r"\w+", annotation):
                    if subject := _MAPPED_CLASSES.get(subject_name):
                        found.append((f"{model.__name__}.{name}", getattr(model, name), subject))
                        break
    return found


_MATERIALIZED_VIEWS = _materialized_views()
_SUBJECT_PREDICATES = _subject_predicates()


def test_the_checks_below_cover_something():
    # a parametrised test over an empty list passes while protecting nothing, which is how we got here
    assert _MATERIALIZED_VIEWS
    assert _SUBJECT_PREDICATES


@pytest.mark.parametrize(("name", "selectable"), _MATERIALIZED_VIEWS, ids=[name for name, _ in _MATERIALIZED_VIEWS])
def test_materialized_view_tables_are_linked_by_keys(name, selectable):
    assert not (problems := find_unkeyed_joins(selectable, name)), "\n".join(problems)


@pytest.mark.parametrize(
    ("label", "predicate", "subject"), _SUBJECT_PREDICATES, ids=[label for label, _, _ in _SUBJECT_PREDICATES]
)
def test_subject_predicates_bind_their_subject(label, predicate, subject):
    """A predicate that binds its subject makes its own query correct, with no join for a caller to forget."""
    # no explicit join: the FROM is inferred from the columns, so the predicate is the only thing that can link them
    statement = select(subject.id).where(predicate(subject))

    assert not (problems := find_unkeyed_joins(statement, label)), "\n".join(problems)


def test_the_lite_users_bug_is_caught():
    """The shape of the pre-0183 strong verification subquery: two tables related only by a birthdate."""
    buggy = (
        select(User.id)
        .select_from(StrongVerificationAttempt)
        .where(StrongVerificationAttempt.passport_date_of_birth == User.birthdate)
    )

    problems = find_unkeyed_joins(buggy, "sv_subquery")

    assert len(problems) == 1
    assert "strong_verification_attempts" in problems[0]
    assert "users.birthdate" in problems[0]


def test_a_keyed_join_is_accepted():
    fine = (
        select(User.id)
        .select_from(StrongVerificationAttempt)
        .join(User, User.id == StrongVerificationAttempt.user_id)
        .where(StrongVerificationAttempt.passport_date_of_birth == User.birthdate)
    )

    assert find_unkeyed_joins(fine, "sv_subquery") == []


def test_a_link_under_an_or_does_not_count():
    """An equality that only holds down one branch of an OR binds nothing."""
    either = select(User.id).where(
        (StrongVerificationAttempt.user_id == User.id)
        | (StrongVerificationAttempt.passport_date_of_birth == User.birthdate)
    )

    assert len(find_unkeyed_joins(either, "either")) == 1
