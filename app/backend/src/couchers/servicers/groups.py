import logging

import grpc
from sqlalchemy.sql import literal

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, Node, Page, PageType, User
from couchers.servicers.pages import _page_to_pb
from couchers.utils import Timestamp_from_datetime, slugify
from pb import groups_pb2, groups_pb2_grpc

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


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
        member=cluster.members.filter(User.id == user_id).first() is not None,
        admin=cluster.admins.filter(User.id == user_id).first() is not None,
        member_count=cluster.members.count(),
        admin_count=cluster.admins.count(),
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

    def ListAdmins(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_admin_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            admins = cluster.admins.filter(User.id >= next_admin_id).order_by(User.id).limit(page_size + 1).all()
            return groups_pb2.ListAdminsRes(
                admin_user_ids=[admin.id for admin in admins[:page_size]],
                next_page_token=str(admins[-1].id) if len(admins) > page_size else None,
            )

    def ListMembers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_member_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            members = cluster.members.filter(User.id >= next_member_id).order_by(User.id).limit(page_size + 1).all()
            return groups_pb2.ListMembersRes(
                member_user_ids=[member.id for member in members[:page_size]],
                next_page_token=str(members[-1].id) if len(members) > page_size else None,
            )

    def ListPlaces(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            places = (
                cluster.owned_pages.filter(Page.type == PageType.point_of_interest)
                .filter(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return groups_pb2.ListPlacesRes(
                places=[_page_to_pb(page, context.user_id) for page in places[:page_size]],
                next_page_token=str(places[-1].id) if len(places) > page_size else None,
            )

    def ListGuides(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(Cluster.official_cluster_for_node_id == None)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            guides = (
                cluster.owned_pages.filter(Page.type == PageType.guide)
                .filter(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return groups_pb2.ListGuidesRes(
                guides=[_page_to_pb(page, context.user_id) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )

    def ListEvents(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListEventsRes()

    def ListDiscussions(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListDiscussionsRes()
