import json
import logging
from datetime import timedelta

import grpc
from geoalchemy2.shape import from_shape
from google.protobuf import empty_pb2
from shapely.geometry import shape
from sqlalchemy.sql import func, or_, select, update
from user_agents import parse as user_agents_parse

from couchers import errors, urls
from couchers.crypto import urlsafe_secure_token
from couchers.helpers.badges import user_add_badge, user_remove_badge
from couchers.helpers.clusters import create_cluster, create_node
from couchers.helpers.geoip import geoip_approximate_location, geoip_asn
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    AccountDeletionToken,
    Comment,
    ContentReport,
    Discussion,
    Event,
    EventCommunityInviteRequest,
    EventOccurrence,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    Message,
    ModNote,
    Node,
    Reference,
    Reply,
    User,
    UserActivity,
    UserBadge,
)
from couchers.notifications.notify import notify
from couchers.resources import get_badge_dict
from couchers.servicers.api import get_strong_verification_fields, user_model_to_pb
from couchers.servicers.auth import create_session
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import get_users_to_notify_for_new_event
from couchers.servicers.threads import unpack_thread_id
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime, date_to_api, now, parse_date, to_aware_datetime
from proto import admin_pb2, admin_pb2_grpc, notification_data_pb2
from proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 250


def _user_to_details(session, user):
    return admin_pb2.UserDetails(
        user_id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        gender=user.gender,
        birthdate=date_to_api(user.birthdate),
        banned=user.is_banned,
        deleted=user.is_deleted,
        do_not_email=user.do_not_email,
        badges=[badge.badge_id for badge in user.badges],
        **get_strong_verification_fields(session, user),
        has_passport_sex_gender_exception=user.has_passport_sex_gender_exception,
        admin_note=user.admin_note,
        pending_mod_notes_count=user.mod_notes.where(ModNote.is_pending).count(),
        acknowledged_mod_notes_count=user.mod_notes.where(~ModNote.is_pending).count(),
    )


def _content_report_to_pb(content_report: ContentReport):
    return admin_pb2.ContentReport(
        content_report_id=content_report.id,
        time=Timestamp_from_datetime(content_report.time),
        reporting_user_id=content_report.reporting_user_id,
        author_user_id=content_report.author_user_id,
        reason=content_report.reason,
        description=content_report.description,
        content_ref=content_report.content_ref,
        user_agent=content_report.user_agent,
        page=content_report.page,
    )


def append_admin_note(session, context, user, note):
    if not note.strip():
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.ADMIN_NOTE_CANT_BE_EMPTY)
    admin = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
    user.admin_note += f"\n[{now().isoformat()}] (id: {admin.id}, username: {admin.username}) {note}\n"


def load_community_geom(geojson, context):
    geom = shape(json.loads(geojson))

    if geom.geom_type != "MultiPolygon":
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_MULTIPOLYGON)

    return geom


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserDetails(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        return _user_to_details(session, user)

    def GetUser(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        return user_model_to_pb(user, session, context)

    def ChangeUserGender(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        user.gender = request.gender
        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action="gender:change",
            data=notification_data_pb2.GenderChange(
                gender=request.gender,
            ),
        )

        return _user_to_details(session, user)

    def ChangeUserBirthdate(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        user.birthdate = parse_date(request.birthdate)
        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action="birthdate:change",
            data=notification_data_pb2.BirthdateChange(
                birthdate=request.birthdate,
            ),
        )

        return _user_to_details(session, user)

    def AddBadge(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        badge = get_badge_dict().get(request.badge_id)
        if not badge:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.BADGE_NOT_FOUND)

        if not badge["admin_editable"]:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ADMIN_CANNOT_EDIT_BADGE)

        if badge["id"] in [b.badge_id for b in user.badges]:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_ALREADY_HAS_BADGE)

        user_add_badge(session, user.id, request.badge_id)

        return _user_to_details(session, user)

    def RemoveBadge(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        badge = get_badge_dict().get(request.badge_id)
        if not badge:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.BADGE_NOT_FOUND)

        if not badge["admin_editable"]:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ADMIN_CANNOT_EDIT_BADGE)

        user_badge = session.execute(
            select(UserBadge).where(UserBadge.user_id == user.id, UserBadge.badge_id == badge["id"])
        ).scalar_one_or_none()
        if not user_badge:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_DOES_NOT_HAVE_BADGE)

        user_remove_badge(session, user.id, request.badge_id)

        return _user_to_details(session, user)

    def SetPassportSexGenderException(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        user.has_passport_sex_gender_exception = request.passport_sex_gender_exception
        return _user_to_details(session, user)

    def BanUser(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        append_admin_note(session, context, user, request.admin_note)
        user.is_banned = True
        return _user_to_details(session, user)

    def UnbanUser(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        append_admin_note(session, context, user, request.admin_note)
        user.is_banned = False
        return _user_to_details(session, user)

    def AddAdminNote(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        append_admin_note(session, context, user, request.admin_note)
        return _user_to_details(session, user)

    def GetContentReport(self, request, context, session):
        content_report = session.execute(
            select(ContentReport).where(ContentReport.id == request.content_report_id)
        ).scalar_one_or_none()
        if not content_report:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.CONTENT_REPORT_NOT_FOUND)
        return admin_pb2.GetContentReportRes(
            content_report=_content_report_to_pb(content_report),
        )

    def GetContentReportsForAuthor(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        content_reports = (
            session.execute(
                select(ContentReport).where(ContentReport.author_user_id == user.id).order_by(ContentReport.id.desc())
            )
            .scalars()
            .all()
        )
        return admin_pb2.GetContentReportsForAuthorRes(
            content_reports=[_content_report_to_pb(content_report) for content_report in content_reports],
        )

    def SendModNote(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        session.add(
            ModNote(
                user_id=user.id,
                internal_id=request.internal_id,
                creator_user_id=context.user_id,
                note_content=request.content,
            )
        )
        session.flush()

        if not request.do_not_notify:
            notify(
                session,
                user_id=user.id,
                topic_action="modnote:create",
            )

        return _user_to_details(session, user)

    def DeleteUser(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        user.is_deleted = True
        return _user_to_details(session, user)

    def CreateApiKey(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        token, expiry = create_session(
            context, session, user, long_lived=True, is_api_key=True, duration=timedelta(days=365), set_cookie=False
        )

        notify(
            session,
            user_id=user.id,
            topic_action="api_key:create",
            data=notification_data_pb2.ApiKeyCreate(
                api_key=token,
                expiry=Timestamp_from_datetime(expiry),
            ),
        )

        return _user_to_details(session, user)

    def CreateCommunity(self, request, context, session):
        geom = load_community_geom(request.geojson, context)

        parent_node_id = request.parent_node_id if request.parent_node_id != 0 else None
        node = create_node(session, geom, parent_node_id)
        create_cluster(session, node.id, request.name, request.description, context.user_id, request.admin_ids, True)

        return community_to_pb(session, node, context)

    def UpdateCommunity(self, request, context, session):
        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
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

    def GetChats(self, request, context, session):
        def format_user(user):
            return f"{user.name} ({user.username}, {user.id})"

        def format_conversation(conversation_id):
            out = ""
            messages = (
                session.execute(
                    select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id.asc())
                )
                .scalars()
                .all()
            )
            for message in messages:
                out += f"Message {message.id} by {format_user(message.author)} at {message.time}\nType={message.message_type}, host_req_status_change={message.host_request_status_target}\n\n"
                out += str(message.text)
                out += "\n\n-----\n"
            out += "\n\n\n\n"
            return out

        def format_host_request(host_request_id):
            out = ""
            host_request = session.execute(
                select(HostRequest).where(HostRequest.conversation_id == host_request_id)
            ).scalar_one()
            out += "==============================\n"
            out += f"Host request {host_request.conversation_id} from {format_user(host_request.surfer)} to {format_user(host_request.host)}.\nCurrent state = {host_request.status}\n\nMessages:\n"
            out += format_conversation(host_request.conversation_id)
            out += "\n\n\n\n"
            return out

        def format_group_chat(group_chat_id):
            out = ""
            group_chat = session.execute(
                select(GroupChat).where(GroupChat.conversation_id == group_chat_id)
            ).scalar_one()
            out += "==============================\n"
            out += f"Group chat {group_chat.conversation_id}. Created by {format_user(group_chat.creator)}, is_dm={group_chat.is_dm}\nName: {group_chat.title}\nMembers:\n"
            subs = (
                session.execute(
                    select(GroupChatSubscription)
                    .where(GroupChatSubscription.group_chat_id == group_chat.conversation_id)
                    .order_by(GroupChatSubscription.joined.asc())
                )
                .scalars()
                .all()
            )
            for sub in subs:
                out += f"{format_user(sub.user)} joined at {sub.joined} (left at {sub.left}), role={sub.role}\n"
            out += "\n\nMessages:\n"
            out += format_conversation(group_chat.conversation_id)
            out += "\n\n\n\n"
            return out

        def format_all_chats_for_user(user_id):
            out = ""
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            out += f"Chats for user {format_user(user)}\n"
            host_request_ids = (
                session.execute(
                    select(HostRequest.conversation_id)
                    .where(or_(HostRequest.host_user_id == user_id, HostRequest.surfer_user_id == user_id))
                    .order_by(HostRequest.conversation_id.desc())
                )
                .scalars()
                .all()
            )
            out += f"************************************* Requests ({len(host_request_ids)})\n"
            for host_request in host_request_ids:
                out += format_host_request(host_request)
            group_chat_ids = (
                session.execute(
                    select(GroupChatSubscription.group_chat_id)
                    .where(GroupChatSubscription.user_id == user_id)
                    .order_by(GroupChatSubscription.joined.desc())
                )
                .scalars()
                .all()
            )
            out += f"************************************* Group chats ({len(group_chat_ids)})\n"
            for group_chat_id in group_chat_ids:
                out += format_group_chat(group_chat_id)
            return out

        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        return admin_pb2.GetChatsRes(response=format_all_chats_for_user(user.id))

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
            return admin_pb2.EventCommunityInviteRequest(
                event_community_invite_request_id=request.id,
                user_id=request.user_id,
                event_url=urls.event_link(occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug),
                approx_users_to_notify=len(users_to_notify),
                community_id=node_id,
            )

        return admin_pb2.ListEventCommunityInviteRequestsRes(
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
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_COMMUNITY_INVITE_NOT_FOUND)

        if req.decided:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.EVENT_COMMUNITY_INVITE_ALREADY_DECIDED)

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

        return admin_pb2.DecideEventCommunityInviteRequestRes()

    def DeleteEvent(self, request, context, session):
        res = session.execute(
            select(Event, EventOccurrence)
            .where(EventOccurrence.id == request.event_id)
            .where(EventOccurrence.event_id == Event.id)
            .where(~EventOccurrence.is_deleted)
        ).one_or_none()

        if not res:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.EVENT_NOT_FOUND)

        event, occurrence = res

        occurrence.is_deleted = True

        queue_job(
            session,
            "generate_event_delete_notifications",
            payload=jobs_pb2.GenerateEventDeleteNotificationsPayload(
                occurrence_id=occurrence.id,
            ),
        )

        return empty_pb2.Empty()

    def ListUserIds(self, request, context, session):
        start_date = request.start_time.ToDatetime()
        end_date = request.end_time.ToDatetime()

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0

        user_ids = (
            session.execute(
                select(User.id)
                .where(User.id >= next_user_id)
                .where(User.joined >= start_date)
                .where(User.joined <= end_date)
                .order_by(User.joined.desc())
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )

        return admin_pb2.ListUserIdsRes(
            user_ids=user_ids[:page_size],
            next_page_token=str(user_ids[-1]) if len(user_ids) > page_size else None,
        )

    def EditReferenceText(self, request, context, session):
        reference = session.execute(select(Reference).where(Reference.id == request.reference_id)).scalar_one_or_none()

        if reference is None:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.REFERENCE_NOT_FOUND)

        if not request.new_text.strip():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REFERENCE_NO_TEXT)

        reference.text = request.new_text.strip()
        return empty_pb2.Empty()

    def DeleteReference(self, request, context, session):
        reference = session.execute(select(Reference).where(Reference.id == request.reference_id)).scalar_one_or_none()

        if reference is None:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.REFERENCE_NOT_FOUND)

        reference.is_deleted = True
        return empty_pb2.Empty()

    def EditDiscussion(self, request, context, session):
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if request.new_title:
            discussion.title = request.new_title.strip()
        if request.new_content:
            discussion.content = request.new_content.strip()
        return empty_pb2.Empty()

    def EditReply(self, request, context, session):
        database_id, depth = unpack_thread_id(request.reply_id)
        if depth == 1:
            obj = session.execute(select(Comment).where(Comment.id == database_id)).scalar_one_or_none()
        elif depth == 2:
            obj = session.execute(select(Reply).where(Reply.id == database_id)).scalar_one_or_none()
        if not obj:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.OBJECT_NOT_FOUND)
        obj.content = request.new_content.strip()
        return empty_pb2.Empty()

    def CreateAccountDeletionLink(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
        expiry_days = request.expiry_days or 7
        token = AccountDeletionToken(token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2))
        session.add(token)
        return admin_pb2.CreateAccountDeletionLinkRes(
            account_deletion_confirm_url=urls.delete_account_link(account_deletion_token=token.token)
        )

    def AccessStats(self, request, context, session):
        user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        start_time = to_aware_datetime(request.start_time) if request.start_time else now() - timedelta(days=90)
        end_time = to_aware_datetime(request.end_time) if request.end_time else now()

        user_activity = session.execute(
            select(
                UserActivity.ip_address,
                UserActivity.user_agent,
                func.sum(UserActivity.api_calls),
                func.count(UserActivity.period),
                func.min(UserActivity.period),
                func.max(UserActivity.period),
            )
            .where(UserActivity.user_id == user.id)
            .where(UserActivity.period >= start_time)
            .where(UserActivity.period >= end_time)
            .order_by(func.max(UserActivity.period).desc())
            .group_by(UserActivity.ip_address, UserActivity.user_agent)
        ).all()

        out = admin_pb2.AccessStatsRes()

        for ip_address, user_agent, api_call_count, periods_count, first_seen, last_seen in user_activity:
            user_agent_data = user_agents_parse(user_agent or "")
            asn = geoip_asn(ip_address)
            out.stats.append(
                admin_pb2.AccessStat(
                    ip_address=ip_address,
                    asn=str(asn[0]) if asn else None,
                    asorg=str(asn[1]) if asn else None,
                    asnetwork=str(asn[2]) if asn else None,
                    user_agent=user_agent,
                    operating_system=user_agent_data.os.family,
                    browser=user_agent_data.browser.family,
                    device=user_agent_data.device.family,
                    approximate_location=geoip_approximate_location(ip_address) or "Unknown",
                    api_call_count=api_call_count,
                    periods_count=periods_count,
                    first_seen=Timestamp_from_datetime(first_seen),
                    last_seen=Timestamp_from_datetime(last_seen),
                )
            )

        return out
