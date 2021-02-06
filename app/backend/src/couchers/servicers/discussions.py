import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Discussion, Node, Thread
from couchers.servicers.threads import pack_thread_id
from couchers.utils import Timestamp_from_datetime
from pb import discussions_pb2, discussions_pb2_grpc


def discussion_to_pb(discussion: Discussion, user_id):
    return discussions_pb2.Discussion(
        discussions_id=discussion.id,
        slug=current_version.slug,
        created=Timestamp_from_datetime(discussion.created),
        creator_user_id=discussion.creator_user_id,
        owner_group_id=discussion.owner_cluster.id
        if discussion.owner_cluster.official_cluster_for_node_id is None
        else None,
        owner_community_id=discussion.owner_cluster.official_cluster_for_node_id
        if discussion.owner_cluster.official_cluster_for_node_id is not None
        else None,
        title=current_version.title,
        content=current_version.content,
        thread_id=pack_thread_id(discussion.thread_id, 0),
    )


class Discussions(discussions_pb2_grpc.DiscussionsServicer):
    def CreateDiscussion(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_DISCUSSION_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_DISCUSSION_CONTENT)
        if not request.owner_community_id and not request.owner_group_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

        if request.WhichOneof("owner") == "owner_group_id":
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)
                .filter(Cluster.id == request.owner_group_id)
                .one_or_none()
            )
        elif request.WhichOneof("owner") == "owner_community_id":
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == request.owner_community_id)
                .one_or_none()
            )

        if not cluster:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

        with session_scope() as session:
            discussion = Discussion(
                title=request.title,
                content=request.content,
                creator_user_id=context.user_id,
                owner_cluster=cluster,
                thread=Thread(),
            )
            session.commit()
            return discussion_to_pb(discussion, context.user_id)

    def GetDiscussion(self, request, context):
        with session_scope() as session:
            discussion = session.query(Discussion).filter(Discussion.id == request.discussion_id).one_or_none()
            if not discussion:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.DISCUSSION_NOT_FOUND)

            return discussion_to_pb(discussion, context.user_id)
