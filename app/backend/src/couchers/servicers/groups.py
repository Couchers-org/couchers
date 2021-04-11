import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import literal

from couchers import errors
from couchers.db import can_moderate_node, get_node_parents_recursively, session_scope
from couchers.models import Cluster, ClusterRole, ClusterSubscription, Discussion, Node, Page, PageType, User
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.servicers.threads import pack_thread_id
from couchers.utils import Timestamp_from_datetime
from pb import groups_pb2, groups_pb2_grpc

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(cluster: Cluster, user_id):
    with session_scope() as session:
        parents = get_node_parents_recursively(session, cluster.parent_node_id)
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
        ] + [
            groups_pb2.Parent(
                group=groups_pb2.GroupParent(
                    group_id=cluster.id,
                    name=cluster.name,
                    slug=cluster.slug,
                    description=cluster.description,
                )
            )
        ]


def group_to_pb(cluster: Cluster, user_id):
    with session_scope() as session:
        can_moderate = can_moderate_node(session, user_id, cluster.parent_node_id)

    return groups_pb2.Group(
        group_id=cluster.id,
        name=cluster.name,
        slug=cluster.slug,
        description=cluster.description,
        created=Timestamp_from_datetime(cluster.created),
        parents=_parents_to_pb(cluster, user_id),
        main_page=page_to_pb(cluster.main_page, user_id),
        member=cluster.members.filter(User.id == user_id).one_or_none() is not None,
        admin=cluster.admins.filter(User.id == user_id).one_or_none() is not None,
        member_count=cluster.members.count(),
        admin_count=cluster.admins.count(),
        can_moderate=can_moderate,
    )


class Groups(groups_pb2_grpc.GroupsServicer):
    def GetGroup(self, request, context):
        with session_scope() as session:
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)  # not an official group
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)

            return group_to_pb(cluster, context.user_id)

    def ListAdmins(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_admin_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            admins = (
                cluster.admins.filter(User.is_visible)
                .filter(User.id >= next_admin_id)
                .order_by(User.id)
                .limit(page_size + 1)
                .all()
            )
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
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            members = (
                cluster.members.filter(User.is_visible)
                .filter(User.id >= next_member_id)
                .order_by(User.id)
                .limit(page_size + 1)
                .all()
            )
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
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)
            places = (
                cluster.owned_pages.filter(Page.type == PageType.place)
                .filter(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return groups_pb2.ListPlacesRes(
                places=[page_to_pb(page, context.user_id) for page in places[:page_size]],
                next_page_token=str(places[-1].id) if len(places) > page_size else None,
            )

    def ListGuides(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
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
                guides=[page_to_pb(page, context.user_id) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )

    def ListEvents(self, request, context):
        raise NotImplementedError()
        return groups_pb2.ListEventsRes()

    def ListDiscussions(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            discussions = (
                cluster.owned_discussions.filter(Discussion.id >= next_page_id)
                .order_by(Discussion.id)
                .limit(page_size + 1)
                .all()
            )
            return groups_pb2.ListDiscussionsRes(
                discussions=[discussion_to_pb(discussion, context.user_id) for discussion in discussions[:page_size]],
                next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
            )

    def JoinGroup(self, request, context):
        with session_scope() as session:
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)

            user_in_group = cluster.members.filter(User.id == context.user_id).one_or_none()
            if user_in_group:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_IN_GROUP)

            user_visible = session.query(User).filter(User.is_visible).filter(User.id == context.user_id).one_or_none()
            if not user_visible:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            cluster.cluster_subscriptions.append(
                ClusterSubscription(
                    user_id=context.user_id,
                    role=ClusterRole.member,
                )
            )

            return empty_pb2.Empty()

    def LeaveGroup(self, request, context):
        with session_scope() as session:
            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)

            user_in_group_and_visible = (
                cluster.members.filter(User.is_visible).filter(User.id == context.user_id).one_or_none()
            )
            if not user_in_group_and_visible:
                user_in_group = cluster.members.filter(User.id == context.user_id).one_or_none()
                if not user_in_group:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NOT_IN_GROUP)
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            session.query(ClusterSubscription).filter(ClusterSubscription.user_id == context.user_id).delete()

            return empty_pb2.Empty()

    def ListUserGroups(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_cluster_id = int(request.page_token) if request.page_token else 0
            user_id = request.user_id or context.user_id
            clusters = (
                session.query(Cluster)
                .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                .filter(ClusterSubscription.user_id == user_id)
                .filter(~Cluster.is_official_cluster)  # not an official group
                .filter(Cluster.id >= next_cluster_id)
                .order_by(Cluster.id)
                .limit(page_size + 1)
                .all()
            )
            return groups_pb2.ListUserGroupsRes(
                groups=[group_to_pb(cluster, user_id) for cluster in clusters[:page_size]],
                next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
            )
