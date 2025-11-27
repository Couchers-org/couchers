import json
import logging

import grpc
from geoalchemy2.shape import from_shape
from google.protobuf import empty_pb2
from shapely.geometry import shape
from sqlalchemy.sql import select, update

from couchers import urls
from couchers.context import make_background_user_context
from couchers.db import session_scope
from couchers.helpers.clusters import create_cluster, create_node
from couchers.jobs.enqueue import queue_job
from couchers.models import EventCommunityInviteRequest, Node, User, Volunteer
from couchers.notifications.notify import notify
from couchers.proto import editor_pb2, editor_pb2_grpc, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import get_users_to_notify_for_new_event
from couchers.sql import couchers_select as select
from couchers.utils import now, parse_date

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 250


def load_community_geom(geojson, context):
    geom = shape(json.loads(geojson))

    if geom.geom_type != "MultiPolygon":
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "no_multipolygon")

    return geom


def generate_new_blog_post_notifications(payload: jobs_pb2.GenerateNewBlogPostNotificationsPayload):
    with session_scope() as session:
        all_users_ids = session.execute(select(User.id).where(User.is_visible)).scalars().all()
        for user_id in all_users_ids:
            context = make_background_user_context(user_id=user_id)
            notify(
                session,
                user_id=user_id,
                topic_action="general:new_blog_post",
                data=notification_data_pb2.GeneralNewBlogPost(
                    url=payload.url,
                    title=payload.title,
                    blurb=payload.blurb,
                ),
            )


class Editor(editor_pb2_grpc.EditorServicer):
    def CreateCommunity(self, request, context, session):
        geom = load_community_geom(request.geojson, context)

        parent_node_id = request.parent_node_id if request.parent_node_id != 0 else None
        node = create_node(session, geom, parent_node_id)
        create_cluster(session, node.id, request.name, request.description, context.user_id, request.admin_ids, True)

        return community_to_pb(session, node, context)

    def UpdateCommunity(self, request, context, session):
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
        cluster = node.official_cluster

        if request.name:
            cluster.name = request.name

        if request.description:
            cluster.description = request.description

        if request.geojson:
            geom = load_community_geom(request.geojson, context)

            node.geom = from_shape(geom)

        if request.parent_node_id != 0:
            node.parent_node_id = request.parent_node_id

        session.flush()

        return community_to_pb(session, cluster.parent_node, context)

    def ListEventCommunityInviteRequests(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_request_id = int(request.page_token) if request.page_token else 0
        requests = (
            session.execute(
                select(EventCommunityInviteRequest)
                .where(EventCommunityInviteRequest.approved.is_(None))
                .where(EventCommunityInviteRequest.id >= next_request_id)
                .order_by(EventCommunityInviteRequest.id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )

        def _request_to_pb(request):
            users_to_notify, node_id = get_users_to_notify_for_new_event(session, request.occurrence)
            return editor_pb2.EventCommunityInviteRequest(
                event_community_invite_request_id=request.id,
                user_id=request.user_id,
                event_url=urls.event_link(occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug),
                approx_users_to_notify=len(users_to_notify),
                community_id=node_id,
            )

        return editor_pb2.ListEventCommunityInviteRequestsRes(
            requests=[_request_to_pb(request) for request in requests[:page_size]],
            next_page_token=str(requests[-1].id) if len(requests) > page_size else None,
        )

    def DecideEventCommunityInviteRequest(self, request, context, session):
        req = session.execute(
            select(EventCommunityInviteRequest).where(
                EventCommunityInviteRequest.id == request.event_community_invite_request_id
            )
        ).scalar_one_or_none()

        if not req:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_community_invite_not_found")

        if req.decided:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "event_community_invite_already_decided")

        decided = now()
        req.decided = decided
        req.decided_by_user_id = context.user_id
        req.approved = request.approve

        # deny other reqs for the same event
        if request.approve:
            session.execute(
                update(EventCommunityInviteRequest)
                .where(EventCommunityInviteRequest.occurrence_id == req.occurrence_id)
                .where(EventCommunityInviteRequest.decided.is_(None))
                .values(decided=decided, decided_by_user_id=context.user_id, approved=False)
            )

        session.flush()

        if request.approve:
            queue_job(
                session,
                "generate_event_create_notifications",
                payload=jobs_pb2.GenerateEventCreateNotificationsPayload(
                    inviting_user_id=req.user_id,
                    occurrence_id=req.occurrence_id,
                    approved=True,
                ),
            )

        return editor_pb2.DecideEventCommunityInviteRequestRes()

    def SendBlogPostNotification(self, request, context, session):
        if len(request.title) > 50:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_blog_title_too_long")
        if len(request.blurb) > 100:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_blog_blurb_too_long")
        queue_job(
            session,
            "generate_new_blog_post_notifications",
            payload=jobs_pb2.GenerateNewBlogPostNotificationsPayload(
                url=request.url,
                title=request.title,
                blurb=request.blurb,
            ),
        )
        return empty_pb2.Empty()

    def MakeUserVolunteer(self, request, context, session):
        # Check if user exists
        user = session.execute(select(User).where(User.id == request.user_id)).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        # Check if user is already a volunteer
        existing_volunteer = session.execute(
            select(Volunteer).where(Volunteer.user_id == request.user_id)
        ).scalar_one_or_none()
        if existing_volunteer:
            context.abort_with_error_code(grpc.StatusCode.ALREADY_EXISTS, "user_already_volunteer")

        # Parse started_volunteering date
        started_volunteering = None
        if request.started_volunteering:
            started_volunteering = parse_date(request.started_volunteering)
            if not started_volunteering:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_started_volunteering_date")

        # Create volunteer record
        volunteer = Volunteer(
            user_id=request.user_id,
            role=request.role,
            started_volunteering=started_volunteering,
            show_on_team_page=not request.hide_on_team_page,
        )
        session.add(volunteer)
        session.flush()

        return empty_pb2.Empty()

    def UpdateVolunteer(self, request, context, session):
        # Check if volunteer exists
        volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == request.user_id)).scalar_one_or_none()
        if not volunteer:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "volunteer_not_found")

        # Update role if provided
        if request.HasField("role"):
            volunteer.role = request.role.value

        # Update sort_key if provided
        if request.HasField("sort_key"):
            volunteer.sort_key = request.sort_key.value

        # Update started_volunteering if provided
        if request.HasField("started_volunteering"):
            started_volunteering = parse_date(request.started_volunteering.value)
            if not started_volunteering:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_started_volunteering_date")
            volunteer.started_volunteering = started_volunteering

        # Update stopped_volunteering if provided
        if request.HasField("stopped_volunteering"):
            stopped_volunteering = parse_date(request.stopped_volunteering.value)
            if not stopped_volunteering:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_stopped_volunteering_date")
            volunteer.stopped_volunteering = stopped_volunteering

        # Update show_on_team_page if provided
        if request.HasField("show_on_team_page"):
            volunteer.show_on_team_page = request.show_on_team_page.value

        session.flush()

        return empty_pb2.Empty()
