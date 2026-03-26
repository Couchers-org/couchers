import json
import logging

import grpc
from geoalchemy2.shape import from_shape
from google.protobuf import empty_pb2
from shapely.geometry import shape
from shapely.geometry.base import BaseGeometry
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import exists, update

from couchers import urls
from couchers.context import CouchersContext
from couchers.db import session_scope
from couchers.helpers.clusters import CHILD_NODE_TYPE, create_cluster, create_node
from couchers.jobs.enqueue import queue_job
from couchers.materialized_views import LiteUser
from couchers.models import EventCommunityInviteRequest, Node, User, Volunteer
from couchers.models.notifications import NotificationTopicAction
from couchers.models.postal_verification import PostalVerificationAttempt
from couchers.notifications.notify import notify
from couchers.postal.my_postcard import download_pdf
from couchers.proto import communities_pb2, editor_pb2, editor_pb2_grpc, notification_data_pb2, postal_verification_pb2
from couchers.proto.internal import jobs_pb2
from couchers.resources import get_static_badge_dict
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import generate_event_create_notifications, get_users_to_notify_for_new_event
from couchers.servicers.postal_verification import postalverificationstatus2pb
from couchers.servicers.public import format_volunteer_link
from couchers.utils import Timestamp_from_datetime, date_to_api, now, parse_date

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 250


def load_community_geom(geojson: str, context: CouchersContext) -> BaseGeometry:
    geom = shape(json.loads(geojson))

    if geom.geom_type != "MultiPolygon":
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "no_multipolygon")

    return geom


def volunteer_to_pb(session: Session, volunteer: Volunteer) -> editor_pb2.Volunteer:
    """Convert a Volunteer model to the editor protobuf message."""
    lite_user = session.execute(select(LiteUser).where(LiteUser.id == volunteer.user_id)).scalar_one()
    board_members = set(get_static_badge_dict()["board_member"])

    return editor_pb2.Volunteer(
        user_id=volunteer.user_id,
        name=volunteer.display_name or lite_user.name,
        username=lite_user.username,
        is_board_member=lite_user.id in board_members,
        role=volunteer.role,
        location=volunteer.display_location or lite_user.city,
        img=urls.media_url(filename=lite_user.avatar_filename, size="thumbnail") if lite_user.avatar_filename else None,
        sort_key=volunteer.sort_key,
        started_volunteering=date_to_api(volunteer.started_volunteering),
        stopped_volunteering=date_to_api(volunteer.stopped_volunteering) if volunteer.stopped_volunteering else None,
        show_on_team_page=volunteer.show_on_team_page,
        **format_volunteer_link(volunteer, lite_user.username),
    )


def generate_new_blog_post_notifications(payload: jobs_pb2.GenerateNewBlogPostNotificationsPayload) -> None:
    with session_scope() as session:
        all_users_ids = session.execute(select(User.id).where(User.is_visible)).scalars().all()
        for user_id in all_users_ids:
            notify(
                session,
                user_id=user_id,
                topic_action=NotificationTopicAction.general__new_blog_post,
                key=payload.url,
                data=notification_data_pb2.GeneralNewBlogPost(
                    url=payload.url,
                    title=payload.title,
                    blurb=payload.blurb,
                ),
            )


class Editor(editor_pb2_grpc.EditorServicer):
    def CreateCommunity(
        self, request: editor_pb2.CreateCommunityReq, context: CouchersContext, session: Session
    ) -> communities_pb2.Community:
        geom = load_community_geom(request.geojson, context)

        parent_node_id = request.parent_node_id if request.parent_node_id != 0 else None
        if parent_node_id is not None:
            parent_node = session.execute(select(Node).where(Node.id == parent_node_id)).scalar_one_or_none()
            if not parent_node:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "parent_node_not_found")
            parent_type = parent_node.node_type
        else:
            parent_type = None
        node_type = CHILD_NODE_TYPE[parent_type]
        node = create_node(session, geom, parent_node_id, node_type)
        create_cluster(session, node.id, request.name, request.description, context.user_id, request.admin_ids, True)

        return community_to_pb(session, node, context)

    def UpdateCommunity(
        self, request: editor_pb2.UpdateCommunityReq, context: CouchersContext, session: Session
    ) -> communities_pb2.Community:
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

    def ListEventCommunityInviteRequests(
        self, request: editor_pb2.ListEventCommunityInviteRequestsReq, context: CouchersContext, session: Session
    ) -> editor_pb2.ListEventCommunityInviteRequestsRes:
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

        def _request_to_pb(request: EventCommunityInviteRequest) -> editor_pb2.EventCommunityInviteRequest:
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

    def DecideEventCommunityInviteRequest(
        self, request: editor_pb2.DecideEventCommunityInviteRequestReq, context: CouchersContext, session: Session
    ) -> editor_pb2.DecideEventCommunityInviteRequestRes:
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
                job=generate_event_create_notifications,
                payload=jobs_pb2.GenerateEventCreateNotificationsPayload(
                    inviting_user_id=req.user_id,
                    occurrence_id=req.occurrence_id,
                    approved=True,
                ),
            )

        return editor_pb2.DecideEventCommunityInviteRequestRes()

    def SendBlogPostNotification(
        self, request: editor_pb2.SendBlogPostNotificationReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if len(request.title) > 50:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_blog_title_too_long")
        if len(request.blurb) > 100:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_blog_blurb_too_long")
        queue_job(
            session,
            job=generate_new_blog_post_notifications,
            payload=jobs_pb2.GenerateNewBlogPostNotificationsPayload(
                url=request.url,
                title=request.title,
                blurb=request.blurb,
            ),
        )
        return empty_pb2.Empty()

    def MakeUserVolunteer(
        self, request: editor_pb2.MakeUserVolunteerReq, context: CouchersContext, session: Session
    ) -> editor_pb2.Volunteer:
        # Check if user exists
        if not session.execute(select(exists().where(User.id == request.user_id))).scalar():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        # Check if user is already a volunteer
        if session.execute(select(exists().where(Volunteer.user_id == request.user_id))).scalar():
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_already_volunteer")

        # Parse started_volunteering date
        started_volunteering = None
        if request.started_volunteering:
            started_volunteering = parse_date(request.started_volunteering)
            if not started_volunteering:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_started_volunteering_date")

        # Create a volunteer record
        volunteer = Volunteer(
            user_id=request.user_id,
            role=request.role,
            show_on_team_page=not request.hide_on_team_page,
        )
        if started_volunteering:
            volunteer.started_volunteering = started_volunteering
        session.add(volunteer)
        session.flush()

        return volunteer_to_pb(session, volunteer)

    def UpdateVolunteer(
        self, request: editor_pb2.UpdateVolunteerReq, context: CouchersContext, session: Session
    ) -> editor_pb2.Volunteer:
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

        return volunteer_to_pb(session, volunteer)

    def ListVolunteers(
        self, request: editor_pb2.ListVolunteersReq, context: CouchersContext, session: Session
    ) -> editor_pb2.ListVolunteersRes:
        # Query volunteers
        query = select(Volunteer).join(LiteUser, LiteUser.id == Volunteer.user_id).where(LiteUser.is_visible)

        # Filter based on include_past flag
        if not request.include_past:
            query = query.where(Volunteer.stopped_volunteering.is_(None))

        # Order by same criteria as public API
        query = query.order_by(
            Volunteer.sort_key.asc().nulls_last(),
            Volunteer.stopped_volunteering.desc().nulls_first(),
            Volunteer.started_volunteering.asc(),
        )

        volunteers = session.execute(query).scalars().all()

        return editor_pb2.ListVolunteersRes(
            volunteers=[volunteer_to_pb(session, volunteer) for volunteer in volunteers]
        )

    def ListPostcards(
        self, request: editor_pb2.ListPostcardsReq, context: CouchersContext, session: Session
    ) -> editor_pb2.ListPostcardsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_id = int(request.page_token) if request.page_token else None

        query = (
            select(PostalVerificationAttempt)
            .join(LiteUser, LiteUser.id == PostalVerificationAttempt.user_id)
            .where(LiteUser.is_visible)
            .order_by(PostalVerificationAttempt.id.desc())
            .limit(page_size + 1)
        )
        if next_id is not None:
            query = query.where(PostalVerificationAttempt.id <= next_id)

        attempts = session.execute(query).scalars().all()

        def _attempt_to_pb(attempt: PostalVerificationAttempt) -> editor_pb2.PostcardInfo:
            lite_user = session.execute(select(LiteUser).where(LiteUser.id == attempt.user_id)).scalar_one()
            return editor_pb2.PostcardInfo(
                postal_verification_attempt_id=attempt.id,
                user_id=attempt.user_id,
                username=lite_user.username,
                name=lite_user.name,
                status=postalverificationstatus2pb.get(
                    attempt.status, postal_verification_pb2.POSTAL_VERIFICATION_STATUS_UNKNOWN
                ),
                address=postal_verification_pb2.PostalAddress(
                    address_line_1=attempt.address_line_1,
                    address_line_2=attempt.address_line_2 or "",
                    city=attempt.city,
                    state=attempt.state or "",
                    postal_code=attempt.postal_code or "",
                    country=attempt.country_code,
                ),
                created=Timestamp_from_datetime(attempt.created),
                postcard_sent_at=Timestamp_from_datetime(attempt.postcard_sent_at)
                if attempt.postcard_sent_at
                else None,
                verified_at=Timestamp_from_datetime(attempt.verified_at) if attempt.verified_at else None,
            )

        return editor_pb2.ListPostcardsRes(
            postcards=[_attempt_to_pb(attempt) for attempt in attempts[:page_size]],
            next_page_token=str(attempts[-1].id) if len(attempts) > page_size else None,
        )

    def DownloadPostcardPdf(
        self, request: editor_pb2.DownloadPostcardPdfReq, context: CouchersContext, session: Session
    ) -> editor_pb2.DownloadPostcardPdfRes:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(
                PostalVerificationAttempt.id == request.postal_verification_attempt_id
            )
        ).scalar_one_or_none()

        if not attempt:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "postal_verification_attempt_not_found")

        if not attempt.mypostcard_job_id:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "postcard_not_sent")

        pdf_data = download_pdf(attempt.mypostcard_job_id)
        return editor_pb2.DownloadPostcardPdfRes(pdf=pdf_data)
