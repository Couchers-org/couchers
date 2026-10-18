"""
Utility functions for the Unified Moderation System (UMS)
"""

from collections.abc import Callable
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import Subquery, func, select, union_all
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
            )
        )
        observe_moderation_queue_item_created(ModerationTrigger.initial_review, object_type)

    observe_moderation_action(ModerationAction.create, object_type)

    session.flush()

    return moderation_state


def auto_approve_due_queue_items(cutoff: datetime) -> Subquery:
    """
    Open INITIAL_REVIEW items on still-shadowed content whose auto-approve deadline passed before the cutoff, as
    (id, moderation_state_id, time_created, deadline). The deadline comes from the author's
    moderation_auto_approve_deadline_seconds, falling back to MODERATION_AUTO_APPROVE_DEADLINE_SECONDS. Content by
    shadowed authors, or authors whose moderation_auto_approve_deadline_seconds is zero, is never due.
    """
    deadline = func.coalesce(
        User.moderation_auto_approve_deadline_seconds, config.MODERATION_AUTO_APPROVE_DEADLINE_SECONDS
    )
    return union_all(
        *(
            select(
                ModerationQueueItem.id,
                ModerationQueueItem.moderation_state_id,
                ModerationQueueItem.time_created,
                deadline.label("deadline"),
            )
            .join(ModerationState, ModerationState.id == ModerationQueueItem.moderation_state_id)
            .join(entry.model, entry.moderation_state_id_column == ModerationState.id)
            .join(User, User.id == entry.author_column)
            .where(ModerationQueueItem.trigger == ModerationTrigger.initial_review)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
            .where(ModerationState.visibility == ModerationVisibility.shadowed)
            .where(~User.is_shadowed)
            .where(User.moderation_auto_approve_deadline_seconds.is_distinct_from(0))
            .where(ModerationQueueItem.time_created + deadline * timedelta(seconds=1) < cutoff)
            for entry in get_moderated_models().values()
            if not entry.has_own_visibility_mechanism
        )
    ).subquery()
