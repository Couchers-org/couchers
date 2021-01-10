import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node, Page
from couchers.servicers.pages import _page_to_pb  # TODO
from couchers.utils import Timestamp_from_datetime, slugify
from pb import groups_pb2, groups_pb2_grpc

logger = logging.getLogger(__name__)


def _parents_to_pb(cluster: Cluster):
    return []


def _group_to_pb(cluster: Cluster):
    return groups_pb2.Group(
        group_id=cluster.id,
        name=cluster.name,
        slug=slugify(cluster.name),
        description=cluster.description,
        created=Timestamp_from_datetime(cluster.created),
        parents=_parents_to_pb(cluster),  # TODO
        main_page=_page_to_pb(cluster.main_page),
    )


class Groups(groups_pb2_grpc.GroupsServicer):
    def GetGroup(self, request, context):
        with session_scope() as session:
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)  # not an official group
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)

            return _group_to_pb(cluster)

    def ListMembers(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListMembersRes()

    def ListPages(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListPagesRes()

    def ListDiscussions(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListDiscussionsRes()
