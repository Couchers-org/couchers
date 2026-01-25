import subprocess
from collections.abc import Sequence
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Any, cast

from sqlalchemy import Connection, Engine, create_engine, or_, select, text, update
from sqlalchemy.orm import Session

from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.context import CouchersContext
from couchers.crypto import random_hex
from couchers.db import _get_base_engine, session_scope
from couchers.helpers.completed_profile import has_completed_profile
from couchers.models import (
    Base,
    FriendRelationship,
    FriendStatus,
    HostingStatus,
    LanguageAbility,
    LanguageFluency,
    ModerationUserList,
    PassportSex,
    PhotoGallery,
    PhotoGalleryItem,
    RegionLived,
    RegionVisited,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    Upload,
    User,
    UserBlock,
    UserSession,
    Volunteer,
)
from couchers.servicers.auth import create_session
from couchers.utils import create_coordinate, now
from tests.fixtures.sessions import _MockCouchersContext


def create_schema_from_models(engine: Engine | None = None) -> None:
    """
    Create everything from the current models, not incrementally
    through migrations.
    """
    if engine is None:
        engine = _get_base_engine()

    # create sql functions (these are created in migrations otherwise)
    functions = Path(__file__).parent / "sql_functions.sql"
    with open(functions) as f, engine.connect() as conn:
        conn.execute(text(f.read()))
        conn.commit()

    Base.metadata.create_all(engine)


def populate_testing_resources(conn: Connection) -> None:
    """
    Testing version of couchers.resources.copy_resources_to_database
    """
    conn.execute(
        text("""
        INSERT INTO regions (code, name) VALUES
        ('AUS', 'Australia'),
        ('CAN', 'Canada'),
        ('CHE', 'Switzerland'),
        ('CUB', 'Cuba'),
        ('CXR', 'Christmas Island'),
        ('CZE', 'Czechia'),
        ('DEU', 'Germany'),
        ('EGY', 'Egypt'),
        ('ESP', 'Spain'),
        ('EST', 'Estonia'),
        ('FIN', 'Finland'),
        ('FRA', 'France'),
        ('GBR', 'United Kingdom'),
        ('GEO', 'Georgia'),
        ('GHA', 'Ghana'),
        ('GRC', 'Greece'),
        ('HKG', 'Hong Kong'),
        ('IRL', 'Ireland'),
        ('ISR', 'Israel'),
        ('ITA', 'Italy'),
        ('JPN', 'Japan'),
        ('LAO', 'Laos'),
        ('MEX', 'Mexico'),
        ('MMR', 'Myanmar'),
        ('NAM', 'Namibia'),
        ('NLD', 'Netherlands'),
        ('NZL', 'New Zealand'),
        ('POL', 'Poland'),
        ('PRK', 'North Korea'),
        ('REU', 'Réunion'),
        ('SGP', 'Singapore'),
        ('SWE', 'Sweden'),
        ('THA', 'Thailand'),
        ('TUR', 'Turkey'),
        ('TWN', 'Taiwan'),
        ('USA', 'United States'),
        ('VNM', 'Vietnam');
    """)
    )

    # Insert languages as textual SQL
    conn.execute(
        text("""
        INSERT INTO languages (code, name) VALUES
        ('arb', 'Arabic (Standard)'),
        ('deu', 'German'),
        ('eng', 'English'),
        ('fin', 'Finnish'),
        ('fra', 'French'),
        ('heb', 'Hebrew'),
        ('hun', 'Hungarian'),
        ('jpn', 'Japanese'),
        ('pol', 'Polish'),
        ('swe', 'Swedish'),
        ('cmn', 'Chinese (Mandarin)')
    """)
    )

    with open(Path(__file__).parent.parent.parent.parent / "resources" / "timezone_areas.sql-fake", "r") as f:
        tz_sql = f.read()

    conn.execute(text(tz_sql))


def drop_database() -> None:
    with session_scope() as session:
        # postgis is required for all the Geographic Information System (GIS) stuff
        # pg_trgm is required for trigram-based search
        # btree_gist is required for gist-based exclusion constraints
        session.execute(
            text(
                "DROP SCHEMA IF EXISTS public CASCADE;"
                "DROP SCHEMA IF EXISTS logging CASCADE;"
                "DROP EXTENSION IF EXISTS postgis CASCADE;"
                "CREATE SCHEMA IF NOT EXISTS public;"
                "CREATE SCHEMA IF NOT EXISTS logging;"
                "CREATE EXTENSION postgis;"
                "CREATE EXTENSION pg_trgm;"
                "CREATE EXTENSION btree_gist;"
            )
        )


@contextmanager
def autocommit_engine(url: str):
    """
    An engine that executes every statement in a transaction. Mainly needed
    because CREATE/DROP DATABASE cannot be executed any other way.
    """
    engine = create_engine(
        url,
        isolation_level="AUTOCOMMIT",
    )
    yield engine
    engine.dispose()


def make_user(**kwargs: Any) -> User:
    username = "test_user_" + random_hex(16)

    user = User(
        username=username,
        email=f"{username}@dev.couchers.org",
        hashed_password=b"$argon2id$v=19$m=65536,t=2,p=1$4cjGg1bRaZ10k+7XbIDmFg$tZG7JaLrkfyfO7cS233ocq7P8rf3znXR7SAfUt34kJg",
        name=username.capitalize(),
        hosting_status=HostingStatus.cant_host,
        city="Testing city",
        hometown="Test hometown",
        community_standing=0.5,
        birthdate=date(year=2000, month=1, day=1),
        gender="Woman",
        pronouns="",
        occupation="Tester",
        education="UST(esting)",
        about_me="I test things",
        things_i_like="Code",
        about_place="My place has a lot of testing paraphenelia",
        additional_information="I can be a bit testy",
        accepted_tos=TOS_VERSION,
        geom=create_coordinate(40.7108, -73.9740),
        geom_radius=100,
        last_onboarding_email_sent=now(),
        last_donated=now(),
    )
    user.accepted_community_guidelines = GUIDELINES_VERSION
    user.onboarding_emails_sent = 1

    # Ensure superusers are also editors (DB constraint)
    if kwargs.get("is_superuser") and "is_editor" not in kwargs:
        kwargs["is_editor"] = True

    for key, value in kwargs.items():
        setattr(user, key, value)

    return user


def generate_user(
    *,
    delete_user=False,
    complete_profile=True,
    strong_verification=False,
    regions_visited: Sequence[str] = (),
    regions_lived: Sequence[str] = (),
    language_abilities: Sequence[tuple[str, LanguageFluency]] = (),
    **kwargs: Any,
) -> tuple[User, str]:
    """
    Create a new user, return session token

    The user is detached from any session, and you can access its static attributes, but you can't modify it

    Use this most of the time
    """
    with session_scope() as session:
        user = make_user(**kwargs)

        session.add(user)
        session.flush()

        # Create a profile gallery for the user and link it
        profile_gallery = PhotoGallery(owner_user_id=user.id)
        session.add(profile_gallery)
        session.flush()
        user.profile_gallery_id = profile_gallery.id

        for region in regions_visited:
            session.add(RegionVisited(user_id=user.id, region_code=region))

        for region in regions_lived:
            session.add(RegionLived(user_id=user.id, region_code=region))

        for lang, fluency in language_abilities:
            session.add(LanguageAbility(user_id=user.id, language_code=lang, fluency=fluency))

        # this expires the user, so now it's "dirty"
        context = cast(CouchersContext, _MockCouchersContext())
        token, _ = create_session(context, session, user, False, set_cookie=False)

        # deleted user aborts session creation, hence this follows and necessitates a second commit
        if delete_user:
            user.is_deleted = True

        user.recommendation_score = 1e10 - user.id

        if complete_profile:
            key = random_hex(32)
            session.add(
                Upload(
                    key=key,
                    filename=random_hex(32) + ".jpg",
                    creator_user_id=user.id,
                )
            )
            session.add(
                PhotoGalleryItem(
                    gallery_id=profile_gallery.id,
                    upload_key=key,
                    position=0,
                )
            )
            session.flush()

            user.about_me = "I have a complete profile!\n" * 20

        if strong_verification:
            attempt = StrongVerificationAttempt(
                verification_attempt_token=f"verification_attempt_token_{user.id}",
                user_id=user.id,
                status=StrongVerificationAttemptStatus.succeeded,
                has_full_data=True,
                passport_encrypted_data=b"not real",
                passport_date_of_birth=user.birthdate,
                passport_sex={"Woman": PassportSex.female, "Man": PassportSex.male}.get(
                    user.gender, PassportSex.unspecified
                ),
                has_minimal_data=True,
                passport_expiry_date=date.today() + timedelta(days=10),
                passport_nationality="UTO",
                passport_last_three_document_chars=f"{user.id:03}",
                iris_token=f"iris_token_{user.id}",
                iris_session_id=user.id,
            )
            session.add(attempt)
            session.flush()
            assert attempt.has_strong_verification(user)

        session.commit()

        assert has_completed_profile(session, user) == complete_profile

        # refresh it, undoes the expiry
        session.refresh(user)

        # this loads the user's timezone info which is lazy loaded, otherwise we'll get issues if we try to refer to it
        user.timezone  # noqa: B018

        # allows detaches the user from the session, allowing its use outside this session
        session.expunge(user)

    return user, token


def get_user_id_and_token(session: Session, username: str) -> tuple[int, str]:
    user_id = session.execute(select(User.id).where(User.username == username)).scalar_one()
    token = session.execute(select(UserSession.token).where(UserSession.user_id == user_id)).scalar_one()
    return user_id, token


def make_friends(user1: User, user2: User) -> None:
    with session_scope() as session:
        friend_relationship = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.accepted,
        )
        session.add(friend_relationship)


def make_user_block(user1: User, user2: User) -> None:
    with session_scope() as session:
        user_block = UserBlock(
            blocking_user_id=user1.id,
            blocked_user_id=user2.id,
        )
        session.add(user_block)


def make_user_invisible(user_id: int) -> None:
    with session_scope() as session:
        session.execute(update(User).where(User.id == user_id).values(is_banned=True))


# This doubles as get_FriendRequest, since a friend request is just a pending friend relationship
def get_friend_relationship(user1: User, user2: User) -> FriendRelationship | None:
    with session_scope() as session:
        friend_relationship = session.execute(
            select(FriendRelationship).where(
                or_(
                    (FriendRelationship.from_user_id == user1.id and FriendRelationship.to_user_id == user2.id),
                    (FriendRelationship.from_user_id == user2.id and FriendRelationship.to_user_id == user1.id),
                )
            )
        ).scalar_one_or_none()

        session.expunge(friend_relationship)
        return friend_relationship


def add_users_to_new_moderation_list(users: list[User]) -> int:
    """Group users as duplicated accounts"""
    with session_scope() as session:
        moderation_user_list = ModerationUserList()
        session.add(moderation_user_list)
        session.flush()
        for user in users:
            refreshed_user = session.get_one(User, user.id)
            moderation_user_list.users.append(refreshed_user)
        return moderation_user_list.id


def pg_dump_is_available() -> bool:
    result = subprocess.run(["which", "pg_dump"], stdout=subprocess.PIPE, encoding="ascii")
    return result.returncode == 0


def make_volunteer(started_volunteering: date, show_on_team_page: bool = True, **kwargs: Any) -> Volunteer:
    vol = Volunteer(show_on_team_page=show_on_team_page, **kwargs)
    vol.started_volunteering = started_volunteering

    return vol
