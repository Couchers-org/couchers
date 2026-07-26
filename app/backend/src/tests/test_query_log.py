"""Tests for the SQL query recorder.

The fingerprint is the key the CI report groups and diffs on, so anything that makes it vary between runs turns the
whole report into noise. These pin the normalisations it relies on.
"""

from tests.fixtures import query_log


def test_fingerprint_replaces_bound_parameters():
    sql = "SELECT users.id FROM users WHERE users.id = %(id_1)s AND users.username = %(username_1)s"
    assert query_log._fingerprint(sql) == "SELECT users.id FROM users WHERE users.id = ? AND users.username = ?"


def test_fingerprint_collapses_expanded_in_lists():
    """An IN list's length tracks the test data, so two runs must not produce different shapes for one query."""
    two = query_log._fingerprint("SELECT 1 FROM users WHERE users.id IN (%(id_1)s, %(id_2)s)")
    five = query_log._fingerprint(
        "SELECT 1 FROM users WHERE users.id IN (%(id_1)s, %(id_2)s, %(id_3)s, %(id_4)s, %(id_5)s)"
    )
    assert two == five == "SELECT 1 FROM users WHERE users.id IN (?)"


def test_fingerprint_normalises_whitespace_and_strips_comments():
    sql = "SELECT 1\n  FROM users\n WHERE id = %(id_1)s /* traceparent='00-abc' */"
    assert query_log._fingerprint(sql) == "SELECT 1 FROM users WHERE id = ?"


def test_fingerprint_keeps_distinct_queries_distinct():
    a = query_log._fingerprint("SELECT users.id FROM users WHERE users.id = %(id_1)s")
    b = query_log._fingerprint("SELECT users.id FROM users WHERE users.username = %(username_1)s")
    assert a != b


def test_shape_id_is_content_addressed():
    """Ids must depend only on the fingerprint: the pytest-split nodes assign them independently."""
    sql = "SELECT 1 FROM users WHERE id = ?"
    assert query_log._shape_id(sql) == query_log._shape_id(sql)
    assert query_log._shape_id(sql) != query_log._shape_id("SELECT 2 FROM users WHERE id = ?")


def test_span_is_inert_when_recording_is_off(monkeypatch):
    """Ordinary runs go through the same span() calls, so being disabled must record nothing and raise nothing.

    Forced off rather than asserted off, so this holds whether or not the suite itself was given --query-log.
    """
    monkeypatch.setattr(query_log, "_enabled", False)
    before = {test: list(spans) for test, spans in query_log._tests.items()}
    with query_log.span("rpc", "/org.couchers.api.core.API/GetUser"):
        pass
    assert query_log._tests == before
