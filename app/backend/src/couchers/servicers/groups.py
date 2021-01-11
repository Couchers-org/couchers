import logging

import grpc
from sqlalchemy.sql import literal

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node, Page
from couchers.servicers.pages import _page_to_pb  # TODO
from couchers.utils import Timestamp_from_datetime, slugify
from pb import groups_pb2, groups_pb2_grpc

logger = logging.getLogger(__name__)


def _parents_to_pb(cluster: Cluster, user_id):
    with session_scope() as session:
        top = (
            session.query(Node.id, Node.parent_node_id, literal(0).label("level"))
            .filter(Node.id == cluster.parent_node_id)
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
        ] + [
            groups_pb2.Parent(
                group=groups_pb2.GroupParent(
                    group_id=cluster.id,
                    name=cluster.name,
                    slug=slugify(cluster.name),
                    description=cluster.name,
                )
            )
        ]


def _group_to_pb(cluster: Cluster, user_id):
    return groups_pb2.Group(
        group_id=cluster.id,
        name=cluster.name,
        slug=slugify(cluster.name),
        description=cluster.description,
        created=Timestamp_from_datetime(cluster.created),
        parents=_parents_to_pb(cluster, user_id),
        main_page=_page_to_pb(cluster.main_page, user_id),
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

            return _group_to_pb(cluster, context.user_id)

    def ListMembers(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListMembersRes()

    def ListPages(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListPagesRes()

    def ListDiscussions(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListDiscussionsRes()
