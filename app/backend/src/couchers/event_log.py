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
    __set_user_id: int | None = None,
) -> None:
    """
    Record an analytics event.

    Usage:
        log_event(context, session, "host_request.sent", {"host_id": host.id, "nights": 3})

    Use __set_user_id only for unauthenticated actions (signup, token-based actions) where
    context has no user_id:
        log_event(context, session, "account.signup_completed", {"gender": user.gender}, __set_user_id=user.id)

    Event type naming convention: "noun.verbed" with dot-separated hierarchy, e.g.
        account.login
        host_request.sent
        host_request.accepted
        message.sent
        reference.written
    """
    if __set_user_id is not None:
        assert context._user_id is None, "Cannot use __set_user_id when context already has a user_id"
        user_id = __set_user_id
    else:
        assert context._user_id is not None, "Context must have a user_id, or __set_user_id must be provided"
        user_id = context._user_id

    session.add(
        EventLog(
            event_type=event_type,
            user_id=user_id,
            sofa=context._sofa,
            properties=properties,
        )
    )
