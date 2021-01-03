import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node
from couchers.utils import Timestamp_from_datetime, slugify
from pb import communities_pb2, communities_pb2_grpc

logger = logging.getLogger(__name__)


def _community_to_pb(node: Node):
    return communities_pb2.Community(
        community_id=node.id,
        name=node.official_cluster.name,
        slug=slugify(node.official_cluster.name),
        description=node.official_cluster.description,
        created=Timestamp_from_datetime(node.created),
        parent_community_ids=0,  # TODO
        main_page=_page_to_pb(node.main_page),
    )


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetCommunity(self, request, context):
        with session_scope() as session:
            node = session.query(Node).filter(Node.id == request.node_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            return _community_to_pb(node)

    def ListGroups(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListGroupsRes()

    def ListMembers(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListMembersRes()

    def ListPages(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListPagesRes()

    def ListDiscussions(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListDiscussionsRes()
