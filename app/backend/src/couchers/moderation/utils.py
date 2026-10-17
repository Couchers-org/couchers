"""
Utility functions for the Unified Moderation System (UMS)
"""

from collections.abc import Callable
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import ColumnElement, and_, exists, not_, or_
from sqlalchemy.orm import Session

from couchers.config import config
from couchers.metrics import observe_moderation_action, observe_moderation_queue_item_created
from couchers.models import (
    ModerationAction,
    ModerationLog,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
    User,
    get_moderated_models,
)
from couchers.utils import now


def create_moderation(
    session: Session,
    object_type: ModerationObjectType,
    object_id: int | Callable[[int], int],
    # None for objects that are their own creator, whose id isn't known until the callback has run
    creator_user_id: int | None = None,
    data: Any | None = None,
) -> ModerationState:
    has_own_visibility_mechanism = get_moderated_models()[object_type].has_own_visibility_mechanism
    visibility = None if has_own_visibility_mechanism else ModerationVisibility.shadowed

    # Handle callback pattern for circular dependencies
    if callable(object_id):
        moderation_state = ModerationState(
            object_type=object_type,
            object_id=0,  # Placeholder
            visibility=visibility,
        )
        session.add(moderation_state)
        session.flush()

        # Call the callback to create the object and get its ID
        actual_object_id = object_id(moderation_state.id)
        moderation_state.object_id = actual_object_id
    else:
        actual_object_id = object_id
        moderation_state = ModerationState(
            object_type=object_type,
            object_id=object_id,
            visibility=visibility,
        )
        session.add(moderation_state)
        session.flush()

    session.add(
        ModerationLog(
            moderation_state_id=moderation_state.id,
            action=ModerationAction.create,
            moderator_user_id=creator_user_id if creator_user_id is not None else actual_object_id,
            new_visibility=visibility,
            reason="Object created.",
        )
    )

    if not has_own_visibility_mechanism:
        session.add(
            ModerationQueueItem(
                moderation_state_id=moderation_state.id,
                trigger=ModerationTrigger.initial_review,
                reason="Object created.",
                data=data,
                auto_approve_at=(
                    now() + timedelta(seconds=config.MODERATION_AUTO_APPROVE_DEADLINE_SECONDS)
                    if config.MODERATION_AUTO_APPROVE_DEADLINE_SECONDS > 0
                    else None
                ),
            )
        )
        observe_moderation_queue_item_created(ModerationTrigger.initial_review, object_type)

    observe_moderation_action(ModerationAction.create, object_type)

    session.flush()

    return moderation_state


def auto_approve_due(cutoff: datetime) -> ColumnElement[bool]:
    """
    Open queue items whose auto-approve deadline passed before the cutoff, unless the content's author is shadowed.
    """
    author_shadowed = or_(
        *(
            exists().where(
                entry.moderation_state_id_column == ModerationQueueItem.moderation_state_id,
                entry.author_column == User.id,
                User.is_shadowed,
            )
            for entry in get_moderated_models().values()
            if not entry.has_own_visibility_mechanism
        )
    )
    return and_(
        ModerationQueueItem.resolved_by_log_id.is_(None),
        ModerationQueueItem.auto_approve_at < cutoff,
        not_(author_shadowed),
    )
