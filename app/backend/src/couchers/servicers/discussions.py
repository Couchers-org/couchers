import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext, make_background_user_context
from couchers.db import can_moderate_node, session_scope
from couchers.event_log import log_event
from couchers.jobs.enqueue import queue_job
from couchers.models import Cluster, ClusterSubscription, Discussion, ModerationObjectType, Thread, User
from couchers.models.notifications import NotificationTopicAction
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import notify
from couchers.proto import discussions_pb2, discussions_pb2_grpc, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import is_not_visible
from couchers.servicers.threads import thread_to_pb
from couchers.sql import where_moderated_content_visible
from couchers.utils import Timestamp_from_datetime, now

logger = logging.getLogger(__name__)

MAX_PAGE_SIZE = 25


def discussion_to_pb(session: Session, discussion: Discussion, context: CouchersContext) -> discussions_pb2.Discussion:
    owner_community_id = None
    owner_group_id = None
    if discussion.owner_cluster.is_official_cluster:
        owner_community_id = discussion.owner_cluster.parent_node_id
    else:
        owner_group_id = discussion.owner_cluster.id

    if discussion.deleted is not None:
        return discussions_pb2.Discussion(
            discussion_id=discussion.id,
            slug=discussion.slug,
            deleted=True,
            owner_community_id=owner_community_id,
            owner_group_id=owner_group_id,
            owner_title=discussion.owner_cluster.name,
            thread=thread_to_pb(session, context, discussion.thread_id),
        )

    can_moderate = can_moderate_node(session, context.user_id, discussion.owner_cluster.parent_node_id)

    return discussions_pb2.Discussion(
        discussion_id=discussion.id,
        slug=discussion.slug,
        created=Timestamp_from_datetime(discussion.created),
        creator_user_id=discussion.creator_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        owner_title=discussion.owner_cluster.name,
        title=discussion.title,
        content=discussion.content,
        thread=thread_to_pb(session, context, discussion.thread_id),
        can_moderate=can_moderate,
        can_edit=(context.user_id == discussion.creator_user_id),
        last_edited=Timestamp_from_datetime(discussion.last_edited) if discussion.last_edited else None,
    )


def generate_create_discussion_notifications(payload: jobs_pb2.GenerateCreateDiscussionNotificationsPayload) -> None:
    with session_scope() as session:
        discussion = session.execute(select(Discussion).where(Discussion.id == payload.discussion_id)).scalar_one()

        cluster = discussion.owner_cluster

        if not cluster.is_official_cluster:
            raise NotImplementedError("Shouldn't have discussions under groups, only communities")

        for user in list(cluster.members.where(User.is_visible)):
            if is_not_visible(session, user.id, discussion.creator_user_id):
                continue
            context = make_background_user_context(user_id=user.id)
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.discussion__create,
                key=str(payload.discussion_id),
                data=notification_data_pb2.DiscussionCreate(
                    author=user_model_to_pb(discussion.creator_user, session, context),
                    discussion=discussion_to_pb(session, discussion, context),
                ),
                moderation_state_id=discussion.moderation_state_id,
            )


class Discussions(discussions_pb2_grpc.DiscussionsServicer):
    def CreateDiscussion(
        self, request: discussions_pb2.CreateDiscussionReq, context: CouchersContext, session: Session
    ) -> discussions_pb2.Discussion:
        if not request.title:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_title")
        if not request.content:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_content")
        if not request.owner_community_id and not request.owner_group_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "group_or_community_not_found")

        if request.WhichOneof("owner") == "owner_group_id":
            cluster = session.execute(
                select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.owner_group_id)
            ).scalar_one_or_none()
        elif request.WhichOneof("owner") == "owner_community_id":
            cluster = session.execute(
                select(Cluster)
                .where(Cluster.parent_node_id == request.owner_community_id)
                .where(Cluster.is_official_cluster)
            ).scalar_one_or_none()

        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_or_community_not_found")

        if not cluster.small_community_features_enabled:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cannot_create_discussion")

        thread = Thread()
        session.add(thread)
        session.flush()

        discussion: Discussion | None = None

        def create_object(moderation_state_id: int) -> int:
            nonlocal discussion
            discussion = Discussion(
                title=request.title,
                content=request.content,
                creator_user_id=context.user_id,
                owner_cluster_id=cluster.id,
                thread_id=thread.id,
                moderation_state_id=moderation_state_id,
            )
            session.add(discussion)
            session.flush()
            return discussion.id

        create_moderation(
            session=session,
            object_type=ModerationObjectType.discussion,
            object_id=create_object,
            creator_user_id=context.user_id,
        )
        assert discussion is not None

        log_event(
            context,
            session,
            "discussion.created",
            {
                "discussion_id": discussion.id,
                "cluster_id": cluster.id,
                "cluster_name": cluster.name,
                "is_official_cluster": cluster.is_official_cluster,
            },
        )

        queue_job(
            session,
            job=generate_create_discussion_notifications,
            payload=jobs_pb2.GenerateCreateDiscussionNotificationsPayload(
                discussion_id=discussion.id,
            ),
        )

        return discussion_to_pb(session, discussion, context)

    def GetDiscussion(
        self, request: discussions_pb2.GetDiscussionReq, context: CouchersContext, session: Session
    ) -> discussions_pb2.Discussion:
        discussion = session.execute(
            where_moderated_content_visible(
                select(Discussion).where(Discussion.id == request.discussion_id),
                context,
                Discussion,
            )
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")

        return discussion_to_pb(session, discussion, context)

    def UpdateDiscussion(
        self, request: discussions_pb2.UpdateDiscussionReq, context: CouchersContext, session: Session
    ) -> discussions_pb2.Discussion:
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")
        if discussion.deleted is not None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "discussion_deleted")
        if context.user_id != discussion.creator_user_id:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "discussion_edit_permission_denied")

        updated = False

        if request.HasField("title"):
            new_title = request.title.value.strip()
            if not new_title:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_title")
            discussion.title = new_title
            updated = True

        if request.HasField("content"):
            new_content = request.content.value.strip()
            if not new_content:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_content")
            discussion.content = new_content
            updated = True

        if not updated:
            return discussion_to_pb(session, discussion, context)

        discussion.last_edited = now()

        log_event(
            context,
            session,
            "discussion.updated",
            {
                "discussion_id": discussion.id,
            },
        )

        return discussion_to_pb(session, discussion, context)

    def DeleteDiscussion(
        self, request: discussions_pb2.DeleteDiscussionReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")
        if discussion.deleted is not None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "discussion_deleted")

        if context.user_id != discussion.creator_user_id:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "discussion_delete_permission_denied")

        discussion.deleted = now()

        log_event(
            context,
            session,
            "discussion.deleted",
            {
                "discussion_id": discussion.id,
            },
        )

        return empty_pb2.Empty()

    def ListMyCommunitiesDiscussions(
        self, request: discussions_pb2.ListMyCommunitiesDiscussionsReq, context: CouchersContext, session: Session
    ) -> discussions_pb2.ListMyCommunitiesDiscussionsRes:
        page_size = min(MAX_PAGE_SIZE, request.page_size or MAX_PAGE_SIZE)
        next_page_id = int(request.page_token) if request.page_token else 2**63 - 1

        discussions = (
            session.execute(
                where_moderated_content_visible(
                    select(Discussion)
                    .join(Cluster, Cluster.id == Discussion.owner_cluster_id)
                    .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                    .where(ClusterSubscription.user_id == context.user_id)
                    .where(Cluster.is_official_cluster)
                    .where(Cluster.small_community_features_enabled)
                    .where(Discussion.id <= next_page_id)
                    .order_by(Discussion.id.desc())
                    .limit(page_size + 1),
                    context,
                    Discussion,
                    is_list_operation=True,
                )
            )
            .scalars()
            .all()
        )

        return discussions_pb2.ListMyCommunitiesDiscussionsRes(
            discussions=[discussion_to_pb(session, d, context) for d in discussions[:page_size]],
            next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
        )

    def UpdateDiscussion(
        self, request: discussions_pb2.UpdateDiscussionReq, context: CouchersContext, session: Session
    ) -> discussions_pb2.Discussion:
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")
        if discussion.deleted is not None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "discussion_deleted")
        if context.user_id != discussion.creator_user_id:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "discussion_edit_permission_denied")

        if request.HasField("title"):
            new_title = request.title.value.strip()
            if not new_title:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_title")
            discussion.title = new_title

        if request.HasField("content"):
            new_content = request.content.value.strip()
            if not new_content:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_discussion_content")
            discussion.content = new_content

        discussion.last_edited = now()

        log_event(
            context,
            session,
            "discussion.updated",
            {
                "discussion_id": discussion.id,
            },
        )

        return discussion_to_pb(session, discussion, context)

    def DeleteDiscussion(
        self, request: discussions_pb2.DeleteDiscussionReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")
        if discussion.deleted is not None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "discussion_deleted")

        is_creator = context.user_id == discussion.creator_user_id
        is_moderator = can_moderate_node(session, context.user_id, discussion.owner_cluster.parent_node_id)
        if not is_creator and not is_moderator:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "discussion_delete_permission_denied")

        discussion.deleted = now()

        log_event(
            context,
            session,
            "discussion.deleted",
            {
                "discussion_id": discussion.id,
            },
        )

        return empty_pb2.Empty()
