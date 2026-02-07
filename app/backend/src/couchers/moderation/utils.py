"""
Utility functions for the Unified Moderation System (UMS)
"""

from sqlalchemy.orm import Session

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
        visibility=ModerationVisibility.shadowed,
    )
    session.add(moderation_state)
    session.flush()

    session.add(
        ModerationLog(
            moderation_state_id=moderation_state.id,
            action=ModerationAction.create,
            moderator_user_id=creator_user_id,
            new_visibility=ModerationVisibility.shadowed,
            reason="Object created.",
        )
    )

    session.add(
        ModerationQueueItem(
            moderation_state_id=moderation_state.id,
            trigger=ModerationTrigger.initial_review,
            reason="Object created.",
        )
    )
    session.flush()

    observe_moderation_action(ModerationAction.create, object_type)
    observe_moderation_queue_item_created(ModerationTrigger.initial_review, object_type)

    return moderation_state
