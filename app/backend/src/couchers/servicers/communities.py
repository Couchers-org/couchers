import logging
from collections.abc import Sequence
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.sql import delete, func, or_

from couchers.constants import COMMUNITIES_SEARCH_FUZZY_SIMILARITY_THRESHOLD
from couchers.context import CouchersContext
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.db import can_moderate_node, get_node_parents_recursively, is_user_in_node_geography
from couchers.event_log import log_event
from couchers.materialized_views import ClusterAdminCount, ClusterSubscriptionCount
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Comment,
    Discussion,
    Event,
    EventOccurrence,
    Node,
    NodeType,
    Page,
    PageType,
    User,
)
from couchers.proto import communities_pb2, communities_pb2_grpc, groups_pb2
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.events import event_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.sql import to_bool, users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.utils import Timestamp_from_datetime, dt_from_millis, millis_from_dt, now

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25

nodetype2api = {
    NodeType.world: communities_pb2.NODE_TYPE_WORLD,
    NodeType.macroregion: communities_pb2.NODE_TYPE_MACROREGION,
    NodeType.region: communities_pb2.NODE_TYPE_REGION,
    NodeType.subregion: communities_pb2.NODE_TYPE_SUBREGION,
    NodeType.locality: communities_pb2.NODE_TYPE_LOCALITY,
    NodeType.sublocality: communities_pb2.NODE_TYPE_SUBLOCALITY,
}


def _parents_to_pb(session: Session, node_id: int) -> list[groups_pb2.Parent]:
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


def communities_to_pb(
    session: Session, nodes: Sequence[Node], context: CouchersContext
) -> list[communities_pb2.Community]:
    can_moderates = [can_moderate_node(session, context.user_id, node.id) for node in nodes]

    official_clusters = [node.official_cluster for node in nodes]
    official_cluster_ids = [cluster.id for cluster in official_clusters]

    member_counts: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(ClusterSubscriptionCount.cluster_id, ClusterSubscriptionCount.count).where(
                ClusterSubscriptionCount.cluster_id.in_(official_cluster_ids)
            )
        ).all()
    )
    cluster_memberships = set(
        session.execute(
            select(ClusterSubscription.cluster_id)
            .where(ClusterSubscription.user_id == context.user_id)
            .where(ClusterSubscription.cluster_id.in_(official_cluster_ids))
        )
        .scalars()
        .all()
    )

    admin_counts: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(ClusterAdminCount.cluster_id, ClusterAdminCount.count).where(
                ClusterAdminCount.cluster_id.in_(official_cluster_ids)
            )
        ).all()
    )
    cluster_adminships = set(
        session.execute(
            select(ClusterSubscription.cluster_id)
            .where(ClusterSubscription.user_id == context.user_id)
            .where(ClusterSubscription.cluster_id.in_(official_cluster_ids))
            .where(ClusterSubscription.role == ClusterRole.admin)
        )
        .scalars()
        .all()
    )

    return [
        communities_pb2.Community(
            community_id=node.id,
            name=official_cluster.name,
            slug=official_cluster.slug,
            description=official_cluster.description,
            created=Timestamp_from_datetime(node.created),
            parents=_parents_to_pb(session, node.id),
            member=official_cluster.id in cluster_memberships,
            admin=official_cluster.id in cluster_adminships,
            member_count=member_counts.get(official_cluster.id, 1),
            admin_count=admin_counts.get(official_cluster.id, 1),
            main_page=page_to_pb(session, official_cluster.main_page, context),
            can_moderate=can_moderate,
            small_community_features_enabled=official_cluster.small_community_features_enabled,
            node_type=nodetype2api[node.node_type],
        )
        for node, official_cluster, can_moderate in zip(nodes, official_clusters, can_moderates)
    ]


def community_to_pb(session: Session, node: Node, context: CouchersContext) -> communities_pb2.Community:
    return communities_to_pb(session, [node], context)[0]


class Communities(communities_pb2_grpc.CommunitiesServicer):
    def GetCommunity(
        self, request: communities_pb2.GetCommunityReq, context: CouchersContext, session: Session
    ) -> communities_pb2.Community:
        node = session.execute(
            select(Node).where(Node.id == request.community_id).options(selectinload(Node.official_cluster))
        ).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        return community_to_pb(session, node, context)

    def ListCommunities(
        self, request: communities_pb2.ListCommunitiesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListCommunitiesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        offset = int(decrypt_page_token(request.page_token)) if request.page_token else 0
        nodes = (
            session.execute(
                select(Node)
                .join(Cluster, Cluster.parent_node_id == Node.id)
                .where(or_(Node.parent_node_id == request.community_id, to_bool(request.community_id == 0)))
                .where(Cluster.is_official_cluster)
                .order_by(Cluster.name)
                .limit(page_size + 1)
                .offset(offset)
                .options(selectinload(Node.official_cluster))
            )
            .scalars()
            .all()
        )
        return communities_pb2.ListCommunitiesRes(
            communities=communities_to_pb(session, nodes[:page_size], context),
            next_page_token=encrypt_page_token(str(offset + page_size)) if len(nodes) > page_size else None,
        )

    def SearchCommunities(
        self, request: communities_pb2.SearchCommunitiesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.SearchCommunitiesRes:
        raw_query = request.query.strip()
        if len(raw_query) < 3:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "query_too_short")

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)

        word_similarity_score = func.word_similarity(func.unaccent(raw_query), func.immutable_unaccent(Cluster.name))

        query = (
            select(Node)
            .join(Cluster, Cluster.parent_node_id == Node.id)
            .where(Cluster.is_official_cluster)
            .where(word_similarity_score > COMMUNITIES_SEARCH_FUZZY_SIMILARITY_THRESHOLD)
            .order_by(word_similarity_score.desc(), Cluster.name.asc(), Node.id.asc())
            .limit(page_size)
        )

        rows = session.execute(query.options(selectinload(Node.official_cluster))).scalars().all()

        return communities_pb2.SearchCommunitiesRes(communities=communities_to_pb(session, rows, context))

    def ListRecentCommunities(
        self, request: communities_pb2.ListRecentCommunitiesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListRecentCommunitiesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        rows = session.execute(
            select(Node, Cluster)
            .join(Cluster, Cluster.parent_node_id == Node.id)
            .where(Cluster.is_official_cluster)
            .order_by(Node.created.desc(), Node.id.desc())
            .limit(page_size)
        ).all()
        return communities_pb2.ListRecentCommunitiesRes(
            communities=[
                communities_pb2.CommunitySummary(
                    community_id=node.id,
                    name=cluster.name,
                    slug=cluster.slug,
                    created=Timestamp_from_datetime(node.created),
                    node_type=nodetype2api[node.node_type],
                )
                for node, cluster in rows
            ],
        )

    def ListGroups(
        self, request: communities_pb2.ListGroupsReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListGroupsRes:
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
            groups=[group_to_pb(session, cluster, context) for cluster in clusters[:page_size]],
            next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
        )

    def ListAdmins(
        self, request: communities_pb2.ListAdminsReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListAdminsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_admin_id = int(request.page_token) if request.page_token else 0
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        admins = (
            session.execute(
                select(User)
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .where(users_visible(context))
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

    def AddAdmin(
        self, request: communities_pb2.AddAdminReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        if not can_moderate_node(session, context.user_id, node.id):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "node_moderate_permission_denied")

        user = session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        subscription = session.execute(
            select(ClusterSubscription)
            .where(ClusterSubscription.user_id == user.id)
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
        ).scalar_one_or_none()
        if not subscription:
            # Can't upgrade a member to admin if they're not already a member
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_member")
        if subscription.role == ClusterRole.admin:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_already_admin")

        subscription.role = ClusterRole.admin

        return empty_pb2.Empty()

    def RemoveAdmin(
        self, request: communities_pb2.RemoveAdminReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        if not can_moderate_node(session, context.user_id, node.id):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "node_moderate_permission_denied")

        user = session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        subscription = session.execute(
            select(ClusterSubscription)
            .where(ClusterSubscription.user_id == user.id)
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
        ).scalar_one_or_none()
        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_member")
        if subscription.role == ClusterRole.member:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_admin")

        subscription.role = ClusterRole.member

        return empty_pb2.Empty()

    def ListMembers(
        self, request: communities_pb2.ListMembersReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListMembersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_member_id = int(request.page_token) if request.page_token else None

        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        query = (
            select(User)
            .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
            .where(users_visible(context))
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
        )
        if next_member_id is not None:
            query = query.where(User.id <= next_member_id)
        members = session.execute(query.order_by(User.id.desc()).limit(page_size + 1)).scalars().all()

        return communities_pb2.ListMembersRes(
            member_user_ids=[member.id for member in members[:page_size]],
            next_page_token=str(members[-1].id) if len(members) > page_size else None,
        )

    def ListNearbyUsers(
        self, request: communities_pb2.ListNearbyUsersReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListNearbyUsersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_nearby_id = int(request.page_token) if request.page_token else 0
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        nearbys = (
            session.execute(
                select(User)
                .where(users_visible(context))
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

    def ListPlaces(
        self, request: communities_pb2.ListPlacesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListPlacesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        places = (
            node.official_cluster.owned_pages.where(Page.type == PageType.place)
            .where(Page.id >= next_page_id)
            .order_by(Page.id)
            .limit(page_size + 1)
            .all()
        )
        return communities_pb2.ListPlacesRes(
            places=[page_to_pb(session, page, context) for page in places[:page_size]],
            next_page_token=str(places[-1].id) if len(places) > page_size else None,
        )

    def ListGuides(
        self, request: communities_pb2.ListGuidesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListGuidesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        guides = (
            node.official_cluster.owned_pages.where(Page.type == PageType.guide)
            .where(Page.id >= next_page_id)
            .order_by(Page.id)
            .limit(page_size + 1)
            .all()
        )
        return communities_pb2.ListGuidesRes(
            guides=[page_to_pb(session, page, context) for page in guides[:page_size]],
            next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
        )

    def ListEvents(
        self, request: communities_pb2.ListEventsReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListEventsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = dt_from_millis(int(request.page_token)) if request.page_token else now()

        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        if not node.official_cluster.small_community_features_enabled:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "events_not_enabled")

        if not request.include_parents:
            nodes_clusters_to_search = [(node.id, node.official_cluster)]
        else:
            # the first value is the node_id, the last is the cluster (object)
            nodes_clusters_to_search = [
                (parent[0], parent[3]) for parent in get_node_parents_recursively(session, node.id)
            ]

        membership_clauses = []
        for node_id, official_cluster_obj in nodes_clusters_to_search:
            membership_clauses.append(Event.owner_cluster == official_cluster_obj)
            membership_clauses.append(Event.parent_node_id == node_id)

        # for communities, we list events owned by this community or for which this is a parent
        query = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(or_(*membership_clauses))
        )
        query = where_moderated_content_visible(query, context, EventOccurrence, is_list_operation=True)

        if request.past:
            cutoff = page_token + timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time < cutoff).order_by(EventOccurrence.start_time.desc())
        else:
            cutoff = page_token - timedelta(seconds=1)
            query = query.where(EventOccurrence.end_time > cutoff).order_by(EventOccurrence.start_time.asc())

        query = query.limit(page_size + 1)
        occurrences = session.execute(query).scalars().all()

        return communities_pb2.ListEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None,
        )

    def ListDiscussions(
        self, request: communities_pb2.ListDiscussionsReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListDiscussionsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 2**63 - 1
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        if not node.official_cluster.small_community_features_enabled:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "discussions_not_enabled")
        has_visible_comments = (
            where_moderated_content_visible(
                where_users_column_visible(
                    select(func.count())
                    .select_from(Comment)
                    .where(Comment.thread_id == Discussion.thread_id)
                    .where(Comment.deleted == None),
                    context,
                    Comment.author_user_id,
                ),
                context,
                Comment,
                is_list_operation=True,
            )
            .correlate(Discussion)
            .scalar_subquery()
        )
        discussions = (
            session.execute(
                where_moderated_content_visible(
                    select(Discussion)
                    .where(Discussion.owner_cluster_id == node.official_cluster.id)
                    .where((Discussion.deleted == None) | (has_visible_comments > 0))
                    .where(Discussion.id <= next_page_id)
                    .order_by(Discussion.id.desc())
                    .limit(page_size + 1),
                    context,
                    Discussion,
                    is_list_operation=True,
                )
            )
            .scalars()
            .all()
        )
        return communities_pb2.ListDiscussionsRes(
            discussions=[discussion_to_pb(session, discussion, context) for discussion in discussions[:page_size]],
            next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
        )

    def JoinCommunity(
        self, request: communities_pb2.JoinCommunityReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        current_membership = node.official_cluster.members.where(User.id == context.user_id).one_or_none()
        if current_membership:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_in_community")

        node.official_cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=context.user_id,
                cluster_id=node.official_cluster.id,
                role=ClusterRole.member,
            )
        )

        log_event(
            context,
            session,
            "community.joined",
            {"community_id": node.id, "community_name": node.official_cluster.name},
        )

        return empty_pb2.Empty()

    def LeaveCommunity(
        self, request: communities_pb2.LeaveCommunityReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        current_membership = node.official_cluster.members.where(User.id == context.user_id).one_or_none()

        if not current_membership:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "not_in_community")

        if is_user_in_node_geography(session, context.user_id, node.id):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cannot_leave_containing_community")

        session.execute(
            delete(ClusterSubscription)
            .where(ClusterSubscription.cluster_id == node.official_cluster.id)
            .where(ClusterSubscription.user_id == context.user_id)
        )

        log_event(
            context, session, "community.left", {"community_id": node.id, "community_name": node.official_cluster.name}
        )

        return empty_pb2.Empty()

    def ListUserCommunities(
        self, request: communities_pb2.ListUserCommunitiesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListUserCommunitiesRes:
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
                .options(selectinload(Node.official_cluster))
            )
            .scalars()
            .all()
        )

        return communities_pb2.ListUserCommunitiesRes(
            communities=communities_to_pb(session, nodes[:page_size], context),
            next_page_token=str(nodes[-1].id) if len(nodes) > page_size else None,
        )

    def ListAllCommunities(
        self, request: communities_pb2.ListAllCommunitiesReq, context: CouchersContext, session: Session
    ) -> communities_pb2.ListAllCommunitiesRes:
        """List all communities ordered hierarchically by parent-child relationships"""
        # Get all nodes with their clusters, member counts, and user membership in a single query
        results = session.execute(
            select(
                Node,
                Cluster,
                ClusterSubscriptionCount.count,
                ClusterSubscription.cluster_id.label("user_subscription"),
            )
            .join(Cluster, Cluster.parent_node_id == Node.id)
            .outerjoin(
                ClusterSubscriptionCount,
                ClusterSubscriptionCount.cluster_id == Cluster.id,
            )
            .outerjoin(
                ClusterSubscription,
                (ClusterSubscription.cluster_id == Cluster.id) & (ClusterSubscription.user_id == context.user_id),
            )
            .where(Cluster.is_official_cluster)
            .order_by(Node.id)
        ).all()

        return communities_pb2.ListAllCommunitiesRes(
            communities=[
                communities_pb2.CommunitySummary(
                    community_id=node.id,
                    name=cluster.name,
                    slug=cluster.slug,
                    member=user_subscription is not None,
                    member_count=member_count or 1,
                    parents=_parents_to_pb(session, node.id),
                    created=Timestamp_from_datetime(node.created),
                    node_type=nodetype2api[node.node_type],
                )
                for node, cluster, member_count, user_subscription in results
            ],
        )
