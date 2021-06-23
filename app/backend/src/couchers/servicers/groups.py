import logging

import grpc
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import can_moderate_node, get_node_parents_recursively, session_scope
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Discussion,
    Event,
    EventOccurence,
    Page,
    PageType,
    User,
)
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.events import event_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.utils import Timestamp_from_datetime
from proto import groups_pb2, groups_pb2_grpc

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(cluster: Cluster):
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


def group_to_pb(cluster: Cluster, context):
    with session_scope() as session:
        can_moderate = can_moderate_node(session, context.user_id, cluster.parent_node_id)

        member_count = (
            session.query(ClusterSubscription)
            .filter_users_column(context, ClusterSubscription.user_id)
            .filter(ClusterSubscription.cluster_id == cluster.id)
            .count()
        )
        is_member = (
            session.query(ClusterSubscription)
            .filter(ClusterSubscription.user_id == context.user_id)
            .filter(ClusterSubscription.cluster_id == cluster.id)
            .one_or_none()
            is not None
        )

        admin_count = (
            session.query(ClusterSubscription)
            .filter_users_column(context, ClusterSubscription.user_id)
            .filter(ClusterSubscription.cluster_id == cluster.id)
            .filter(ClusterSubscription.role == ClusterRole.admin)
            .count()
        )
        is_admin = (
            session.query(ClusterSubscription)
            .filter(ClusterSubscription.user_id == context.user_id)
            .filter(ClusterSubscription.cluster_id == cluster.id)
            .filter(ClusterSubscription.role == ClusterRole.admin)
            .one_or_none()
            is not None
        )

    return groups_pb2.Group(
        group_id=cluster.id,
        name=cluster.name,
        slug=cluster.slug,
        description=cluster.description,
        created=Timestamp_from_datetime(cluster.created),
        parents=_parents_to_pb(cluster),
        main_page=page_to_pb(cluster.main_page, context),
        member=is_member,
        admin=is_admin,
        member_count=member_count,
        admin_count=admin_count,
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

            return group_to_pb(cluster, context)

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
                session.query(User)
                .filter_users(context)
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .filter(ClusterSubscription.cluster_id == cluster.id)
                .filter(ClusterSubscription.role == ClusterRole.admin)
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
                session.query(User)
                .filter_users(context)
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .filter(ClusterSubscription.cluster_id == cluster.id)
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
                places=[page_to_pb(page, context) for page in places[:page_size]],
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
                guides=[page_to_pb(page, context) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )

    def ListEvents(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

            cluster = (
                session.query(Cluster)
                .filter(~Cluster.is_official_cluster)
                .filter(Cluster.id == request.group_id)
                .one_or_none()
            )
            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_NOT_FOUND)

            occurences = (
                session.query(EventOccurence)
                .join(Event, Event.id == EventOccurence.event_id)
                .filter(Event.owner_cluster == cluster)
            )

            if not request.past:
                occurences = occurences.filter(EventOccurence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.asc()
                )
            else:
                occurences = occurences.filter(EventOccurence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurence.start_time.desc()
                )

            occurences = occurences.limit(page_size + 1).all()

            return events_pb2.ListEventsRes(
                events=[event_to_pb(occurence, context) for occurence in occurences[:page_size]],
                next_page_token=str(millis_from_dt(occurences[-1].end_time)) if len(occurences) > page_size else None,
            )

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
                discussions=[discussion_to_pb(discussion, context) for discussion in discussions[:page_size]],
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

            user_in_group = cluster.members.filter(User.id == context.user_id).one_or_none()
            if not user_in_group:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NOT_IN_GROUP)

            session.query(ClusterSubscription).filter(ClusterSubscription.cluster_id == request.group_id).filter(
                ClusterSubscription.user_id == context.user_id
            ).delete()

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
                groups=[group_to_pb(cluster, context) for cluster in clusters[:page_size]],
                next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
            )
