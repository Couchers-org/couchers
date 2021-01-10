import logging

import grpc
from sqlalchemy.sql import literal

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node
from couchers.servicers.groups import _group_to_pb
from couchers.servicers.pages import _page_to_pb
from couchers.utils import Timestamp_from_datetime, slugify
from pb import communities_pb2, communities_pb2_grpc, groups_pb2

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(node_id):
    with session_scope() as session:
        top = (
            session.query(Node.id, Node.parent_node_id, literal(0).label("level"))
            .filter(Node.id == node_id)
            .cte("parents", recursive=True)
        )
        subquery = session.query(
            top.union(
                session.query(Node.id, Node.parent_node_id, (top.c.level + 1).label("level")).join(
                    top, Node.id == top.c.parent_node_id
                )
            )
        ).subquery()
        parents = (
            session.query(subquery, Cluster)
            .join(Cluster, Cluster.official_cluster_for_node_id == subquery.c.id)
            .order_by(subquery.c.level.desc())
            .all()
        )
        return [
            groups_pb2.Parent(
                community=groups_pb2.CommunityParent(
                    community_id=node_id,
                    name=cluster.name,
                    slug=slugify(cluster.name),
                    description=cluster.name,
                )
            )
            for node_id, parent_node_id, level, cluster in parents
        ]


def _community_to_pb(node: Node, user_id):
    return communities_pb2.Community(
        community_id=node.id,
        name=node.official_cluster.name,
        slug=slugify(node.official_cluster.name),
        description=node.official_cluster.description,
        created=Timestamp_from_datetime(node.created),
        parents=_parents_to_pb(node.id),
        main_page=_page_to_pb(node.official_cluster.main_page, user_id),
        # is_member=,  # TODO
        # is_admin=,  # TODO
    )


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetCommunity(self, request, context):
        with session_scope() as session:
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            return _community_to_pb(node, context.user_id)

    def ListCommunities(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_node_id = int(request.page_token) if request.page_token else 0
            nodes = (
                session.query(Node)
                .filter(Node.parent_node_id == request.community_id)
                .filter(Node.id >= next_node_id)
                .order_by(Node.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListCommunitiesRes(
                communities=[_community_to_pb(node, context.user_id) for node in nodes[:page_size]],
                next_page_token=str(nodes[-1].id) if len(nodes) > page_size else None,
            )

    def ListGroups(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size if request.page_size else MAX_PAGINATION_LENGTH)
            next_cluster_id = int(request.page_token) if request.page_token else 0
            clusters = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)  # not an official group
                .filter(Cluster.parent_node_id == request.community_id)
                .filter(Cluster.id >= next_cluster_id)
                .order_by(Cluster.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListGroupsRes(
                groups=[_group_to_pb(cluster, context.user_id) for cluster in clusters[:page_size]],
                next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
            )

    def ListMembers(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListMembersRes()

    def ListPlaces(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListPlacesRes()

    def ListGuides(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListGuidesRes()

    def ListEvents(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListEventsRes()

    def ListDiscussions(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListDiscussionsRes()
