import json
import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from shapely.geometry import shape
from sqlalchemy.sql import or_, select, update

from couchers import errors, urls
from couchers.db import session_scope
from couchers.helpers.badges import user_add_badge, user_remove_badge
from couchers.helpers.clusters import create_cluster, create_node
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    Event,
    EventCommunityInviteRequest,
    EventOccurrence,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    Message,
    User,
    UserBadge,
)
from couchers.notifications.notify import notify
from couchers.resources import get_badge_dict
from couchers.servicers.api import get_strong_verification_fields
from couchers.servicers.auth import create_session
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import get_users_to_notify_for_new_event
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime, date_to_api, now, parse_date
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
    )


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserDetails(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            return _user_to_details(session, user)

    def ChangeUserGender(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.gender = request.gender
            session.commit()

            notify(
                user_id=user.id,
                topic_action="gender:change",
                data=notification_data_pb2.GenderChange(
                    gender=request.gender,
                ),
            )

            return _user_to_details(session, user)

    def ChangeUserBirthdate(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.birthdate = parse_date(request.birthdate)
            session.commit()

            notify(
                user_id=user.id,
                topic_action="birthdate:change",
                data=notification_data_pb2.BirthdateChange(
                    birthdate=request.birthdate,
                ),
            )

            return _user_to_details(session, user)

    def AddBadge(self, request, context):
        with session_scope() as session:
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

    def RemoveBadge(self, request, context):
        with session_scope() as session:
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

    def SetPassportSexGenderException(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.has_passport_sex_gender_exception = request.passport_sex_gender_exception
            return _user_to_details(session, user)

    def BanUser(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.is_banned = True
        return self.AddAdminNote(request, context)

    def AddAdminNote(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            admin = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            user.admin_note += (
                f"\n[{now().isoformat()}] (id: {admin.id}, username: {admin.username}) {request.admin_note}\n"
            )
            return _user_to_details(session, user)

    def DeleteUser(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.is_deleted = True
            return _user_to_details(session, user)

    def CreateApiKey(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            token, expiry = create_session(
                context, session, user, long_lived=True, is_api_key=True, duration=timedelta(days=365), set_cookie=False
            )

            notify(
                user_id=user.id,
                topic_action="api_key:create",
                data=notification_data_pb2.ApiKeyCreate(
                    api_key=token,
                    expiry=Timestamp_from_datetime(expiry),
                ),
            )

            return _user_to_details(session, user)

    def CreateCommunity(self, request, context):
        with session_scope() as session:
            geom = shape(json.loads(request.geojson))

            if geom.type != "MultiPolygon":
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_MULTIPOLYGON)

            parent_node_id = request.parent_node_id if request.parent_node_id != 0 else None
            node = create_node(session, geom, parent_node_id)
            create_cluster(
                session, node.id, request.name, request.description, context.user_id, request.admin_ids, True
            )

            return community_to_pb(node, context)

    def GetChats(self, request, context):
        with session_scope() as session:

            def format_user(user):
                return f"{user.name} ({user.username}, {user.id})"

            def format_conversation(conversation_id):
                out = ""
                with session_scope() as session:
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
                with session_scope() as session:
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
                with session_scope() as session:
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
                with session_scope() as session:
                    user = session.execute(select(User).where(User.id == user_id)).scalar_one()
                    out += f"Chats for user {format_user(user)}\n"
                    host_request_ids = (
                        session.execute(
                            select(HostRequest.conversation_id)
                            .where(or_(HostRequest.host_user_id == user_id, HostRequest.surfer_user_id == user_id))
                            .order_by(HostRequest.conversation_id)
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
                            .order_by(GroupChatSubscription.joined.asc())
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

    def ListEventCommunityInviteRequests(self, request, context):
        with session_scope() as session:
            # req.decided = now()
            # req.decided_by_user_id = user1.id
            # req.approved = True

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

            return admin_pb2.ListEventCommunityInviteRequestsRes(
                requests=[
                    admin_pb2.EventCommunityInviteRequest(
                        event_community_invite_request_id=request.id,
                        user_id=request.user_id,
                        event_url=urls.event_link(
                            occurrence_id=request.occurrence.id, slug=request.occurrence.event.slug
                        ),
                        approx_users_to_notify=len(get_users_to_notify_for_new_event(session, request.occurrence)[0]),
                    )
                    for request in requests[:page_size]
                ],
                next_page_token=str(requests[-1].id) if len(requests) > page_size else None,
            )

    def DecideEventCommunityInviteRequest(self, request, context):
        with session_scope() as session:
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
                    "generate_event_create_notifications",
                    payload=jobs_pb2.GenerateEventCreateNotificationsPayload(
                        inviting_user_id=req.user_id,
                        occurrence_id=req.occurrence_id,
                        approved=True,
                    ),
                )

            return admin_pb2.DecideEventCommunityInviteRequestRes()

    def DeleteEvent(self, request, context):
        with session_scope() as session:
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
                "generate_event_delete_notifications",
                payload=jobs_pb2.GenerateEventDeleteNotificationsPayload(
                    occurrence_id=occurrence.id,
                ),
            )

        return empty_pb2.Empty()
