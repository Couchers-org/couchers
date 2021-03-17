from couchers.db import (
    get_parent_node_at_location,
    is_valid_email,
    is_valid_name,
    is_valid_user_id,
    is_valid_username,
    parse_date,
    session_scope,
)
from tests.test_communities import create_1d_point, get_community_id, testing_communities
from tests.test_fixtures import testconfig


def test_is_valid_user_id():
    assert is_valid_user_id("10")
    assert not is_valid_user_id("1a")
    assert not is_valid_user_id("01")


def test_is_valid_email():
    assert is_valid_email("a@b.cc")
    assert is_valid_email("te.st+email.valid@a.org.au.xx.yy")
    assert not is_valid_email("test email@couchers.org")
    assert not is_valid_email(".testemail@couchers.org")
    assert not is_valid_email("testemail@couchersorg")


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
        w_id = get_community_id(session, "World")  # 0 to 100
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
