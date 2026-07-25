import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import delete, func

from couchers.context import CouchersContext
from couchers.db import can_moderate_node, get_node_parents_recursively
from couchers.event_log import log_event
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Discussion,
    Event,
    EventOccurrence,
    Page,
    PageType,
    User,
)
from couchers.proto import groups_pb2, groups_pb2_grpc
from couchers.servicers.discussions import discussion_to_pb
from couchers.servicers.events import apply_occurrence_pagination, event_to_pb, occurrences_next_page_token
from couchers.servicers.pages import page_to_pb
from couchers.sql import users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25


def _parents_to_pb(session: Session, cluster: Cluster) -> list[groups_pb2.Parent]:
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


def group_to_pb(session: Session, cluster: Cluster, context: CouchersContext) -> groups_pb2.Group:
    can_moderate = can_moderate_node(session, context.user_id, cluster.parent_node_id)

    member_count = session.execute(
        where_users_column_visible(
            select(func.count()).select_from(ClusterSubscription).where(ClusterSubscription.cluster_id == cluster.id),
            context,
            ClusterSubscription.user_id,
        )
    ).scalar_one()
    is_member = (
        session.execute(
            select(ClusterSubscription)
            .where(ClusterSubscription.user_id == context.user_id)
            .where(ClusterSubscription.cluster_id == cluster.id)
        ).scalar_one_or_none()
        is not None
    )

    admin_count = session.execute(
        where_users_column_visible(
            select(func.count())
            .select_from(ClusterSubscription)
            .where(ClusterSubscription.cluster_id == cluster.id)
            .where(ClusterSubscription.role == ClusterRole.admin),
            context,
            ClusterSubscription.user_id,
        )
    ).scalar_one()
    is_admin = (
        session.execute(
            select(ClusterSubscription)
            .where(ClusterSubscription.user_id == context.user_id)
            .where(ClusterSubscription.cluster_id == cluster.id)
            .where(ClusterSubscription.role == ClusterRole.admin)
        ).scalar_one_or_none()
        is not None
    )

    return groups_pb2.Group(
        group_id=cluster.id,
        name=cluster.name,
        slug=cluster.slug,
        description=cluster.description,
        created=Timestamp_from_datetime(cluster.created),
        parents=_parents_to_pb(session, cluster),
        main_page=page_to_pb(session, cluster.main_page, context),
        member=is_member,
        admin=is_admin,
        member_count=member_count,
        admin_count=admin_count,
        can_moderate=can_moderate,
    )


class Groups(groups_pb2_grpc.GroupsServicer):
    def GetGroup(self, request: groups_pb2.GetGroupReq, context: CouchersContext, session: Session) -> groups_pb2.Group:
        cluster = session.execute(
            select(Cluster)
            .where(~Cluster.is_official_cluster)  # not an official group
            .where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        return group_to_pb(session, cluster, context)

    def ListAdmins(
        self, request: groups_pb2.ListAdminsReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListAdminsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_admin_id = int(request.page_token) if request.page_token else 0
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        admins = (
            session.execute(
                select(User)
                .where(users_visible(context))
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .where(ClusterSubscription.cluster_id == cluster.id)
                .where(ClusterSubscription.role == ClusterRole.admin)
                .where(User.id >= next_admin_id)
                .order_by(User.id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return groups_pb2.ListAdminsRes(
            admin_user_ids=[admin.id for admin in admins[:page_size]],
            next_page_token=str(admins[-1].id) if len(admins) > page_size else None,
        )

    def ListMembers(
        self, request: groups_pb2.ListMembersReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListMembersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_member_id = int(request.page_token) if request.page_token else 0
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        members = (
            session.execute(
                select(User)
                .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                .where(users_visible(context))
                .where(ClusterSubscription.cluster_id == cluster.id)
                .where(User.id >= next_member_id)
                .order_by(User.id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return groups_pb2.ListMembersRes(
            member_user_ids=[member.id for member in members[:page_size]],
            next_page_token=str(members[-1].id) if len(members) > page_size else None,
        )

    def ListPlaces(
        self, request: groups_pb2.ListPlacesReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListPlacesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")
        places = (
            cluster.owned_pages.where(Page.type == PageType.place)
            .where(Page.id >= next_page_id)
            .order_by(Page.id)
            .limit(page_size + 1)
            .all()
        )
        return groups_pb2.ListPlacesRes(
            places=[page_to_pb(session, page, context) for page in places[:page_size]],
            next_page_token=str(places[-1].id) if len(places) > page_size else None,
        )

    def ListGuides(
        self, request: groups_pb2.ListGuidesReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListGuidesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")
        guides = (
            cluster.owned_pages.where(Page.type == PageType.guide)
            .where(Page.id >= next_page_id)
            .order_by(Page.id)
            .limit(page_size + 1)
            .all()
        )
        return groups_pb2.ListGuidesRes(
            guides=[page_to_pb(session, page, context) for page in guides[:page_size]],
            next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
        )

    def ListEvents(
        self, request: groups_pb2.ListEventsReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListEventsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)

        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        query = (
            select(EventOccurrence)
            .join(Event, Event.id == EventOccurrence.event_id)
            .where(Event.owner_cluster == cluster)
        )
        query = where_moderated_content_visible(query, context, EventOccurrence, is_list_operation=True)

        query = apply_occurrence_pagination(query, request.page_token, request.past)

        query = query.limit(page_size + 1)
        occurrences = session.execute(query).scalars().all()

        return groups_pb2.ListEventsRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=occurrences_next_page_token(occurrences, page_size),
        )

    def ListDiscussions(
        self, request: groups_pb2.ListDiscussionsReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListDiscussionsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        query = select(Discussion).where(Discussion.owner_cluster_id == cluster.id).where(Discussion.id >= next_page_id)
        query = where_moderated_content_visible(query, context, Discussion, is_list_operation=True)
        discussions = session.execute(query.order_by(Discussion.id).limit(page_size + 1)).scalars().all()
        return groups_pb2.ListDiscussionsRes(
            discussions=[discussion_to_pb(session, discussion, context) for discussion in discussions[:page_size]],
            next_page_token=str(discussions[-1].id) if len(discussions) > page_size else None,
        )

    def JoinGroup(
        self, request: groups_pb2.JoinGroupReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        user_in_group = cluster.members.where(User.id == context.user_id).one_or_none()
        if user_in_group:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_in_group")

        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=context.user_id,
                cluster_id=cluster.id,
                role=ClusterRole.member,
            )
        )

        log_event(context, session, "group.joined", {"group_id": cluster.id, "group_name": cluster.name})

        return empty_pb2.Empty()

    def LeaveGroup(
        self, request: groups_pb2.LeaveGroupReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        cluster = session.execute(
            select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.group_id)
        ).scalar_one_or_none()
        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_not_found")

        user_in_group = cluster.members.where(User.id == context.user_id).one_or_none()
        if not user_in_group:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "not_in_group")

        session.execute(
            delete(ClusterSubscription)
            .where(ClusterSubscription.cluster_id == request.group_id)
            .where(ClusterSubscription.user_id == context.user_id)
        )

        log_event(context, session, "group.left", {"group_id": cluster.id, "group_name": cluster.name})

        return empty_pb2.Empty()

    def ListUserGroups(
        self, request: groups_pb2.ListUserGroupsReq, context: CouchersContext, session: Session
    ) -> groups_pb2.ListUserGroupsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_cluster_id = int(request.page_token) if request.page_token else 0
        user_id = request.user_id or context.user_id
        clusters = (
            session.execute(
                select(Cluster)
                .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                .where(ClusterSubscription.user_id == user_id)
                .where(~Cluster.is_official_cluster)  # not an official group
                .where(Cluster.id >= next_cluster_id)
                .order_by(Cluster.id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return groups_pb2.ListUserGroupsRes(
            groups=[group_to_pb(session, cluster, context) for cluster in clusters[:page_size]],
            next_page_token=str(clusters[-1].id) if len(clusters) > page_size else None,
        )
