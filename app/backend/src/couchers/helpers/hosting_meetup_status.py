from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.models import HostingMeetupStatusHistory, HostingMeetupStatusSource, User


def record_hosting_meetup_status(session: Session, user: User, source: HostingMeetupStatusSource) -> None:
    """
    Append the user's current hosting and meetup statuses to their history.

    Call this after any code path that may change either status; it's a no-op if the statuses are unchanged since the
    last recorded row, so it's safe to call unconditionally.
    """
    latest = session.execute(
        select(HostingMeetupStatusHistory)
        .where(HostingMeetupStatusHistory.user_id == user.id)
        .order_by(HostingMeetupStatusHistory.time.desc(), HostingMeetupStatusHistory.id.desc())
        .limit(1)
    ).scalar_one_or_none()

    if latest and latest.hosting_status == user.hosting_status and latest.meetup_status == user.meetup_status:
        return

    session.add(
        HostingMeetupStatusHistory(
            user_id=user.id,
            source=source,
            hosting_status=user.hosting_status,
            meetup_status=user.meetup_status,
        )
    )
