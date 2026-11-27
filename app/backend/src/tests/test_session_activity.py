from datetime import datetime, timedelta

from sqlalchemy import func, insert, select, update

from couchers.db import session_scope
from couchers.models import ClientPlatform, SessionTouch, UserActivity, UserSession
from couchers.session_activity import compact_session_activity
from couchers.utils import now
from tests.fixtures.db import generate_user


def _touch(
    token: str,
    user_id: int,
    time: datetime,
    *,
    ip_address: str | None = "1.1.1.1",
    client_platform: ClientPlatform | None = None,
) -> None:
    with session_scope() as session:
        session.execute(
            insert(SessionTouch).values(
                token=token,
                user_id=user_id,
                time=time,
                ip_address=ip_address,
                user_agent="ua",
                sofa="sofa",
                client_platform=client_platform,
            )
        )


def _is_valid(token: str) -> bool:
    with session_scope() as session:
        return (
            session.execute(
                select(UserSession.token).where(UserSession.token == token).where(UserSession.is_valid)
            ).scalar_one_or_none()
            is not None
        )


def test_compaction_counts_every_call(db):
    user, token = generate_user()
    hour = datetime.fromisoformat("2026-11-20T10:00:00+00:00")

    with session_scope() as session:
        api_calls_before = session.execute(select(UserSession.api_calls).where(UserSession.token == token)).scalar_one()

    _touch(token, user.id, hour + timedelta(minutes=1))
    _touch(token, user.id, hour + timedelta(minutes=2), client_platform=ClientPlatform.web_mobile)
    _touch(token, user.id, hour + timedelta(minutes=3))
    _touch(token, user.id, hour + timedelta(minutes=4), ip_address="2.2.2.2")
    _touch(token, user.id, hour + timedelta(hours=1, minutes=5))

    compact_session_activity()

    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(SessionTouch)).scalar_one() == 0

        user_session = session.execute(select(UserSession).where(UserSession.token == token)).scalar_one()
        assert user_session.api_calls == api_calls_before + 5
        assert user_session.last_seen >= hour + timedelta(hours=1, minutes=5)

        activity = session.execute(
            select(UserActivity.period, UserActivity.ip_address, UserActivity.client_platform, UserActivity.api_calls)
            .where(UserActivity.user_id == user.id)
            .order_by(UserActivity.period, UserActivity.ip_address)
        ).all()
        assert [(period, str(ip), platform, calls) for period, ip, platform, calls in activity] == [
            (hour, "1.1.1.1", ClientPlatform.web_mobile, 3),
            (hour, "2.2.2.2", None, 1),
            (hour + timedelta(hours=1), "1.1.1.1", None, 1),
        ]


def test_compaction_adds_to_existing_activity(db):
    user, token = generate_user()
    hour = datetime.fromisoformat("2026-11-20T10:00:00+00:00")

    with session_scope() as session:
        session.add(
            UserActivity(
                user_id=user.id,
                period=hour,
                ip_address="1.1.1.1",
                user_agent="ua",
                sofa="sofa",
                client_platform=ClientPlatform.app_ios,
                api_calls=10,
            )
        )

    _touch(token, user.id, hour + timedelta(minutes=1))
    _touch(token, user.id, hour + timedelta(minutes=2))
    compact_session_activity()

    with session_scope() as session:
        activity = session.execute(
            select(UserActivity.client_platform, UserActivity.api_calls).where(UserActivity.user_id == user.id)
        ).one()
        assert tuple(activity) == (ClientPlatform.app_ios, 12)


def test_pending_touches_keep_short_lived_session_valid(db):
    user, token = generate_user()

    with session_scope() as session:
        session.execute(
            update(UserSession)
            .where(UserSession.token == token)
            .values(long_lived=False, last_seen=now() - timedelta(hours=169))
        )
    assert not _is_valid(token)

    _touch(token, user.id, now())
    assert _is_valid(token)

    compact_session_activity()
    assert _is_valid(token)
