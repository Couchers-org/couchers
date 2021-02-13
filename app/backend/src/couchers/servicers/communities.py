import logging

import grpc
from sqlalchemy.sql import literal

from couchers import errors
from couchers.db import session_scope
from couchers.models.communities import Cluster, Discussion, Node, Page, PageType
from couchers.models.core import User
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.servicers.threads import pack_thread_id
from couchers.utils import Timestamp_from_datetime
from pb import communities_pb2, communities_pb2_grpc, groups_pb2

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(node_id, user_id):
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
                    slug=cluster.slug,
                    description=cluster.description,
                )
            )
            for node_id, parent_node_id, level, cluster in parents
        ]


def community_to_pb(node: Node, user_id):
    return communities_pb2.Community(
        community_id=node.id,
        name=node.official_cluster.name,
        slug=node.official_cluster.slug,
        description=node.official_cluster.description,
        created=Timestamp_from_datetime(node.created),
        parents=_parents_to_pb(node.id, user_id),
        main_page=page_to_pb(node.official_cluster.main_page, user_id),
        member=node.official_cluster.members.filter(User.id == user_id).first() is not None,
        admin=node.official_cluster.admins.filter(User.id == user_id).first() is not None,
        member_count=node.official_cluster.members.count(),
        admin_count=node.official_cluster.admins.count(),
        thread_id=pack_thread_id(node.official_cluster.thread_id, 0),
    )


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetCommunity(self, request, context):
        with session_scope() as session:
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            return community_to_pb(node, context.user_id)

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
                communities=[community_to_pb(node, context.user_id) for node in nodes[:page_size]],
                next_page_token=str(nodes[-1].id) if len(nodes) > page_size else None,
            )

    def ListGroups(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
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
                groups=[group_to_pb(cluster, context.user_id) for cluster in clusters[:page_size]],
                next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
            )

    def ListAdmins(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_admin_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            admins = (
                node.official_cluster.admins.filter(User.id >= next_admin_id)
                .order_by(User.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListAdminsRes(
                admin_user_ids=[admin.id for admin in admins[:page_size]],
                next_page_token=str(admins[-1].id) if len(admins) > page_size else None,
            )

    def ListMembers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_member_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            members = (
                node.official_cluster.members.filter(User.id >= next_member_id)
                .order_by(User.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListMembersRes(
                member_user_ids=[member.id for member in members[:page_size]],
                next_page_token=str(members[-1].id) if len(members) > page_size else None,
            )

    def ListNearbyUsers(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_nearby_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            nearbys = (
                node.contained_users.filter(User.id >= next_nearby_id).order_by(User.id).limit(page_size + 1).all()
            )
            return communities_pb2.ListNearbyUsersRes(
                nearby_user_ids=[nearby.id for nearby in nearbys[:page_size]],
                next_page_token=str(nearbys[-1].id) if len(nearbys) > page_size else None,
            )

    def ListPlaces(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            places = (
                node.official_cluster.owned_pages.filter(Page.type == PageType.place)
                .filter(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListPlacesRes(
                places=[page_to_pb(page, context.user_id) for page in places[:page_size]],
                next_page_token=str(places[-1].id) if len(places) > page_size else None,
            )

    def ListGuides(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            guides = (
                node.official_cluster.owned_pages.filter(Page.type == PageType.guide)
                .filter(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListGuidesRes(
                guides=[page_to_pb(page, context.user_id) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )

    def ListEvents(self, request, context):
        raise NotImplementedError()
        return communities_pb2.ListEventsRes()

    def ListDiscussions(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.query(Node).filter(Node.id == request.community_id).one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            discussions = (
                node.official_cluster.owned_discussions.filter(Discussion.id >= next_page_id)
                .order_by(Discussion.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListDiscussionsRes(
                discussions=[discussion_to_pb(discussion, context.user_id) for discussion in discussions[:page_size]],
                next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
            )
