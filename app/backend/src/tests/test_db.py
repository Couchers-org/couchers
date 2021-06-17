import difflib
import re
import subprocess

from couchers.config import config
from couchers.db import apply_migrations, get_parent_node_at_location, session_scope
from couchers.utils import (
    create_coordinate,
    get_coordinates,
    is_valid_email,
    is_valid_name,
    is_valid_user_id,
    is_valid_username,
    parse_date,
)
from tests.test_communities import create_1d_point, get_community_id, testing_communities  # noqa
from tests.test_fixtures import create_schema_from_models, drop_all, testconfig  # noqa


def test_is_valid_user_id():
    assert is_valid_user_id("10")
    assert not is_valid_user_id("1a")
    assert not is_valid_user_id("01")


def test_is_valid_email():
    assert is_valid_email("a@b.cc")
    assert is_valid_email("te.st+email.valid@a.org.au.xx.yy")
    assert is_valid_email("invalid@yahoo.co.uk")
    assert not is_valid_email("invalid@.yahoo.co.uk")
    assert not is_valid_email("test email@couchers.org")
    assert not is_valid_email(".testemail@couchers.org")
    assert not is_valid_email("testemail@couchersorg")
    assert not is_valid_email("b@xxb....blabla")


def test_is_valid_username():
    assert is_valid_username("user")
    assert is_valid_username("us")
    assert is_valid_username("us_er")
    assert is_valid_username("us_er1")
    assert not is_valid_username("us_")
    assert not is_valid_username("u")
    assert not is_valid_username("1us")
    assert not is_valid_username("User")


def test_is_valid_name():
    assert is_valid_name("a")
    assert is_valid_name("a b")
    assert is_valid_name("1")
    assert is_valid_name("老子")
    assert not is_valid_name("	")
    assert not is_valid_name("")
    assert not is_valid_name(" ")


def test_parse_date():
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

        assert get_parent_node_at_location(session, create_1d_point(1)).id == c1r1c1_id
        assert get_parent_node_at_location(session, create_1d_point(3)).id == c1r1c1_id
        assert get_parent_node_at_location(session, create_1d_point(6)).id == c1r1_id
        assert get_parent_node_at_location(session, create_1d_point(8)).id == c1r1c2_id
        assert get_parent_node_at_location(session, create_1d_point(15)).id == c1_id
        assert get_parent_node_at_location(session, create_1d_point(51)).id == w_id


def test_create_coordinate():
    test_coords = [
        ((-95, -185), (-85, 175)),
        ((95, -180), (85, 180)),  # Weird interaction in PostGIS where lng
        # flips at -180 only when there is latitude overflow
        ((90, -180), (90, -180)),
        ((20, 185), (20, -175)),
        ((0, 0), (0, 0)),
    ]

    with session_scope() as session:
        for coords, coords_expected in test_coords:
            coords_wrapped = get_coordinates(session.query(create_coordinate(*coords)).scalar())

            assert coords_wrapped == coords_expected


def pg_dump():
    return subprocess.run(
        ["pg_dump", "-s", config["DATABASE_CONNECTION_STRING"]], stdout=subprocess.PIPE, encoding="ascii", check=True
    ).stdout


def sort_pg_dump_output(output):
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


def test_sort_pg_dump_output():
    assert sort_pg_dump_output(" (\nb,\nc,\na\n);\n") == " (\na,\nb,\nc\n);\n"


def strip_leading_whitespace(lines):
    return [s.lstrip() for s in lines]


def test_migrations(testconfig):
    """Compares the database schema built up from migrations, with the
    schema built by models.py. Both scenarios are started from an
    empty database, and dumped with pg_dump. Any unexplainable
    differences in the output are reported in unified diff format and
    fails the test.
    """
    drop_all()
    # rebuild it with alembic migrations
    apply_migrations()

    with_migrations = pg_dump()

    drop_all()
    # create everything from the current models, not incrementally
    # through migrations
    create_schema_from_models()

    from_scratch = pg_dump()

    def message(s):
        s = sort_pg_dump_output(s)

        # filter out alembic tables
        s = "\n-- ".join(x for x in s.split("\n-- ") if not x.startswith("Name: alembic_"))

        return strip_leading_whitespace(s.splitlines())

    diff = "\n".join(
        difflib.unified_diff(message(with_migrations), message(from_scratch), fromfile="migrations", tofile="model")
    )
    print(diff)
    success = diff == ""
    assert success
