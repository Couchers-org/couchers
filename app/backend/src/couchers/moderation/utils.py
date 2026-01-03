"""
Utility functions for the Unified Moderation System (UMS)
"""

from sqlalchemy.orm import Session

from couchers.db import add
from couchers.metrics import observe_moderation_action, observe_moderation_queue_item_created
from couchers.models import (
    ModerationAction,
    ModerationLog,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
)


def create_moderation(
    session: Session,
    object_type: ModerationObjectType,
    object_id: int,
    creator_user_id: int,
) -> ModerationState:
    moderation_state = ModerationState(
        object_type=object_type,
        object_id=object_id,
        visibility=ModerationVisibility.SHADOWED,
    )
    add(session, moderation_state)

    add(
        session,
        ModerationLog(
            moderation_state_id=moderation_state.id,
            action=ModerationAction.CREATE,
            moderator_user_id=creator_user_id,
            new_visibility=ModerationVisibility.SHADOWED,
            reason="Object created.",
        ),
    )

    add(
        session,
        ModerationQueueItem(
            moderation_state_id=moderation_state.id,
            trigger=ModerationTrigger.INITIAL_REVIEW,
            reason="Object created.",
        ),
    )

    observe_moderation_action(ModerationAction.CREATE, object_type)
    observe_moderation_queue_item_created(ModerationTrigger.INITIAL_REVIEW, object_type)

    return moderation_state
