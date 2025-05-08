import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import select

from couchers.db import session_scope
from couchers.models import (
    Comment,
    Discussion,
    Event,
    EventCommunityInviteRequest,
    EventOccurrence,
    FriendRelationship,
    GroupChat,
    HostRequest,
    Message,
    Moderation,
    ModerationReviewAction,
    ModerationReviewState,
    ModerationVisibilityState,
    ObjectType,
    Page,
    Reference,
    Reply,
    Upload,
)
from proto import moderation_pb2, moderation_pb2_grpc

visibilitystate2sql = {
    moderation_pb2.MODERATION_VISIBILITY_STATE_UNSPECIFIED: None,
    moderation_pb2.MODERATION_VISIBILITY_STATE_VISIBLE: ModerationVisibilityState.visible,
    moderation_pb2.MODERATION_VISIBILITY_STATE_HIDDEN: ModerationVisibilityState.hidden,
    moderation_pb2.MODERATION_VISIBILITY_STATE_DELETED: ModerationVisibilityState.deleted,
}

visibilitystate2api = {
    None: moderation_pb2.MODERATION_VISIBILITY_STATE_UNSPECIFIED,
    ModerationVisibilityState.visible: moderation_pb2.MODERATION_VISIBILITY_STATE_VISIBLE,
    ModerationVisibilityState.hidden: moderation_pb2.MODERATION_VISIBILITY_STATE_HIDDEN,
    ModerationVisibilityState.deleted: moderation_pb2.MODERATION_VISIBILITY_STATE_DELETED,
}

reviewstate2sql = {
    moderation_pb2.MODERATION_REVIEW_STATE_UNSPECIFIED: None,
    moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_PENDING: ModerationReviewState.machine_pending,
    moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_APPROVED: ModerationReviewState.machine_approved,
    moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_REJECTED: ModerationReviewState.machine_rejected,
    moderation_pb2.MODERATION_REVIEW_STATE_MOD_PENDING: ModerationReviewState.mod_pending,
    moderation_pb2.MODERATION_REVIEW_STATE_MOD_APPROVED: ModerationReviewState.mod_approved,
    moderation_pb2.MODERATION_REVIEW_STATE_MOD_REJECTED: ModerationReviewState.mod_rejected,
    moderation_pb2.MODERATION_REVIEW_STATE_MOD_DELETED: ModerationReviewState.mod_deleted,
}

reviewstate2api = {
    None: moderation_pb2.MODERATION_REVIEW_STATE_UNSPECIFIED,
    ModerationReviewState.machine_pending: moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_PENDING,
    ModerationReviewState.machine_approved: moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_APPROVED,
    ModerationReviewState.machine_rejected: moderation_pb2.MODERATION_REVIEW_STATE_MACHINE_REJECTED,
    ModerationReviewState.mod_pending: moderation_pb2.MODERATION_REVIEW_STATE_MOD_PENDING,
    ModerationReviewState.mod_approved: moderation_pb2.MODERATION_REVIEW_STATE_MOD_APPROVED,
    ModerationReviewState.mod_rejected: moderation_pb2.MODERATION_REVIEW_STATE_MOD_REJECTED,
    ModerationReviewState.mod_deleted: moderation_pb2.MODERATION_REVIEW_STATE_MOD_DELETED,
}

objecttype2sql = {
    moderation_pb2.OBJECT_TYPE_UNSPECIFIED: None,
    moderation_pb2.OBJECT_TYPE_REFERENCE: ObjectType.reference,
    moderation_pb2.OBJECT_TYPE_FRIEND_RELATIONSHIP: ObjectType.friend_relationship,
    moderation_pb2.OBJECT_TYPE_GROUP_CHAT: ObjectType.group_chat,
    moderation_pb2.OBJECT_TYPE_MESSAGE: ObjectType.message,
    moderation_pb2.OBJECT_TYPE_HOST_REQUEST: ObjectType.host_request,
    moderation_pb2.OBJECT_TYPE_UPLOAD: ObjectType.upload,
    moderation_pb2.OBJECT_TYPE_PAGE: ObjectType.page,
    moderation_pb2.OBJECT_TYPE_EVENT: ObjectType.event,
    moderation_pb2.OBJECT_TYPE_EVENT_OCCURRENCE: ObjectType.event_occurrence,
    moderation_pb2.OBJECT_TYPE_EVENT_COMMUNITY_INVITE_REQUEST: ObjectType.event_community_invite_request,
    moderation_pb2.OBJECT_TYPE_DISCUSSION: ObjectType.discussion,
    moderation_pb2.OBJECT_TYPE_COMMENT: ObjectType.comment,
    moderation_pb2.OBJECT_TYPE_REPLY: ObjectType.reply,
}

objecttype2api = {
    None: moderation_pb2.OBJECT_TYPE_UNSPECIFIED,
    ObjectType.reference: moderation_pb2.OBJECT_TYPE_REFERENCE,
    ObjectType.friend_relationship: moderation_pb2.OBJECT_TYPE_FRIEND_RELATIONSHIP,
    ObjectType.group_chat: moderation_pb2.OBJECT_TYPE_GROUP_CHAT,
    ObjectType.message: moderation_pb2.OBJECT_TYPE_MESSAGE,
    ObjectType.host_request: moderation_pb2.OBJECT_TYPE_HOST_REQUEST,
    ObjectType.upload: moderation_pb2.OBJECT_TYPE_UPLOAD,
    ObjectType.page: moderation_pb2.OBJECT_TYPE_PAGE,
    ObjectType.event: moderation_pb2.OBJECT_TYPE_EVENT,
    ObjectType.event_occurrence: moderation_pb2.OBJECT_TYPE_EVENT_OCCURRENCE,
    ObjectType.event_community_invite_request: moderation_pb2.OBJECT_TYPE_EVENT_COMMUNITY_INVITE_REQUEST,
    ObjectType.discussion: moderation_pb2.OBJECT_TYPE_DISCUSSION,
    ObjectType.comment: moderation_pb2.OBJECT_TYPE_COMMENT,
    ObjectType.reply: moderation_pb2.OBJECT_TYPE_REPLY,
}

objecttypesql2model = {
    None: None,
    ObjectType.reference: Reference,
    ObjectType.friend_relationship: FriendRelationship,
    ObjectType.group_chat: GroupChat,
    ObjectType.message: Message,
    ObjectType.host_request: HostRequest,
    ObjectType.upload: Upload,
    ObjectType.page: Page,
    ObjectType.event: Event,
    ObjectType.event_occurrence: EventOccurrence,
    ObjectType.event_community_invite_request: EventCommunityInviteRequest,
    ObjectType.discussion: Discussion,
    ObjectType.comment: Comment,
    ObjectType.reply: Reply,
}

objecttypesmodel2sql = {
    None: None,
    Reference: ObjectType.reference,
    FriendRelationship: ObjectType.friend_relationship,
    GroupChat: ObjectType.group_chat,
    Message: ObjectType.message,
    HostRequest: ObjectType.host_request,
    Upload: ObjectType.upload,
    Page: ObjectType.page,
    Event: ObjectType.event,
    EventOccurrence: ObjectType.event_occurrence,
    EventCommunityInviteRequest: ObjectType.event_community_invite_request,
    Discussion: ObjectType.discussion,
    Comment: ObjectType.comment,
    Reply: ObjectType.reply,
}

moderation_content_notification_handlers = {
    None: None,
    # These are done when implementing support, each of them receiving the object instance
    # Reference: SendReferenceNotification,
    # FriendRelationship: SendFriendRelationshipNotification,
    # GroupChat: SendGroupChatNotification,
    # Message: SendMessageNotification,
    # HostRequest: SendHostRequestNotification,
    # Upload: SendUploadNotification,
    # Page: SendPageNotification,
    # Event: SendEventNotification,
    # EventOccurrence: SendEventOccurrenceNotification,
    # EventCommunityInviteRequest: SendEventCommunityInviteRequestNotification,
    # Discussion: SendDiscussionNotification,
    # Comment: SendCommentNotification,
    # Reply: SendReplyNotification,
}


def _CreateModerationEntryFromObject(
    object_id,
    object_model,
    author_id,
    review_state=ModerationReviewState.machine_pending,
    visibility_state=ModerationVisibilityState.hidden,
    sent_to_machine_review=False,
    sent_content_notification=False,
    primary_key_fieldname="id",
):
    if _GetContentObject(object_id, object_model, primary_key_fieldname) is None:
        return None

    with session_scope() as session:
        entry = Moderation(
            object_id=object_id,
            object_type=objecttypesmodel2sql[object_model],
            author_id=author_id,
            visibility_state=visibility_state,
            review_state=review_state,
            sent_to_machine_review=sent_to_machine_review,
            sent_content_notification=sent_content_notification,
        )

        session.add(entry)
        session.flush()

    return entry


def _GetContentObject(object_id, model, primary_key_fieldname):
    with session_scope() as session:
        pk_attr = getattr(model, primary_key_fieldname, None)
        if pk_attr is None:
            raise AttributeError(f"Model {model.__name__} has no attribute '{primary_key_fieldname}'")

        result = session.execute(select(model).where(pk_attr == object_id)).scalar_one_or_none()

        return result[0] if result is not None else None


def _GetContentObjectFromModerationEntry(entry, primary_key_fieldname="id"):
    model = objecttypesql2model.get(entry.object_type)
    if model is None:
        return None

    return _GetContentObject(entry.object_id, model, primary_key_fieldname)


def _SendModerationContentNotification(entry):
    # Handles per content notifications, each having a different handler

    obj = _GetContentObjectFromModerationEntry(entry)
    if obj is None:
        return

    model = objecttypesql2model[entry.object_type]
    handler = moderation_content_notification_handlers[model]

    if handler is not None and obj is not None:
        handler(obj)

    with session_scope() as session:
        entry.sent_content_notification = True


class Moderations(moderation_pb2_grpc.ModerationsServicer):
    def ListModerationEntries(self, request, context, session):
        query = select(Moderation)

        if request.visibility_states:
            filter_visibility = [
                visibilitystate2sql[state]
                for state in request.visibility_states
                if state in visibilitystate2sql and state != moderation_pb2.MODERATION_VISIBILITY_STATE_UNSPECIFIED
            ]
            if filter_visibility:
                query = query.where(Moderation.visibility_state.in_(filter_visibility))

        if request.review_states:
            filter_review = [
                reviewstate2sql[state]
                for state in request.review_states
                if state in reviewstate2sql and state != moderation_pb2.MODERATION_REVIEW_STATE_UNSPECIFIED
            ]
            if filter_review:
                query = query.where(Moderation.review_state.in_(filter_review))

        if request.object_types:
            filter_types = [
                objecttype2sql[obj_type]
                for obj_type in request.object_types
                if obj_type in objecttype2sql and obj_type != moderation_pb2.OBJECT_TYPE_UNSPECIFIED
            ]
            if filter_types:
                query = query.where(Moderation.object_type.in_(filter_types))

        if request.author_id:
            query = query.where(Moderation.author_id == request.author_id)

        results = session.execute(query.order_by(Moderation.created.desc())).all()

        return moderation_pb2.ListModerationEntriesRes(
            entries=[
                moderation_pb2.ModerationEntry(
                    id=entry.id,
                    object_type=objecttype2api[entry.object_type],
                    object_id=entry.object_id,
                    author_id=entry.author_id,
                    review_state=reviewstate2api[entry.review_state],
                    visibility_state=visibilitystate2api[entry.visibility_state],
                )
                for entry in results
            ]
        )

    def GetModerationEntry(self, request, context, session):
        entry = session.execute(select(Moderation).where(Moderation.id == request.id)).scalar_one_or_none()

        if entry is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"No moderation entry with id {request.id}")

        return moderation_pb2.ModerationEntry(
            id=entry.id,
            object_type=objecttype2api[entry.object_type],
            object_id=entry.object_id,
            author_id=entry.author_id,
            review_state=reviewstate2api[entry.review_state],
            visibility_state=visibilitystate2api[entry.visibility_state],
        )

    def GetModerationEntryByObject(self, request, context, session):
        entry = session.execute(
            select(Moderation)
            .where(Moderation.object_id == request.object_id)
            .where(Moderation.object_type == request.object_type)
        ).scalar_one_or_none()

        if entry is None:
            context.abort(
                grpc.StatusCode.NOT_FOUND, f"No moderation entry for object {request.object_type}: {request.object_id}"
            )

        return moderation_pb2.ModerationEntry(
            id=entry.id,
            object_id=entry.object_id,
            author_id=entry.author_id,
            object_type=objecttype2api[entry.object_type],
            review_state=reviewstate2api[entry.review_state],
            visibility_state=visibilitystate2api[entry.visibility_state],
        )

    def ApproveModeratedContent(self, request, context, session):
        entry = session.execute(select(Moderation).where(Moderation.id == request.id)).scalar_one_or_none()

        if entry is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"No moderation entry with id {request.id}")

        if entry.review_state != ModerationReviewState.mod_pending:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Entry not pending moderator review")

        if not entry.sent_content_notification:
            _SendModerationContentNotification(entry)

        prev_state = entry.review_state
        entry.review_state = ModerationReviewState.mod_approved
        entry.visibility_state = ModerationVisibilityState.visible

        action = ModerationReviewAction(
            moderation_id=entry.id,
            moderator_id=context.user_id,
            reason=None,
            from_state=prev_state,
            to_state=entry.review_state,
        )

        session.add(action)

        return empty_pb2.Empty()

    def RejectModeratedContent(self, request, context, session):
        entry = session.execute(select(Moderation).where(Moderation.id == request.id)).scalar_one_or_none()

        if entry is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"No moderation entry with id {request.id}")

        if entry.review_state != ModerationReviewState.mod_pending:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Entry not pending moderator review")

        prev_state = entry.review_state
        entry.review_state = ModerationReviewState.mod_rejected
        entry.visibility_state = ModerationVisibilityState.hidden

        action = ModerationReviewAction(
            moderation_id=entry.id,
            moderator_id=context.user_id,
            reason=request.rejection_reason,
            from_state=prev_state,
            to_state=entry.review_state,
        )

        session.add(action)

        return empty_pb2.Empty()

    def DeleteModeratedContent(self, request, context, session):
        entry = session.execute(select(Moderation).where(Moderation.id == request.id)).scalar_one_or_none()

        if entry is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"No moderation entry with id {request.id}")

        prev_state = entry.review_state
        entry.review_state = ModerationReviewState.mod_deleted
        entry.visibility_state = ModerationVisibilityState.deleted

        action = ModerationReviewAction(
            moderation_id=entry.id,
            moderator_id=context.user_id,
            reason=request.deletion_reason,
            from_state=prev_state,
            to_state=entry.review_state,
        )
        
        session.add(action)

        return empty_pb2.Empty()
