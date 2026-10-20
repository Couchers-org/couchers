from sqlalchemy import insert, literal, select
from sqlalchemy.orm import Session

from couchers.models import HostingMeetupStatusHistory, HostingMeetupStatusSource, User


def record_hosting_meetup_status(session: Session, user: User, source: HostingMeetupStatusSource) -> None:
    """
    Append the user's current hosting and meetup statuses to their history.

    Call this after any code path that may change either status; it's a no-op if the statuses are unchanged since the
    last recorded row, so it's safe to call unconditionally.

    The snapshot is read from the user's row rather than the in-memory object, so a pending status change has to be
    flushed first -- the execute below autoflushes, so this only matters under `no_autoflush`.
    """
    latest = (
        select(HostingMeetupStatusHistory.hosting_status, HostingMeetupStatusHistory.meetup_status)
        .where(HostingMeetupStatusHistory.user_id == user.id)
        .order_by(HostingMeetupStatusHistory.time.desc(), HostingMeetupStatusHistory.id.desc())
        .limit(1)
        .subquery()
    )
    session.execute(
        insert(HostingMeetupStatusHistory).from_select(
            ["user_id", "source", "hosting_status", "meetup_status"],
            select(
                User.id,
                literal(source, HostingMeetupStatusHistory.source.type),
                User.hosting_status,
                User.meetup_status,
            )
            .where(User.id == user.id)
            .where(
                ~select(latest)
                .where(latest.c.hosting_status == User.hosting_status)
                .where(latest.c.meetup_status == User.meetup_status)
                .exists()
            ),
        )
    )
