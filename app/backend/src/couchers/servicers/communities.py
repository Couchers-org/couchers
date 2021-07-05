import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import delete
from sqlalchemy.sql import func, or_

from couchers import errors
from couchers.couchers_select import couchers_select as select
from couchers.db import can_moderate_node, get_node_parents_recursively, session_scope
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Discussion,
    Event,
    EventOccurrence,
    Node,
    Page,
    PageType,
    User,
)
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.events import event_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.utils import Timestamp_from_datetime, dt_from_millis, millis_from_dt, now
from proto import communities_pb2, communities_pb2_grpc, groups_pb2

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(node_id):
    with session_scope() as session:
        parents = get_node_parents_recursively(session, node_id)
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


def community_to_pb(node: Node, context):
    with session_scope() as session:
        can_moderate = can_moderate_node(session, context.user_id, node.id)

        member_count = session.execute(
            select(func.count())
            .select_from(ClusterSubscription)
            .where_users_column_visible(context, ClusterSubscription.user_id)
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
        ).scalar_one()
        is_member = (
            session.execute(
                select(ClusterSubscription)
                .where(ClusterSubscription.user_id == context.user_id)
                .where(ClusterSubscription.cluster_id == node.official_cluster.id)
            ).scalar_one_or_none()
            is not None
        )

        admin_count = session.execute(
            select(func.count())
            .select_from(ClusterSubscription)
            .where_users_column_visible(context, ClusterSubscription.user_id)
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
            .where(ClusterSubscription.role == ClusterRole.admin)
        ).scalar_one()
        is_admin = (
            session.execute(
                select(ClusterSubscription)
                .where(ClusterSubscription.user_id == context.user_id)
                .where(ClusterSubscription.cluster_id == node.official_cluster.id)
                .where(ClusterSubscription.role == ClusterRole.admin)
            ).scalar_one_or_none()
            is not None
        )

    return communities_pb2.Community(
        community_id=node.id,
        name=node.official_cluster.name,
        slug=node.official_cluster.slug,
        description=node.official_cluster.description,
        created=Timestamp_from_datetime(node.created),
        parents=_parents_to_pb(node.id),
        member=is_member,
        admin=is_admin,
        member_count=member_count,
        admin_count=admin_count,
        main_page=page_to_pb(node.official_cluster.main_page, context),
        can_moderate=can_moderate,
    )


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetCommunity(self, request, context):
        with session_scope() as session:
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            return community_to_pb(node, context)

    def ListCommunities(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_node_id = int(request.page_token) if request.page_token else 0
            nodes = (
                session.execute(
                    select(Node)
                    .where(or_(Node.parent_node_id == request.community_id, request.community_id == 0))
                    .where(Node.id >= next_node_id)
                    .order_by(Node.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return communities_pb2.ListCommunitiesRes(
                communities=[community_to_pb(node, context) for node in nodes[:page_size]],
                next_page_token=str(nodes[-1].id) if len(nodes) > page_size else None,
            )

    def ListGroups(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_cluster_id = int(request.page_token) if request.page_token else 0
            clusters = (
                session.execute(
                    select(Cluster)
                    .where(~Cluster.is_official_cluster)  # not an official group
                    .where(Cluster.parent_node_id == request.community_id)
                    .where(Cluster.id >= next_cluster_id)
                    .order_by(Cluster.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return communities_pb2.ListGroupsRes(
                groups=[group_to_pb(cluster, context) for cluster in clusters[:page_size]],
                next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
            )

    def ListAdmins(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_admin_id = int(request.page_token) if request.page_token else 0
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            admins = (
                session.execute(
                    select(User)
                    .where_users_visible(context)
                    .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                    .where(ClusterSubscription.cluster_id == node.official_cluster.id)
                    .where(ClusterSubscription.role == ClusterRole.admin)
                    .where(User.id >= next_admin_id)
                    .order_by(User.id)
                    .limit(page_size + 1)
                )
                .scalars()
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
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            members = (
                session.execute(
                    select(User)
                    .where_users_visible(context)
                    .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                    .where(ClusterSubscription.cluster_id == node.official_cluster.id)
                    .where(User.id >= next_member_id)
                    .order_by(User.id)
                    .limit(page_size + 1)
                )
                .scalars()
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
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            nearbys = (
                session.execute(
                    select(User)
                    .where_users_visible(context)
                    .where(func.ST_Contains(node.geom, User.geom))
                    .where(User.id >= next_nearby_id)
                    .order_by(User.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return communities_pb2.ListNearbyUsersRes(
                nearby_user_ids=[nearby.id for nearby in nearbys[:page_size]],
                next_page_token=str(nearbys[-1].id) if len(nearbys) > page_size else None,
            )

    def ListPlaces(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            places = (
                node.official_cluster.owned_pages.where(Page.type == PageType.place)
                .where(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListPlacesRes(
                places=[page_to_pb(page, context) for page in places[:page_size]],
                next_page_token=str(places[-1].id) if len(places) > page_size else None,
            )

    def ListGuides(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            guides = (
                node.official_cluster.owned_pages.where(Page.type == PageType.guide)
                .where(Page.id >= next_page_id)
                .order_by(Page.id)
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListGuidesRes(
                guides=[page_to_pb(page, context) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )

    def ListEvents(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            # the page token is a unix timestamp of where we left off
            page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            occurrences = (
                select(EventOccurrence)
                .join(Event, Event.id == EventOccurrence.event_id)
                .where(Event.owner_cluster == node.official_cluster)
            )

            if request.past:
                occurrences = occurrences.where(EventOccurrence.end_time < page_token + timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.desc()
                )
            else:
                occurrences = occurrences.where(EventOccurrence.end_time > page_token - timedelta(seconds=1)).order_by(
                    EventOccurrence.start_time.asc()
                )

            occurrences = session.execute(occurrences.limit(page_size + 1)).scalars().all()

            return communities_pb2.ListEventsRes(
                events=[event_to_pb(occurrence, context) for occurrence in occurrences[:page_size]],
                next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
            )

    def ListDiscussions(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
            discussions = (
                node.official_cluster.owned_discussions.where(or_(Discussion.id <= next_page_id, next_page_id == 0))
                .order_by(Discussion.id.desc())
                .limit(page_size + 1)
                .all()
            )
            return communities_pb2.ListDiscussionsRes(
                discussions=[discussion_to_pb(discussion, context) for discussion in discussions[:page_size]],
                next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
            )

    def JoinCommunity(self, request, context):
        with session_scope() as session:
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            current_membership = node.official_cluster.members.where(User.id == context.user_id).one_or_none()
            if current_membership:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_IN_COMMUNITY)

            node.official_cluster.cluster_subscriptions.append(
                ClusterSubscription(
                    user_id=context.user_id,
                    role=ClusterRole.member,
                )
            )

            return empty_pb2.Empty()

    def LeaveCommunity(self, request, context):
        with session_scope() as session:
            node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
            if not node:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)

            current_membership = node.official_cluster.members.where(User.id == context.user_id).one_or_none()

            if not current_membership:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NOT_IN_COMMUNITY)

            if context.user_id in node.contained_user_ids:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANNOT_LEAVE_CONTAINING_COMMUNITY)

            session.execute(
                delete(ClusterSubscription)
                .where(ClusterSubscription.cluster_id == node.official_cluster.id)
                .where(ClusterSubscription.user_id == context.user_id)
            )

            return empty_pb2.Empty()

    def ListUserCommunities(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_node_id = int(request.page_token) if request.page_token else 0
            user_id = request.user_id or context.user_id
            nodes = (
                session.execute(
                    select(Node)
                    .join(Cluster, Cluster.parent_node_id == Node.id)
                    .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                    .where(ClusterSubscription.user_id == user_id)
                    .where(Cluster.is_official_cluster)
                    .where(Node.id >= next_node_id)
                    .order_by(Node.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )

            return communities_pb2.ListUserCommunitiesRes(
                communities=[community_to_pb(node, context) for node in nodes[:page_size]],
                next_page_token=str(nodes[-1].id) if len(nodes) > page_size else None,
            )
