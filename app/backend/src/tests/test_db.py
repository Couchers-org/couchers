import difflib
import os
import re
import subprocess
from pathlib import Path
from typing import Any

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.sql import func

from couchers.config import config
from couchers.db import _get_base_engine, apply_migrations, get_parent_node_at_location, session_scope
from couchers.jobs.handlers import DatabaseInconsistencyError, check_database_consistency
from couchers.models import User
from couchers.utils import (
    is_valid_email,
    is_valid_name,
    is_valid_user_id,
    is_valid_username,
    parse_date,
)
from tests.fixtures.db import (
    create_schema_from_models,
    drop_database,
    generate_user,
    pg_dump_is_available,
    populate_testing_resources,
)
from tests.test_communities import create_1d_point, get_community_id, testing_communities  # noqa


def test_is_valid_user_id() -> None:
    assert is_valid_user_id("10")
    assert not is_valid_user_id("1a")
    assert not is_valid_user_id("01")


def test_is_valid_email() -> None:
    assert is_valid_email("a@b.cc")
    assert is_valid_email("te.st+email.valid@a.org.au.xx.yy")
    assert is_valid_email("invalid@yahoo.co.uk")
    assert is_valid_email("user+tag@example.com")
    assert is_valid_email("first.last@example.com")
    assert not is_valid_email("invalid@.yahoo.co.uk")
    assert not is_valid_email("test email@couchers.org")
    assert not is_valid_email(".testemail@couchers.org")
    assert not is_valid_email("testemail@couchersorg")
    assert not is_valid_email("b@xxb....blabla")
    # dot immediately before @ (the original bug)
    assert not is_valid_email("user.@example.com")
    # consecutive dots in local part
    assert not is_valid_email("user..name@example.com")


def test_is_valid_username() -> None:
    assert is_valid_username("user")
    assert is_valid_username("us")
    assert is_valid_username("us_er")
    assert is_valid_username("us_er1")
    assert not is_valid_username("us_")
    assert not is_valid_username("u")
    assert not is_valid_username("1us")
    assert not is_valid_username("User")


def test_is_valid_name() -> None:
    assert is_valid_name("a")
    assert is_valid_name("a b")
    assert is_valid_name("1")
    assert is_valid_name("老子")
    assert not is_valid_name("	")
    assert not is_valid_name("")
    assert not is_valid_name(" ")


def test_parse_date() -> None:
    assert parse_date("2020-01-01") is not None
    assert parse_date("1900-01-01") is not None
    assert parse_date("2099-01-01") is not None
    assert not parse_date("2019-02-29")
    assert not parse_date("2019-22-01")
    assert not parse_date("2020-1-01")
    assert not parse_date("20-01-01")
    assert not parse_date("01-01-2020")
    assert not parse_date("2020/01/01")


def test_get_parent_node_at_location(testing_communities):
    with session_scope() as session:
        w_id = get_community_id(session, "Global")  # 0 to 100
        c1_id = get_community_id(session, "Country 1")  # 0 to 50
        c1r1_id = get_community_id(session, "Country 1, Region 1")  # 0 to 10
        c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")  # 0 to 5
        c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")  # 7 to 10
        c1r2_id = get_community_id(session, "Country 1, Region 2")  # 20 to 25
        c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")  # 21 to 23
        c2_id = get_community_id(session, "Country 2")  # 52 to 100
        c2r1_id = get_community_id(session, "Country 2, Region 1")  # 52 to 71
        c2r1c1_id = get_community_id(session, "Country 2, Region 1, City 1")  # 53 to 70

        assert get_parent_node_at_location(session, create_1d_point(1)).id == c1r1c1_id  # type: ignore[union-attr]
        assert get_parent_node_at_location(session, create_1d_point(3)).id == c1r1c1_id  # type: ignore[union-attr]
        assert get_parent_node_at_location(session, create_1d_point(6)).id == c1r1_id  # type: ignore[union-attr]
        assert get_parent_node_at_location(session, create_1d_point(8)).id == c1r1c2_id  # type: ignore[union-attr]
        assert get_parent_node_at_location(session, create_1d_point(15)).id == c1_id  # type: ignore[union-attr]
        assert get_parent_node_at_location(session, create_1d_point(51)).id == w_id  # type: ignore[union-attr]


def pg_dump() -> str:
    return subprocess.run(
        ["pg_dump", "-s", config["DATABASE_CONNECTION_STRING"]], stdout=subprocess.PIPE, encoding="ascii", check=True
    ).stdout


def sort_pg_dump_output(output: str) -> str:
    """Sorts the tables, functions and indices dumped by pg_dump in
    alphabetic order. Also sorts all lists enclosed with parentheses
    in alphabetic order.
    """
    # Temporary replace newline with another character for easier
    # pattern matching.
    s = output.replace("\n", "§")

    # Parameter lists are enclosed with parentheses and every entry
    # ends with a comma last on the line.
    s = re.sub(r" \(§(.*?)§\);", lambda m: " (§" + ",§".join(sorted(m.group(1).split(",§"))) + "§);", s)

    # The header for all objects (tables, functions, indices, etc.)
    # seems to all start with two dashes and a space. We don't care
    # which kind of object it is here.
    s = "§-- ".join(sorted(s.split("§-- ")))

    # Switch our temporary newline replacement to real newline.
    return s.replace("§", "\n")


def test_sort_pg_dump_output() -> None:
    assert sort_pg_dump_output(" (\nb,\nc,\na\n);\n") == " (\na,\nb,\nc\n);\n"


def strip_leading_whitespace(lines: list[str]) -> list[str]:
    return [s.lstrip() for s in lines]


@pytest.fixture
def restore_db_after_migration_test(db):
    try:
        yield
    finally:
        # Dispose the engine's connection pool since we dropped/recreated PostGIS extension,
        # which invalidates cached operator OIDs in existing connections
        engine = _get_base_engine()
        engine.dispose()

        # Restore test resources since we destroyed the database
        # This is needed because setup_testdb is session-scoped and won't run again
        with engine.connect() as conn:
            populate_testing_resources(conn)
            conn.commit()


@pytest.mark.skipif(not pg_dump_is_available(), reason="Can't run migration tests without pg_dump")
def test_migrations(db, testconfig: dict[str, Any], restore_db_after_migration_test) -> None:
    """
    Compares the database schema built up from migrations with the
    schema built by models.py. Both scenarios are started from an
    empty database and dumped with pg_dump. Any unexplainable
    differences in the output are reported in unified diff format and
    fail the test.

    Note: this takes about 2 minutes in CI, because the real timezone_areas.sql file
    is used, and it's big. Locally, timezone_areas.sql-fake is used.
    """
    drop_database()
    # rebuild it with alembic migrations
    apply_migrations()

    with_migrations = pg_dump()

    drop_database()
    # create everything from the current models, not incrementally
    # through migrations
    create_schema_from_models()

    from_scratch = pg_dump()

    # Save the raw schemas to files for CI artifacts
    schema_output_dir = os.environ.get("TEST_SCHEMA_OUTPUT_DIR")
    if schema_output_dir:
        output_path = Path(schema_output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        (output_path / "schema_from_migrations.sql").write_text(with_migrations)
        (output_path / "schema_from_models.sql").write_text(from_scratch)

    def message(s: str) -> list[str]:
        s = sort_pg_dump_output(s)

        # filter out alembic tables
        s = "\n-- ".join(x for x in s.split("\n-- ") if not x.startswith("Name: alembic_"))

        # filter out \restrict and \unrestrict lines (Postgres 16+)
        s = "\n".join(
            line for line in s.splitlines() if not line.startswith("\\restrict") and not line.startswith("\\unrestrict")
        )

        return strip_leading_whitespace(s.splitlines())

    diff = "\n".join(
        difflib.unified_diff(message(with_migrations), message(from_scratch), fromfile="migrations", tofile="model")
    )
    print(diff)
    success = diff == ""
    assert success


def test_slugify(db):
    with session_scope() as session:
        assert session.execute(func.slugify("this is a test")).scalar_one() == "this-is-a-test"
        assert session.execute(func.slugify("this is ä test")).scalar_one() == "this-is-a-test"
        # nothing here gets converted to ascci by unaccent, so it should be empty
        assert session.execute(func.slugify("Создай группу своего города")).scalar_one() == "slug"
        assert session.execute(func.slugify("Detta är ett test!")).scalar_one() == "detta-ar-ett-test"
        assert session.execute(func.slugify("@#(*$&!@#")).scalar_one() == "slug"
        assert (
            session.execute(
                func.slugify("This has a lot ‒ at least relatively speaking ‒ of punctuation! :)")
            ).scalar_one()
            == "this-has-a-lot-at-least-relatively-speaking-of-punctuation"
        )
        assert (
            session.execute(func.slugify("Multiple - #@! - non-ascii chars")).scalar_one() == "multiple-non-ascii-chars"
        )
        assert session.execute(func.slugify("123")).scalar_one() == "123"
        assert (
            session.execute(
                func.slugify(
                    "A sentence that is over 64 chars long and where the last thing would be replaced by a dash"
                )
            ).scalar_one()
            == "a-sentence-that-is-over-64-chars-long-and-where-the-last-thing"
        )


def test_database_consistency_check(db, testconfig: dict[str, Any]) -> None:
    """The database consistency check should pass with valid user/gallery setup"""
    # Create a few users (which auto-creates their profile galleries)
    generate_user()
    generate_user()
    generate_user()

    # This should not raise any exceptions
    check_database_consistency(empty_pb2.Empty())

    # Now break consistency by removing a user's profile gallery
    with session_scope() as session:
        user = session.execute(select(User).where(User.deleted_at.is_(None)).limit(1)).scalar_one()
        user.profile_gallery_id = None

    # This should now raise an exception
    with pytest.raises(DatabaseInconsistencyError):
        check_database_consistency(empty_pb2.Empty())


def test_migration_ordinals() -> None:
    """
    Validates that all migration files use ordinal revision IDs and form a
    linear chain. Each migration NNNN must have:
      - revision = "NNNN"
      - down_revision = "NNNN-1" (or None for 0001)
      - filename starting with NNNN_
    """
    versions_dir = Path(__file__).parent / "../../couchers/migrations/versions"
    versions_dir = versions_dir.resolve()

    migration_files = sorted(f for f in versions_dir.glob("*.py") if re.match(r"^\d{4}_", f.name))
    assert len(migration_files) > 0, f"No migration files found in {versions_dir}"

    errors = []
    prev_ordinal = None

    for path in migration_files:
        filename_match = re.match(r"^(\d{4})_", path.name)
        assert filename_match, f"Migration filename does not start with ordinal: {path.name}"
        file_ordinal = filename_match.group(1)

        content = path.read_text()

        rev_match = re.search(r'^revision\s*=\s*"([^"]+)"', content, re.MULTILINE)
        down_match = re.search(r"^down_revision\s*=\s*(None|\"([^\"]+)\")", content, re.MULTILINE)

        if not rev_match:
            errors.append(f"{path.name}: missing 'revision' variable")
            continue
        if not down_match:
            errors.append(f"{path.name}: missing 'down_revision' variable")
            continue

        revision = rev_match.group(1)
        down_revision = down_match.group(2)  # None if down_revision = None

        if revision != file_ordinal:
            errors.append(f"{path.name}: revision = \"{revision}\" does not match filename ordinal \"{file_ordinal}\"")

        if file_ordinal == "0001":
            if down_revision is not None:
                errors.append(f"{path.name}: first migration must have down_revision = None, got \"{down_revision}\"")
        else:
            expected_down = f"{int(file_ordinal) - 1:04d}"
            if down_revision != expected_down:
                errors.append(
                    f"{path.name}: down_revision = \"{down_revision}\" but expected \"{expected_down}\""
                )

        # Check for gaps in the sequence
        expected_ordinal = f"{int(prev_ordinal) + 1:04d}" if prev_ordinal else "0001"
        if file_ordinal != expected_ordinal:
            errors.append(f"{path.name}: expected ordinal {expected_ordinal}, got {file_ordinal} (gap in sequence)")

        prev_ordinal = file_ordinal

    assert not errors, "Migration ordinal errors:\n" + "\n".join(f"  - {e}" for e in errors)
