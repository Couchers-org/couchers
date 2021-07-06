import grpc

from couchers import errors
from couchers.sql import couchers_select as select
from couchers.db import can_moderate_node, session_scope
from couchers.models import Cluster, Discussion, Thread
from couchers.servicers.threads import thread_to_pb
from couchers.utils import Timestamp_from_datetime
from proto import discussions_pb2, discussions_pb2_grpc


def discussion_to_pb(discussion: Discussion, context):
    owner_community_id = None
    owner_group_id = None
    if discussion.owner_cluster.is_official_cluster:
        owner_community_id = discussion.owner_cluster.parent_node_id
    else:
        owner_group_id = discussion.owner_cluster.id

    with session_scope() as session:
        can_moderate = can_moderate_node(session, context.user_id, discussion.owner_cluster.parent_node_id)

    return discussions_pb2.Discussion(
        discussion_id=discussion.id,
        slug=discussion.slug,
        created=Timestamp_from_datetime(discussion.created),
        creator_user_id=discussion.creator_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        title=discussion.title,
        content=discussion.content,
        thread=thread_to_pb(discussion.thread_id),
        can_moderate=can_moderate,
    )


class Discussions(discussions_pb2_grpc.DiscussionsServicer):
    def CreateDiscussion(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_DISCUSSION_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_DISCUSSION_CONTENT)
        if not request.owner_community_id and not request.owner_group_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

        with session_scope() as session:
            if request.WhichOneof("owner") == "owner_group_id":
                cluster = session.execute(
                    select(Cluster).filter(~Cluster.is_official_cluster).filter(Cluster.id == request.owner_group_id)
                ).scalar_one_or_none()
            elif request.WhichOneof("owner") == "owner_community_id":
                cluster = session.execute(
                    select(Cluster)
                    .filter(Cluster.parent_node_id == request.owner_community_id)
                    .filter(Cluster.is_official_cluster)
                ).scalar_one_or_none()

            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

            discussion = Discussion(
                title=request.title,
                content=request.content,
                creator_user_id=context.user_id,
                owner_cluster=cluster,
                thread=Thread(),
            )
            session.add(discussion)
            session.commit()
            return discussion_to_pb(discussion, context)

    def GetDiscussion(self, request, context):
        with session_scope() as session:
            discussion = session.execute(
                select(Discussion).filter(Discussion.id == request.discussion_id)
            ).scalar_one_or_none()
            if not discussion:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.DISCUSSION_NOT_FOUND)

            return discussion_to_pb(discussion, context)
