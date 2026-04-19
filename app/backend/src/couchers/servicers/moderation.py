import logging
from typing import TYPE_CHECKING

import grpc
from sqlalchemy import and_, exists, not_, or_, select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.jobs.enqueue import queue_job
from couchers.metrics import (
    observe_moderation_action,
    observe_moderation_queue_item_created,
    observe_moderation_queue_item_resolved,
    observe_moderation_queue_resolution_time,
    observe_moderation_visibility_transition,
)
from couchers.models import (
    AdminAction,
    AdminActionLevel,
    Event,
    EventOccurrence,
    FriendRelationship,
    GroupChat,
    HostRequest,
    Message,
    MessageType,
    ModerationAction,
    ModerationLog,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
    Notification,
    NotificationDelivery,
    User,
)
from couchers.proto import moderation_pb2, moderation_pb2_grpc
from couchers.proto.internal import jobs_pb2
from couchers.utils import Timestamp_from_datetime, now

if TYPE_CHECKING:
    from couchers.sql import _ModeratedContent

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 1_000

# Moderation enum mappings
moderationvisibility2api = {
    None: moderation_pb2.MODERATION_VISIBILITY_UNSPECIFIED,
    ModerationVisibility.hidden: moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
    ModerationVisibility.shadowed: moderation_pb2.MODERATION_VISIBILITY_SHADOWED,
    ModerationVisibility.visible: moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
    ModerationVisibility.unlisted: moderation_pb2.MODERATION_VISIBILITY_UNLISTED,
}

moderationvisibility2sql = {
    moderation_pb2.MODERATION_VISIBILITY_UNSPECIFIED: None,
    moderation_pb2.MODERATION_VISIBILITY_HIDDEN: ModerationVisibility.hidden,
    moderation_pb2.MODERATION_VISIBILITY_SHADOWED: ModerationVisibility.shadowed,
    moderation_pb2.MODERATION_VISIBILITY_VISIBLE: ModerationVisibility.visible,
    moderation_pb2.MODERATION_VISIBILITY_UNLISTED: ModerationVisibility.unlisted,
}

moderationtrigger2api = {
    None: moderation_pb2.MODERATION_TRIGGER_UNSPECIFIED,
    ModerationTrigger.initial_review: moderation_pb2.MODERATION_TRIGGER_INITIAL_REVIEW,
    ModerationTrigger.user_flag: moderation_pb2.MODERATION_TRIGGER_USER_FLAG,
    ModerationTrigger.machine_flag: moderation_pb2.MODERATION_TRIGGER_MACHINE_FLAG,
    ModerationTrigger.moderator_review: moderation_pb2.MODERATION_TRIGGER_MODERATOR_REVIEW,
}

moderationtrigger2sql = {
    moderation_pb2.MODERATION_TRIGGER_UNSPECIFIED: None,
    moderation_pb2.MODERATION_TRIGGER_INITIAL_REVIEW: ModerationTrigger.initial_review,
    moderation_pb2.MODERATION_TRIGGER_USER_FLAG: ModerationTrigger.user_flag,
    moderation_pb2.MODERATION_TRIGGER_MACHINE_FLAG: ModerationTrigger.machine_flag,
    moderation_pb2.MODERATION_TRIGGER_MODERATOR_REVIEW: ModerationTrigger.moderator_review,
}

moderationaction2api = {
    None: moderation_pb2.MODERATION_ACTION_UNSPECIFIED,
    ModerationAction.create: moderation_pb2.MODERATION_ACTION_CREATE,
    ModerationAction.approve: moderation_pb2.MODERATION_ACTION_APPROVE,
    ModerationAction.hide: moderation_pb2.MODERATION_ACTION_HIDE,
    ModerationAction.flag: moderation_pb2.MODERATION_ACTION_FLAG,
    ModerationAction.unflag: moderation_pb2.MODERATION_ACTION_UNFLAG,
    ModerationAction.bulk_set_visibility: moderation_pb2.MODERATION_ACTION_BULK_SET_VISIBILITY,
}

moderationaction2sql = {
    moderation_pb2.MODERATION_ACTION_UNSPECIFIED: None,
    moderation_pb2.MODERATION_ACTION_CREATE: ModerationAction.create,
    moderation_pb2.MODERATION_ACTION_APPROVE: ModerationAction.approve,
    moderation_pb2.MODERATION_ACTION_HIDE: ModerationAction.hide,
    moderation_pb2.MODERATION_ACTION_FLAG: ModerationAction.flag,
    moderation_pb2.MODERATION_ACTION_UNFLAG: ModerationAction.unflag,
    moderation_pb2.MODERATION_ACTION_BULK_SET_VISIBILITY: ModerationAction.bulk_set_visibility,
}

moderationobjecttype2api = {
    None: moderation_pb2.MODERATION_OBJECT_TYPE_UNSPECIFIED,
    ModerationObjectType.host_request: moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
    ModerationObjectType.group_chat: moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
    ModerationObjectType.friend_request: moderation_pb2.MODERATION_OBJECT_TYPE_FRIEND_REQUEST,
    ModerationObjectType.event_occurrence: moderation_pb2.MODERATION_OBJECT_TYPE_EVENT_OCCURRENCE,
}

moderationobjecttype2sql = {
    moderation_pb2.MODERATION_OBJECT_TYPE_UNSPECIFIED: None,
    moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST: ModerationObjectType.host_request,
    moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT: ModerationObjectType.group_chat,
    moderation_pb2.MODERATION_OBJECT_TYPE_FRIEND_REQUEST: ModerationObjectType.friend_request,
    moderation_pb2.MODERATION_OBJECT_TYPE_EVENT_OCCURRENCE: ModerationObjectType.event_occurrence,
}

# Mapping from ModerationObjectType to the SQLAlchemy model class
moderationobjecttype2model: dict[ModerationObjectType, _ModeratedContent] = {
    ModerationObjectType.host_request: HostRequest,
    ModerationObjectType.group_chat: GroupChat,
    ModerationObjectType.friend_request: FriendRelationship,
    ModerationObjectType.event_occurrence: EventOccurrence,
}


def _enqueue_pending_notifications(session: Session, moderation_state_id: int) -> None:
    """Re-queue any pending notifications linked to the given moderation state whose deliveries were suppressed."""
    pending_notifications = (
        session.execute(
            select(Notification)
            .where(Notification.moderation_state_id == moderation_state_id)
            .where(not_(exists().where(NotificationDelivery.notification_id == Notification.id)))
        )
        .scalars()
        .all()
    )

    # Import here to avoid circular dependency
    from couchers.notifications.background import handle_notification  # noqa: PLC0415

    for notification in pending_notifications:
        queue_job(
            session,
            job=handle_notification,
            payload=jobs_pb2.HandleNotificationPayload(notification_id=notification.id),
        )


def moderation_state_to_pb(state: ModerationState, session: Session) -> moderation_pb2.ModerationStateInfo:
    """Convert ModerationState model to proto message"""
    object_type = state.object_type
    object_id = state.object_id

    # Get the author user ID and content based on object type
    if object_type == ModerationObjectType.host_request:
        author_user_id = session.execute(
            select(HostRequest.initiator_user_id).where(HostRequest.conversation_id == object_id)
        ).scalar_one()
        # Get the first text message for this conversation
        content = session.execute(
            select(Message.text)
            .where(Message.conversation_id == object_id)
            .where(Message.message_type == MessageType.text)
            .order_by(Message.id.asc())
            .limit(1)
        ).scalar_one_or_none()
    elif object_type == ModerationObjectType.group_chat:
        author_user_id = session.execute(
            select(GroupChat.creator_id).where(GroupChat.conversation_id == object_id)
        ).scalar_one()
        # Get the first text message for this conversation
        content = session.execute(
            select(Message.text)
            .where(Message.conversation_id == object_id)
            .where(Message.message_type == MessageType.text)
            .order_by(Message.id.asc())
            .limit(1)
        ).scalar_one_or_none()
    elif object_type == ModerationObjectType.friend_request:
        author_user_id = session.execute(
            select(FriendRelationship.from_user_id).where(FriendRelationship.id == object_id)
        ).scalar_one()
        # Friend requests have no text content
        content = None
    elif object_type == ModerationObjectType.event_occurrence:
        author_user_id, title, description = session.execute(
            select(EventOccurrence.creator_user_id, Event.title, EventOccurrence.content)
            .join(Event, Event.id == EventOccurrence.event_id)
            .where(EventOccurrence.id == object_id)
        ).one()
        content = f"{title}\n\n{description}"
    else:
        raise ValueError(f"Unsupported moderation object type: {object_type}")

    state_pb = moderation_pb2.ModerationStateInfo(
        moderation_state_id=state.id,
        object_type=moderationobjecttype2api[state.object_type],
        object_id=state.object_id,
        visibility=moderationvisibility2api[state.visibility],
        created=Timestamp_from_datetime(state.created),
        updated=Timestamp_from_datetime(state.updated),
        author_user_id=author_user_id,
        content=content or "",
    )

    return state_pb


class Moderation(moderation_pb2_grpc.ModerationServicer):
    def GetModerationQueue(
        self, request: moderation_pb2.GetModerationQueueReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.GetModerationQueueRes:
        """Get moderation queue items with optional filtering"""

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)

        # Build query
        statement = select(ModerationQueueItem)

        # Apply page token filter based on ordering direction
        if request.page_token:
            page_token_id = int(request.page_token)
            if request.newest_first:
                # Descending order: get items with smaller IDs
                statement = statement.where(ModerationQueueItem.id < page_token_id)
            else:
                # Ascending order: get items with larger IDs
                statement = statement.where(ModerationQueueItem.id > page_token_id)

        # Apply filters
        if request.triggers:
            internal_triggers = [moderationtrigger2sql[t] for t in request.triggers]
            statement = statement.where(ModerationQueueItem.trigger.in_(internal_triggers))

        if request.object_type and request.object_type != moderation_pb2.MODERATION_OBJECT_TYPE_UNSPECIFIED:
            internal_object_type = moderationobjecttype2sql[request.object_type]
            if internal_object_type:
                statement = statement.join(ModerationState).where(ModerationState.object_type == internal_object_type)

        if request.unresolved_only:
            statement = statement.where(ModerationQueueItem.resolved_by_log_id.is_(None))

        if request.HasField("created_before"):
            created_before = request.created_before.ToDatetime()
            statement = statement.where(ModerationQueueItem.time_created < created_before)

        if request.HasField("created_after"):
            created_after = request.created_after.ToDatetime()
            statement = statement.where(ModerationQueueItem.time_created > created_after)

        if request.item_author_user_id:
            author_user_id = request.item_author_user_id

            # Use EXISTS for efficient author filtering
            author_exists_clauses = []
            for model in moderationobjecttype2model.values():
                author_col = getattr(model, model.__moderation_author_column__)
                author_exists_clauses.append(
                    exists().where(
                        and_(
                            model.moderation_state_id == ModerationQueueItem.moderation_state_id,
                            author_col == author_user_id,
                        )
                    )
                )
            statement = statement.where(or_(*author_exists_clauses))

        # Order by time created
        if request.newest_first:
            statement = statement.order_by(ModerationQueueItem.time_created.desc(), ModerationQueueItem.id.desc())
        else:
            statement = statement.order_by(ModerationQueueItem.time_created.asc(), ModerationQueueItem.id.asc())

        queue_items = session.execute(statement.limit(page_size + 1)).scalars().all()

        # Convert to proto
        queue_items_pb = []
        for item in queue_items[:page_size]:
            # Fetch the moderation state for this queue item
            mod_state = session.execute(
                select(ModerationState).where(ModerationState.id == item.moderation_state_id)
            ).scalar_one()

            queue_item_pb = moderation_pb2.ModerationQueueItemInfo(
                queue_item_id=item.id,
                moderation_state_id=item.moderation_state_id,
                time_created=Timestamp_from_datetime(item.time_created),
                trigger=moderationtrigger2api[item.trigger],
                reason=item.reason,
                is_resolved=item.resolved_by_log_id is not None,
                resolved_by_log_id=item.resolved_by_log_id or 0,
                moderation_state=moderation_state_to_pb(mod_state, session),
            )

            queue_items_pb.append(queue_item_pb)

        return moderation_pb2.GetModerationQueueRes(
            queue_items=queue_items_pb,
            # Use the ID of the last returned item (not the extra fetched item) as the cursor
            next_page_token=str(queue_items[page_size - 1].id) if len(queue_items) > page_size else None,
        )

    def GetModerationState(
        self, request: moderation_pb2.GetModerationStateReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.GetModerationStateRes:
        """Get moderation state by object type and object ID"""
        object_type = moderationobjecttype2sql[request.object_type]
        if object_type is None:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Object type must be specified.")

        moderation_state = session.execute(
            select(ModerationState)
            .where(ModerationState.object_type == object_type)
            .where(ModerationState.object_id == request.object_id)
        ).scalar_one_or_none()
        if moderation_state is None:
            context.abort(grpc.StatusCode.NOT_FOUND, "Moderation state not found.")

        return moderation_pb2.GetModerationStateRes(
            moderation_state=moderation_state_to_pb(moderation_state, session),
        )

    def GetModerationLog(
        self, request: moderation_pb2.GetModerationLogReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.GetModerationLogRes:
        """Get moderation log for a specific moderation state"""
        # Get the moderation state
        moderation_state = session.execute(
            select(ModerationState).where(ModerationState.id == request.moderation_state_id)
        ).scalar_one_or_none()
        if moderation_state is None:
            context.abort(grpc.StatusCode.NOT_FOUND, "Moderation state not found.")

        # Get all log entries for this state, ordered by time (most recent first)
        log_entries = (
            session.execute(
                select(ModerationLog)
                .where(ModerationLog.moderation_state_id == request.moderation_state_id)
                .order_by(ModerationLog.time.desc(), ModerationLog.id.desc())
            )
            .scalars()
            .all()
        )

        # Convert moderation state to proto first (while still in session)
        moderation_state_pb = moderation_state_to_pb(moderation_state, session)

        # Convert to proto
        log_entries_pb = []
        for entry in log_entries:
            log_entry_pb = moderation_pb2.ModerationLogEntryInfo(
                log_entry_id=entry.id,
                moderation_state_id=entry.moderation_state_id,
                time=Timestamp_from_datetime(entry.time),
                action=moderationaction2api[entry.action],
                moderator_user_id=entry.moderator_user_id,
                reason=entry.reason,
            )

            # Only include changed fields
            if entry.new_visibility is not None:
                log_entry_pb.new_visibility = moderationvisibility2api[entry.new_visibility]

            log_entries_pb.append(log_entry_pb)

        return moderation_pb2.GetModerationLogRes(
            log_entries=log_entries_pb,
            moderation_state=moderation_state_pb,
        )

    def ModerateContent(
        self, request: moderation_pb2.ModerateContentReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.ModerateContentRes:
        """Unified moderation action - takes both action and visibility explicitly"""

        moderation_state = session.execute(
            select(ModerationState).where(ModerationState.id == request.moderation_state_id)
        ).scalar_one_or_none()
        if moderation_state is None:
            context.abort(grpc.StatusCode.NOT_FOUND, "Moderation state not found.")

        # Convert proto enums to internal enums
        action = moderationaction2sql[request.action]
        if action is None:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "action_must_be_specified")

        new_visibility = moderationvisibility2sql[request.visibility]
        if new_visibility is None:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "visibility_must_be_specified")

        reason = request.reason or "Moderated by admin"

        # Track old visibility for metrics
        old_visibility = moderation_state.visibility

        # Update visibility
        moderation_state.visibility = new_visibility
        moderation_state.updated = now()

        # Log the action
        log_entry = ModerationLog(
            moderation_state_id=moderation_state.id,
            action=action,
            moderator_user_id=context.user_id,
            new_visibility=new_visibility,
            reason=reason,
        )
        session.add(log_entry)
        session.flush()

        # Resolve any pending queue items
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == moderation_state.id)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
            .order_by(ModerationQueueItem.time_created.desc())
        ).scalar_one_or_none()

        if queue_item:
            queue_item.resolved_by_log_id = log_entry.id
            session.flush()
            observe_moderation_queue_item_resolved(queue_item.trigger, action, moderation_state.object_type)
            observe_moderation_queue_resolution_time(
                queue_item.trigger,
                action,
                moderation_state.object_type,
                (now() - queue_item.time_created).total_seconds(),
            )

        observe_moderation_action(action, moderation_state.object_type)
        observe_moderation_visibility_transition(old_visibility, new_visibility, moderation_state.object_type)

        # If visibility becomes VISIBLE or UNLISTED, trigger pending notifications
        if new_visibility in (ModerationVisibility.visible, ModerationVisibility.unlisted):
            _enqueue_pending_notifications(session, moderation_state.id)

        return moderation_pb2.ModerateContentRes(
            moderation_state=moderation_state_to_pb(moderation_state, session),
        )

    def FlagContentForReview(
        self, request: moderation_pb2.FlagContentForReviewReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.FlagContentForReviewRes:
        """Flag content for review by adding it to the moderation queue"""

        moderation_state = session.execute(
            select(ModerationState).where(ModerationState.id == request.moderation_state_id)
        ).scalar_one_or_none()
        if not moderation_state:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "moderation_state_not_found")

        trigger = moderationtrigger2sql[request.trigger] or ModerationTrigger.initial_review
        reason = request.reason or "Flagged by admin for review"

        # Add to moderation queue
        queue_item = ModerationQueueItem(
            moderation_state_id=request.moderation_state_id,
            trigger=trigger,
            reason=reason,
        )
        session.add(queue_item)
        session.flush()

        observe_moderation_action(ModerationAction.flag, moderation_state.object_type)
        observe_moderation_queue_item_created(trigger, moderation_state.object_type)

        queue_item_pb = moderation_pb2.ModerationQueueItemInfo(
            queue_item_id=queue_item.id,
            moderation_state_id=queue_item.moderation_state_id,
            time_created=Timestamp_from_datetime(queue_item.time_created),
            trigger=moderationtrigger2api[queue_item.trigger],
            reason=queue_item.reason,
            is_resolved=False,
            resolved_by_log_id=0,
            moderation_state=moderation_state_to_pb(moderation_state, session),
        )

        return moderation_pb2.FlagContentForReviewRes(queue_item=queue_item_pb)

    def UnflagContent(
        self, request: moderation_pb2.UnflagContentReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.UnflagContentRes:
        """Unflag content by resolving pending queue items"""

        moderation_state = session.execute(
            select(ModerationState).where(ModerationState.id == request.moderation_state_id)
        ).scalar_one_or_none()
        if not moderation_state:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "moderation_state_not_found")

        reason = request.reason or "Unflagged by admin"

        # Update moderation state (inline moderate_content logic)
        moderation_state.updated = now()

        # Log the unflag action
        log_entry = ModerationLog(
            moderation_state_id=moderation_state.id,
            action=ModerationAction.unflag,
            moderator_user_id=context.user_id,
            new_visibility=None,
            reason=reason,
        )
        session.add(log_entry)
        session.flush()

        # Resolve any pending queue items (inline resolve_queue_item logic)
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == moderation_state.id)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
            .order_by(ModerationQueueItem.time_created.desc())
        ).scalar_one_or_none()

        if queue_item:
            queue_item.resolved_by_log_id = log_entry.id
            session.flush()
            observe_moderation_queue_item_resolved(
                queue_item.trigger, ModerationAction.unflag, moderation_state.object_type
            )
            observe_moderation_queue_resolution_time(
                queue_item.trigger,
                ModerationAction.unflag,
                moderation_state.object_type,
                (now() - queue_item.time_created).total_seconds(),
            )

        observe_moderation_action(ModerationAction.unflag, moderation_state.object_type)

        return moderation_pb2.UnflagContentRes(
            moderation_state=moderation_state_to_pb(moderation_state, session),
        )

    def SetUserContentVisibility(
        self, request: moderation_pb2.SetUserContentVisibilityReq, context: CouchersContext, session: Session
    ) -> moderation_pb2.SetUserContentVisibilityRes:
        """Bulk-set visibility on every UMS-governed object authored by the given user."""
        new_visibility = moderationvisibility2sql[request.visibility]
        if new_visibility is None:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "visibility_must_be_specified")

        user = session.execute(select(User).where(User.id == request.user_id)).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        reason = request.reason or f"Bulk visibility update for user {user.id} to {new_visibility.name}"
        action = ModerationAction.bulk_set_visibility

        author_exists_clauses = []
        for model in moderationobjecttype2model.values():
            author_col = getattr(model, model.__moderation_author_column__)
            author_exists_clauses.append(
                exists().where(and_(model.moderation_state_id == ModerationState.id, author_col == user.id))
            )

        states = session.execute(select(ModerationState).where(or_(*author_exists_clauses))).scalars().all()

        updated_count = 0
        for moderation_state in states:
            if moderation_state.visibility == new_visibility:
                continue

            old_visibility = moderation_state.visibility
            moderation_state.visibility = new_visibility
            moderation_state.updated = now()

            log_entry = ModerationLog(
                moderation_state_id=moderation_state.id,
                action=action,
                moderator_user_id=context.user_id,
                new_visibility=new_visibility,
                reason=reason,
            )
            session.add(log_entry)
            session.flush()

            queue_item = session.execute(
                select(ModerationQueueItem)
                .where(ModerationQueueItem.moderation_state_id == moderation_state.id)
                .where(ModerationQueueItem.resolved_by_log_id.is_(None))
                .order_by(ModerationQueueItem.time_created.desc())
            ).scalar_one_or_none()
            if queue_item:
                queue_item.resolved_by_log_id = log_entry.id
                session.flush()

            observe_moderation_action(action, moderation_state.object_type)
            observe_moderation_visibility_transition(old_visibility, new_visibility, moderation_state.object_type)

            if new_visibility in (ModerationVisibility.visible, ModerationVisibility.unlisted):
                _enqueue_pending_notifications(session, moderation_state.id)

            updated_count += 1

        session.add(
            AdminAction(
                admin_user_id=context.user_id,
                target_user_id=user.id,
                action_type="set_user_content_visibility",
                level=AdminActionLevel.high,
                note=request.reason or None,
                tag=new_visibility.name,
            )
        )

        return moderation_pb2.SetUserContentVisibilityRes(updated_count=updated_count)
