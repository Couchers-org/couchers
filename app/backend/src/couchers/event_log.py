from typing import Any

from sqlalchemy.orm import Session

from couchers.config import Config
from couchers.context import CouchersContext
from couchers.models.logging import EventLog, EventSource


def log_event(
    context: CouchersContext,
    session: Session,
    event_type: str,
    /,
    properties: dict[str, Any],
    *,
    value: float = 1.0,
    _override_user_id: int | None = None,
) -> None:
    """
    Record a backend analytics event.

    Usage:
        log_event(context, session, "host_request.sent", {"host_id": host.id, "nights": 3})

    Use _override_user_id for actions where the user is known but may not be in context
    (e.g. signup, token-based actions):
        log_event(context, session, "account.signup_completed", {...}, _override_user_id=user.id)

    If context has no user_id and no _override_user_id is given, user_id will be None (anonymous event).

    Event type naming convention: "noun.verbed" with dot-separated hierarchy, e.g.
        account.login
        host_request.sent
        host_request.accepted
        message.sent
        reference.written
    """
    user_id = _override_user_id if _override_user_id is not None else context._user_id

    session.add(
        EventLog(
            event_type=event_type,
            user_id=user_id,
            sofa=context._sofa,
            version=Config.current.version,
            properties=properties,
            value=value,
            source=EventSource.backend,
        )
    )
