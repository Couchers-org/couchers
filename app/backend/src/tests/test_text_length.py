"""
Minimum lengths of user-entered texts are counted in three places: the frontend's live character counter, the python
helper in couchers.helpers.text_length, and the about_me_length generated column in postgres. They have to agree,
otherwise the frontend cheerfully accepts a profile that the backend then treats as incomplete, blocking the user from
sending host requests with no way to tell what's wrong.
"""

import pytest
from sqlalchemy import select, update

from couchers.constants import COMPLETED_PROFILE_MIN_LENGTH_UTF16
from couchers.db import session_scope
from couchers.helpers.completed_profile import has_completed_profile, has_completed_profile_expression
from couchers.helpers.text_length import trimmed_utf16_length
from couchers.models import User
from tests.fixtures.db import generate_user

# an emoji is one code point but two utf16 code units, so javascript counts it twice
EMOJI = chr(0x1F600)
NBSP = chr(0xA0)
IDEOGRAPHIC_SPACE = chr(0x3000)
BOM = chr(0xFEFF)
LINE_SEPARATOR = chr(0x2028)

# (text, the length javascript's text.trim().length reports for it)
LENGTH_CASES = [
    ("", 0),
    ("   ", 0),
    ("hello", 5),
    ("hello   ", 5),
    ("   hello", 5),
    ("\n\n\thello \r\n", 5),
    ("two  inner   spaces", 19),
    (NBSP + "hello" + IDEOGRAPHIC_SPACE, 5),
    (BOM + "hello" + BOM, 5),
    (LINE_SEPARATOR + "hello" + LINE_SEPARATOR, 5),
    (EMOJI, 2),
    ("ab" + EMOJI + "c ", 5),
    (EMOJI * 3 + "\n", 6),
    # a BMP character that isn't ascii is one code unit, same as in python
    ("caf" + chr(0xE9), 4),
]


@pytest.mark.parametrize("text, expected", LENGTH_CASES)
def test_trimmed_utf16_length(text, expected):
    assert trimmed_utf16_length(text) == expected


def test_trimmed_utf16_length_of_nothing():
    assert trimmed_utf16_length(None) == 0


def test_about_me_length_column_matches_python(db):
    """The generated column and the python helper are two implementations of the same count."""
    user, _ = generate_user()

    with session_scope() as session:
        for text, expected in LENGTH_CASES:
            session.execute(update(User).where(User.id == user.id).values(about_me=text))
            about_me_length = session.execute(select(User.about_me_length).where(User.id == user.id)).scalar_one()
            assert about_me_length == expected, f"postgres counted {text!r} as {about_me_length}, not {expected}"

        session.execute(update(User).where(User.id == user.id).values(about_me=None))
        assert session.execute(select(User.about_me_length).where(User.id == user.id)).scalar_one() == 0


def _is_profile_complete(user_id: int, about_me: str) -> bool:
    with session_scope() as session:
        session.execute(update(User).where(User.id == user_id).values(about_me=about_me))
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        in_python = has_completed_profile(session, user)
        in_sql = session.execute(select(has_completed_profile_expression()).where(User.id == user_id)).scalar_one()
        assert in_python == in_sql, "the python check and the SQL expression disagree"
        return in_python


def test_profile_completeness_ignores_surrounding_whitespace(db):
    user, _ = generate_user()

    assert _is_profile_complete(user.id, "a" * COMPLETED_PROFILE_MIN_LENGTH_UTF16)
    # padding a too-short profile with whitespace mustn't get it over the line, since the frontend doesn't count it
    assert not _is_profile_complete(user.id, "a" * (COMPLETED_PROFILE_MIN_LENGTH_UTF16 - 1) + " ")
    assert not _is_profile_complete(user.id, "\n " + "a" * (COMPLETED_PROFILE_MIN_LENGTH_UTF16 - 1))
    assert _is_profile_complete(user.id, "  " + "a" * COMPLETED_PROFILE_MIN_LENGTH_UTF16 + "\n\n")


def test_profile_completeness_counts_emoji_like_the_frontend(db):
    user, _ = generate_user()

    # half as many code points as the minimum, but exactly the minimum as far as the browser is concerned
    assert _is_profile_complete(user.id, EMOJI * (COMPLETED_PROFILE_MIN_LENGTH_UTF16 // 2))
    assert not _is_profile_complete(user.id, EMOJI * (COMPLETED_PROFILE_MIN_LENGTH_UTF16 // 2 - 1))
