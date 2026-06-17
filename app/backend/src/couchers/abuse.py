from couchers.context import CouchersContext
from couchers.db import session_scope
from couchers.metrics import observe_nonvisible_user_access
from couchers.models import (
    NonvisibleUserAccess,
    NonvisibleUserAccessType,
    NonvisibleUserState,
    User,
)


def nonvisible_user_state(user: User) -> NonvisibleUserState | None:
    if user.banned_at is not None:
        return NonvisibleUserState.banned
    if user.shadowed_at is not None:
        return NonvisibleUserState.shadowed
    if user.deleted_at is not None:
        return NonvisibleUserState.deleted
    return None


def maybe_log_nonvisible_user_access(
    context: CouchersContext,
    user: User,
    *,
    access_type: NonvisibleUserAccessType,
    actor_user_id: int | None,
) -> None:
    target_state = nonvisible_user_state(user)
    if target_state is None:
        return

    if actor_user_id == user.id:
        ip_address = context.get_header("x-couchers-real-ip")
        user_agent = context.get_header("user-agent")
        sofa = context._sofa
    else:
        ip_address = None
        user_agent = None
        sofa = None

    with session_scope() as session:
        session.add(
            NonvisibleUserAccess(
                access_type=access_type,
                target_user_id=user.id,
                target_state=target_state,
                actor_user_id=actor_user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                sofa=sofa,
            )
        )

    observe_nonvisible_user_access(access_type, target_state)
