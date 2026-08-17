"""
Guards the diversity of the user fixtures themselves: a population that shares a birthdate, a gender and a location
hides bugs that mistake those values for an identity, and makes distance errors untestable.
"""

from datetime import date

from tests.fixtures.db import make_user


def test_users_differ_from_each_other():
    users = [make_user(username=f"diverse_user_{i}") for i in range(8)]

    assert len({user.birthdate for user in users}) == len(users)
    assert len({user.coordinates for user in users}) == len(users)
    assert len({user.gender for user in users}) > 1


def test_users_are_adults_in_new_york():
    for i in range(8):
        user = make_user(username=f"diverse_user_{i}")
        assert date(1950, 1, 1) <= user.birthdate <= date(2005, 1, 1)
        lat, lng = user.coordinates
        assert 40.2 < lat < 41.3 and -74.5 < lng < -73.4


def test_a_shared_fixture_seed_collides_users():
    user1 = make_user(fixture_seed="shared")
    user2 = make_user(fixture_seed="shared")

    assert (user1.birthdate, user1.gender, user1.coordinates) == (user2.birthdate, user2.gender, user2.coordinates)
    assert user1.username != user2.username


def test_explicit_values_win_over_derived_ones():
    user = make_user(birthdate=date(1988, 1, 1), gender="Man")

    assert user.birthdate == date(1988, 1, 1)
    assert user.gender == "Man"
