"""
Hybrid properties are two implementations of one truth: a python body that runs on a loaded instance,
and a SQL expression that runs in the database. Nothing in the ORM checks that they agree, so they can
drift apart silently, which is how the lite_users strong verification bug survived for 21 months.

This module discovers every hybrid on every model, builds a deliberately diverse population for it,
and asserts that the python value equals the value postgres computes, for every row. A hybrid that
cannot run in python at all (its body is written in terms of `func.now()` and friends, so evaluating
it on an instance yields a SQL expression rather than a value) is listed in SQL_ONLY, and we assert
that it really is inert in python rather than quietly returning something wrong.

Adding a hybrid to a model without adding it here fails test_every_hybrid_is_covered.
"""

from collections.abc import Callable
from datetime import date, timedelta
from typing import Any

import pytest
from psycopg.types.range import TimestamptzRange
from sqlalchemy import inspect, select, update
from sqlalchemy.ext.hybrid import HybridExtensionType
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ClauseElement

from couchers.constants import GUIDELINES_VERSION, PHONE_VERIFICATION_LIFETIME, TOS_VERSION
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import (
    AccountDeletionToken,
    ActivenessProbe,
    ActivenessProbeStatus,
    BackgroundJob,
    BackgroundJobState,
    Base,
    ContributorForm,
    Conversation,
    Event,
    EventOccurrence,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    HostRequestStatus,
    InitiatedUpload,
    LoginToken,
    ModerationObjectType,
    ModNote,
    Node,
    NodeType,
    PassportSex,
    PasswordResetToken,
    PostalVerificationAttempt,
    PostalVerificationStatus,
    SignupFlow,
    SleepingArrangement,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    Thread,
    User,
    UserSession,
)
from couchers.moderation.utils import create_moderation
from couchers.utils import create_coordinate, create_polygon_lat_lng, now, to_multi
from tests.fixtures.db import generate_user, make_user_invisible

# Hybrids whose body only makes sense in SQL: evaluating them on an instance yields a SQLAlchemy
# expression, which blows up the moment anything treats it as a value. They have no python
# implementation to disagree with, so there is nothing to compare -- but see
# test_sql_only_hybrids_are_inert_in_python, which holds them to being loudly, not quietly, unusable.
SQL_ONLY = {
    "BackgroundJob.ready_for_retry": "compares next_attempt_after against func.now()",
    "GroupChatSubscription.is_muted": "compares muted_until against func.now()",
    "InitiatedUpload.is_valid": "compares created/expiry against func.now()",
    "UserSession.is_valid": "compares created/expiry/last_seen against func.now() and a SQL interval",
}


def _label(model: type[Base], name: str) -> str:
    return f"{model.__name__}.{name}"


def _hybrids(extension_type: HybridExtensionType) -> list[tuple[type[Base], str]]:
    # `@x.inplace.expression` binds one hybrid to two names, the public one and the private one holding
    # the SQL expression, so dedupe on the descriptor itself and keep the name people write in queries
    found: dict[tuple[type[Base], int], str] = {}
    for mapper in Base.registry.mappers:
        for name, descriptor in mapper.all_orm_descriptors.items():
            if descriptor.extension_type != extension_type:
                continue
            key = (mapper.class_, id(descriptor))
            if key not in found or found[key].startswith("_"):
                found[key] = name
    return sorted(((model, name) for (model, _), name in found.items()), key=lambda pair: _label(*pair))


HYBRID_PROPERTIES = _hybrids(HybridExtensionType.HYBRID_PROPERTY)
HYBRID_METHODS = _hybrids(HybridExtensionType.HYBRID_METHOD)

Population = Callable[[], None]
POPULATIONS: dict[type[Base], Population] = {}


def _populates(model: type[Base]) -> Callable[[Population], Population]:
    def decorator(population: Population) -> Population:
        POPULATIONS[model] = population
        return population

    return decorator


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


## Populations: one per model, each diverse enough that every hybrid on the model takes at least two
## different values across the rows (test_hybrid_agrees_with_sql asserts that).


@_populates(User)
def _populate_users() -> None:
    generate_user()
    generate_user(accepted_tos=TOS_VERSION - 1)
    generate_user(accepted_community_guidelines=GUIDELINES_VERSION - 1)
    generate_user(max_guests=3, sleeping_arrangement=SleepingArrangement.private)
    generate_user(max_guests=3, sleeping_arrangement=None)
    banned, _ = generate_user()
    make_user_invisible(banned.id)
    generate_user(delete_user=True)
    shadowed, _ = generate_user()
    relocating, _ = generate_user()
    noted, _ = generate_user()
    acknowledged, _ = generate_user()
    probed, _ = generate_user()
    responded, _ = generate_user()
    phone_verified, _ = generate_user()
    phone_stale, _ = generate_user()
    code_sent, _ = generate_user()
    moderator, _ = generate_user(is_superuser=True)

    with session_scope() as session:
        session.execute(update(User).where(User.id == shadowed.id).values(shadowed_at=now() - timedelta(days=1)))
        session.execute(update(User).where(User.id == relocating.id).values(needs_to_update_location=True))
        session.add(
            ModNote(user_id=noted.id, creator_user_id=moderator.id, internal_id="pending", note_content="Be nice")
        )
        session.add(
            ModNote(
                user_id=acknowledged.id,
                creator_user_id=moderator.id,
                internal_id="acknowledged",
                note_content="Be nice",
                acknowledged=now() - timedelta(days=1),
            )
        )
        session.add(ActivenessProbe(user_id=probed.id))
        session.add(
            ActivenessProbe(
                user_id=responded.id,
                responded=now() - timedelta(days=1),
                response=ActivenessProbeStatus.still_active,
            )
        )
        # a phone number is required whenever the verification is: see the phone_verified_conditions constraint
        session.execute(
            update(User)
            .where(User.id == phone_verified.id)
            .values(phone="+46701740601", phone_verification_verified=now() - timedelta(days=1))
        )
        session.execute(
            update(User)
            .where(User.id == phone_stale.id)
            .values(
                phone="+46701740602",
                phone_verification_verified=now() - PHONE_VERIFICATION_LIFETIME - timedelta(days=1),
            )
        )
        session.execute(
            update(User).where(User.id == code_sent.id).values(phone_verification_sent=now() - timedelta(hours=1))
        )


@_populates(ModNote)
@_populates(ActivenessProbe)
def _populate_user_flags() -> None:
    _populate_users()


WOMAN_BIRTHDATE = date(1990, 3, 4)
MAN_BIRTHDATE = date(1985, 11, 22)


@_populates(StrongVerificationAttempt)
def _populate_strong_verification_attempts() -> None:
    woman, _ = generate_user(gender="Woman", birthdate=WOMAN_BIRTHDATE)
    man, _ = generate_user(gender="Man", birthdate=MAN_BIRTHDATE)

    with session_scope() as session:
        # succeeded and unexpired: the only shape that verifies anyone
        session.add(_attempt(woman.id, 1, StrongVerificationAttemptStatus.succeeded, expiry_days=365))
        # succeeded but the passport has expired
        session.add(_attempt(man.id, 2, StrongVerificationAttemptStatus.succeeded, expiry_days=-1))
        # same passport data as the first attempt, but the data has since been deleted
        session.add(
            _attempt(woman.id, 3, StrongVerificationAttemptStatus.deleted, expiry_days=365, has_full_data=False)
        )
        # never got any data at all
        session.add(_attempt(man.id, 4, StrongVerificationAttemptStatus.failed, expiry_days=None))


def _attempt(
    user_id: int,
    n: int,
    status: StrongVerificationAttemptStatus,
    *,
    expiry_days: int | None,
    has_full_data: bool = True,
) -> StrongVerificationAttempt:
    """A strong verification attempt in one of the shapes the check constraints allow."""
    has_minimal_data = expiry_days is not None
    # full data implies minimal data
    has_full_data = has_full_data and has_minimal_data
    return StrongVerificationAttempt(
        verification_attempt_token=f"verification_attempt_token_{n}",
        user_id=user_id,
        status=status,
        has_full_data=has_full_data,
        passport_encrypted_data=b"not real" if has_full_data else None,
        # the passport always describes the first user, so pairing it with the second is a real mismatch
        passport_date_of_birth=WOMAN_BIRTHDATE if has_full_data else None,
        passport_sex=PassportSex.female if has_full_data else None,
        has_minimal_data=has_minimal_data,
        passport_expiry_date=date.today() + timedelta(days=expiry_days) if expiry_days is not None else None,
        passport_nationality="UTO" if has_minimal_data else None,
        passport_last_three_document_chars=f"{n:03}" if has_minimal_data else None,
        iris_token=f"iris_token_{n}",
        iris_session_id=n,
    )


@_populates(PostalVerificationAttempt)
def _populate_postal_verification_attempts() -> None:
    verified, _ = generate_user()
    cancelled, _ = generate_user()
    pending, _ = generate_user()

    with session_scope() as session:
        session.add(
            PostalVerificationAttempt(
                user_id=verified.id,
                status=PostalVerificationStatus.succeeded,
                address_line_1="1 Test Street",
                city="Testing city",
                country_code="US",
                verification_code="ABC123",
                postcard_sent_at=now() - timedelta(days=10),
                verified_at=now() - timedelta(days=1),
            )
        )
        session.add(
            PostalVerificationAttempt(
                user_id=cancelled.id,
                status=PostalVerificationStatus.cancelled,
                address_line_1="2 Test Street",
                city="Testing city",
                country_code="US",
            )
        )
        session.add(
            PostalVerificationAttempt(
                user_id=pending.id,
                status=PostalVerificationStatus.pending_address_confirmation,
                address_line_1="3 Test Street",
                city="Testing city",
                country_code="US",
            )
        )


@_populates(HostRequest)
def _populate_host_requests() -> None:
    surfer, _ = generate_user()
    host, _ = generate_user()
    today = date.today()

    with session_scope() as session:
        # the stay just ended, so the reference window is open
        _host_request(session, surfer.id, host.id, HostRequestStatus.accepted, today - timedelta(days=1))
        # the reference window closed 14 days after the stay
        _host_request(session, surfer.id, host.id, HostRequestStatus.confirmed, today - timedelta(days=30))
        # the stay hasn't happened yet
        _host_request(session, surfer.id, host.id, HostRequestStatus.confirmed, today + timedelta(days=30))
        # never went ahead
        _host_request(session, surfer.id, host.id, HostRequestStatus.rejected, today - timedelta(days=1))


def _host_request(
    session: Session, surfer_id: int, host_id: int, status: HostRequestStatus, to_date: date
) -> HostRequest:
    conversation = Conversation()
    session.add(conversation)
    session.flush()
    moderation_state = create_moderation(
        session=session,
        object_type=ModerationObjectType.host_request,
        object_id=conversation.id,
        creator_user_id=surfer_id,
    )
    host_request = HostRequest(
        conversation_id=conversation.id,
        initiator_user_id=surfer_id,
        recipient_user_id=host_id,
        moderation_state_id=moderation_state.id,
        from_date=to_date - timedelta(days=2),
        to_date=to_date,
        status=status,
        hosting_city="Testing city",
        hosting_location=create_coordinate(40.7108, -73.9740),
        hosting_radius=100,
    )
    session.add(host_request)
    session.flush()
    return host_request


@_populates(EventOccurrence)
def _populate_event_occurrences() -> None:
    creator, _ = generate_user()

    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])),
            node_type=NodeType.world,
        )
        session.add(node)
        session.flush()
        event = Event(
            parent_node_id=node.id,
            title="Testing event",
            creator_user_id=creator.id,
            owner_user_id=creator.id,
        )
        session.add(event)
        session.flush()

        # occurrences may not overlap within an event
        for days, hours in [(1, 2), (10, 3)]:
            start = now() + timedelta(days=days)

            thread = Thread()
            session.add(thread)
            session.flush()

            def create_occurrence(moderation_state_id: int, start=start, hours=hours, thread=thread) -> int:
                occurrence = EventOccurrence(
                    event_id=event.id,
                    moderation_state_id=moderation_state_id,
                    creator_user_id=creator.id,
                    content="Testing event occurrence",
                    geom=create_coordinate(1, 1),
                    address="Somewhere",
                    timezone="Etc/UTC",
                    during=TimestamptzRange(start, start + timedelta(hours=hours)),
                    thread_id=thread.id,
                )
                session.add(occurrence)
                session.flush()
                return occurrence.id

            create_moderation(
                session=session,
                object_type=ModerationObjectType.event_occurrence,
                object_id=create_occurrence,
                creator_user_id=creator.id,
            )


@_populates(GroupChatSubscription)
def _populate_group_chat_subscriptions() -> None:
    creator, _ = generate_user()
    other, _ = generate_user()

    with session_scope() as session:
        conversation = Conversation()
        session.add(conversation)
        session.flush()
        moderation_state = create_moderation(
            session=session,
            object_type=ModerationObjectType.group_chat,
            object_id=conversation.id,
            creator_user_id=creator.id,
        )
        session.add(
            GroupChat(
                conversation_id=conversation.id,
                creator_id=creator.id,
                is_dm=True,
                moderation_state_id=moderation_state.id,
            )
        )
        muted = GroupChatSubscription(user_id=creator.id, group_chat_id=conversation.id, role=GroupChatRole.admin)
        session.add(muted)
        session.add(
            GroupChatSubscription(user_id=other.id, group_chat_id=conversation.id, role=GroupChatRole.participant)
        )
        session.flush()
        session.execute(
            update(GroupChatSubscription)
            .where(GroupChatSubscription.id == muted.id)
            .values(muted_until=now() + timedelta(days=7))
        )


@_populates(UserSession)
def _populate_user_sessions() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(UserSession(token=random_hex(32), user_id=user.id, long_lived=True, is_api_key=True))
        session.add(
            UserSession(token=random_hex(32), user_id=user.id, long_lived=False, is_api_key=False, deleted=now())
        )


@_populates(LoginToken)
def _populate_login_tokens() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(LoginToken(token=random_hex(32), user_id=user.id, expiry=now() + timedelta(hours=1)))
        session.add(LoginToken(token=random_hex(32), user_id=user.id, expiry=now() - timedelta(hours=1)))


@_populates(PasswordResetToken)
def _populate_password_reset_tokens() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(PasswordResetToken(token=random_hex(32), user_id=user.id, expiry=now() + timedelta(hours=1)))
        session.add(PasswordResetToken(token=random_hex(32), user_id=user.id, expiry=now() - timedelta(hours=1)))


@_populates(AccountDeletionToken)
def _populate_account_deletion_tokens() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(AccountDeletionToken(token=random_hex(32), user_id=user.id, expiry=now() + timedelta(hours=1)))
        session.add(AccountDeletionToken(token=random_hex(32), user_id=user.id, expiry=now() - timedelta(hours=1)))


@_populates(InitiatedUpload)
def _populate_initiated_uploads() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(
            InitiatedUpload(
                key=random_hex(32),
                created=now() - timedelta(hours=1),
                expiry=now() + timedelta(hours=1),
                initiator_user_id=user.id,
            )
        )
        session.add(
            InitiatedUpload(
                key=random_hex(32),
                created=now() - timedelta(hours=2),
                expiry=now() - timedelta(hours=1),
                initiator_user_id=user.id,
            )
        )


@_populates(ContributorForm)
def _populate_contributor_forms() -> None:
    user, _ = generate_user()
    with session_scope() as session:
        session.add(ContributorForm(user_id=user.id, contribute_ways=[]))
        session.add(ContributorForm(user_id=user.id, contribute_ways=["community"]))
        session.add(ContributorForm(user_id=user.id, contribute_ways=[], ideas="I have one"))


@_populates(SignupFlow)
def _populate_signup_flows() -> None:
    with session_scope() as session:
        # a flow that has been completed all the way through
        session.add(
            SignupFlow(
                name="Completed",
                email="completed@couchers.org.invalid",
                flow_token=random_hex(32),
                email_verified=True,
                email_token=random_hex(32),
                email_token_expiry=now() + timedelta(hours=1),
                username="completed",
                birthdate=date(1990, 1, 1),
                gender="Woman",
                hosting_status=HostingStatus.cant_host,
                city="Testing city",
                geom=create_coordinate(40.7108, -73.9740),
                geom_radius=100,
                accepted_tos=TOS_VERSION,
                opt_out_of_newsletter=False,
                filled_motivations=True,
            )
        )
        # the email token has expired, and the account details were never filled in
        session.add(
            SignupFlow(
                name="Expired",
                email="expired@couchers.org.invalid",
                flow_token=random_hex(32),
                email_token=random_hex(32),
                email_token_expiry=now() - timedelta(hours=1),
            )
        )
        # never got as far as being sent an email
        session.add(
            SignupFlow(
                name="Fresh",
                email="fresh@couchers.org.invalid",
                flow_token=random_hex(32),
            )
        )

        for flow in session.execute(select(SignupFlow)).scalars().all():
            if flow.name == "Completed":
                flow.accepted_community_guidelines = GUIDELINES_VERSION


@_populates(BackgroundJob)
def _populate_background_jobs() -> None:
    with session_scope() as session:
        session.add(BackgroundJob(job_type="dummy_job", payload=b""))
        session.add(BackgroundJob(job_type="dummy_job", payload=b"", state=BackgroundJobState.completed))
        session.add(BackgroundJob(job_type="dummy_job", payload=b"", state=BackgroundJobState.error, try_count=5))


## The tests


def test_every_hybrid_is_covered() -> None:
    """A new hybrid on a model has to bring a population with it, or it goes untested."""
    models = {model for model, _ in HYBRID_PROPERTIES + HYBRID_METHODS}
    assert models - POPULATIONS.keys() == set(), "these models have hybrids but no population"
    assert POPULATIONS.keys() - models == set(), "these populations are for models without hybrids"
    assert SQL_ONLY.keys() <= {_label(model, name) for model, name in HYBRID_PROPERTIES}, "stale SQL_ONLY entries"
    assert {model for model, _ in HYBRID_METHODS} == {StrongVerificationAttempt}, (
        "test_hybrid_method_agrees_with_sql only knows how to bind a User as the subject"
    )


COMPARABLE = [pair for pair in HYBRID_PROPERTIES if _label(*pair) not in SQL_ONLY]
SQL_ONLY_PROPERTIES = [pair for pair in HYBRID_PROPERTIES if _label(*pair) in SQL_ONLY]


@pytest.mark.parametrize(("model", "name"), COMPARABLE, ids=[_label(*pair) for pair in COMPARABLE])
def test_hybrid_agrees_with_sql(db, model: type[Base], name: str) -> None:
    POPULATIONS[model]()

    with session_scope() as session:
        mapper = inspect(model)
        sql_values = _sql_values(session, model, name)

        for instance in session.execute(select(model)).scalars():
            key = tuple(mapper.primary_key_from_instance(instance))
            python_value = getattr(instance, name)
            assert _agree(python_value, sql_values[key]), (
                f"{_label(model, name)} disagrees on {key}: python says {python_value!r}, "
                f"postgres says {sql_values[key]!r}"
            )


@pytest.mark.parametrize(("model", "name"), SQL_ONLY_PROPERTIES, ids=[_label(*pair) for pair in SQL_ONLY_PROPERTIES])
def test_sql_only_hybrids_are_inert_in_python(db, model: type[Base], name: str) -> None:
    """
    A hybrid with no python implementation must fail loudly rather than answer wrongly: reading it off
    an instance either raises, or hands back a SQL expression that raises the moment anything reads it
    as a boolean. If one of these ever starts returning a value, it needs comparing, not listing here.
    """
    POPULATIONS[model]()

    with session_scope() as session:
        _sql_values(session, model, name)
        instances = session.execute(select(model)).scalars().all()
        assert instances
        for instance in instances:
            with pytest.raises(TypeError):
                value = getattr(instance, name)
                assert isinstance(value, ClauseElement), f"{_label(model, name)} returns a python value now"
                bool(value)


@pytest.mark.parametrize(("model", "name"), HYBRID_METHODS, ids=[_label(model, name) for model, name in HYBRID_METHODS])
def test_hybrid_method_agrees_with_sql(db, model: type[Base], name: str) -> None:
    """
    These take a subject, so they have two forms that have to agree: evaluated in python on a pair of
    instances, and evaluated in SQL over the subject's table. Every pair is checked, not just the
    matching ones: the lite_users bug was a query that reported the right answer for the pairs it was
    meant to cover and a wrong one for everybody else.
    """
    POPULATIONS[model]()

    with session_scope() as session:
        mapper = inspect(model)
        instances = session.execute(select(model)).scalars().all()
        users = session.execute(select(User).order_by(User.id)).scalars().all()
        assert len(instances) >= 2 and len(users) >= 2

        seen = set()
        for instance in instances:
            key = tuple(mapper.primary_key_from_instance(instance))
            for user in users:
                python_value = getattr(instance, name)(user)
                # the subject comes from the users table, exactly as it does in a real query; the join
                # pins it to this one user so the row is the pair under test
                sql_value = session.execute(
                    select(getattr(model, name)(User))
                    .select_from(model)
                    .join(User, User.id == user.id)
                    .where(*(c == v for c, v in zip(mapper.primary_key, key)))
                ).scalar_one()
                assert _agree(python_value, sql_value), (
                    f"{_label(model, name)} on {key} against user {user.id}: python says "
                    f"{python_value!r}, postgres says {sql_value!r}"
                )
                seen.add(bool(sql_value))

        assert seen == {True, False}, f"{_label(model, name)} takes the same value on every pair"


def _sql_values(session: Session, model: type[Base], name: str) -> dict[tuple[Any, ...], Any]:
    """The hybrid as postgres computes it, per row, and a check that the population actually varies it."""
    mapper = inspect(model)
    values = {
        tuple(row[:-1]): row[-1] for row in session.execute(select(*mapper.primary_key, getattr(model, name))).all()
    }
    assert len(values) >= 2, "the population needs at least two rows to be worth comparing"
    assert len(set(values.values())) >= 2, (
        f"{_label(model, name)} takes the same value on every row: the population doesn't exercise it"
    )
    return values


def _agree(python_value: Any, sql_value: Any) -> bool:
    """
    Postgres computes a predicate over a NULL column as NULL, which is falsy everywhere these hybrids
    are used (WHERE, AND, OR), so python's False agrees with it. A python True against a NULL does not.
    """
    if sql_value is None:
        return python_value is False
    return bool(python_value == sql_value)
