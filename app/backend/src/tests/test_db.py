from couchers.db import (is_valid_user_id, is_valid_email, is_valid_username,
                         is_valid_name)

def test_is_valid_user_id():
    assert is_valid_user_id("10")
    assert not is_valid_user_id("1a")
    assert not is_valid_user_id("01")

def test_is_valid_email():
    assert is_valid_email("a@b.cc");
    assert is_valid_email("te.st+email.valid@a.org.au.xx.yy");
    assert not is_valid_email("test email@couchers.org");
    assert not is_valid_email(".testemail@couchers.org");
    assert not is_valid_email("testemail@couchersorg");

def test_is_valid_username():
    assert is_valid_username("user")
    assert is_valid_username("us")
    assert is_valid_username("us_er")
    assert is_valid_username("us_er1")
    assert not is_valid_username("us_")
    assert not is_valid_username("u")
    assert not is_valid_username("1us")

def test_is_valid_name():
    assert is_valid_name("a")
    assert is_valid_name("a b")
    assert is_valid_name("1")
    assert is_valid_name("老子")
    assert not is_valid_name("	")
    assert not is_valid_name("")
    assert not is_valid_name(" ")
