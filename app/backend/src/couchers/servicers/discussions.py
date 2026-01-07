import logging

import grpc
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext, make_background_user_context
from couchers.db import can_moderate_node, session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import Cluster, Discussion, Thread, User
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import discussions_pb2, discussions_pb2_grpc, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import is_not_visible
from couchers.servicers.threads import thread_to_pb
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)


def discussion_to_pb(session: Session, discussion: Discussion, context: CouchersContext) -> discussions_pb2.Discussion:
    owner_community_id = None
    owner_group_id = None
    if discussion.owner_cluster.is_official_cluster:
        owner_community_id = discussion.owner_cluster.parent_node_id
    else:
        owner_group_id = discussion.owner_cluster.id

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
        thread=thread_to_pb(session, discussion.thread_id),
        can_moderate=can_moderate,
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

        if not cluster.discussions_enabled:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cannot_create_discussion")

        discussion = Discussion(
            title=request.title,
            content=request.content,
            creator_user_id=context.user_id,
            owner_cluster=cluster,
            thread=Thread(),
        )
        session.add(discussion)
        session.flush()

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
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")

        return discussion_to_pb(session, discussion, context)
