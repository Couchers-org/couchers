from typing import Any

from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.models.logging import EventLog


def log_event(
    context: CouchersContext,
    session: Session,
    event_type: str,
    /,
    properties: dict[str, Any],
    *,
    override_user_id: int | None = None,
) -> None:
    """
    Record an analytics event.

    Usage:
        log_event(context, session, "host_request.sent", {"host_id": host.id, "nights": 3})

    Use override_user_id when the acting user differs from context (e.g. signup, token-based actions):
        log_event(context, session, "account.signup_completed", {"gender": user.gender}, override_user_id=user.id)

    Event type naming convention: "noun.verbed" with dot-separated hierarchy, e.g.
        account.login
        host_request.sent
        host_request.accepted
        message.sent
        reference.written
    """
    session.add(
        EventLog(
            event_type=event_type,
            user_id=override_user_id if override_user_id is not None else context._user_id,
            sofa=context._sofa,
            properties=properties,
        )
    )
