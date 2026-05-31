import json
import logging
from datetime import UTC, datetime, timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select, tuple_
from sqlalchemy.orm import Session, aliased, selectinload
from sqlalchemy.sql import and_, func, or_
from user_agents import parse as user_agents_parse

from couchers import urls
from couchers.context import CouchersContext
from couchers.crypto import urlsafe_secure_token
from couchers.helpers.badges import user_add_badge, user_remove_badge
from couchers.helpers.geoip import geoip_approximate_location, geoip_asn
from couchers.helpers.strong_verification import get_strong_verification_fields
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    AccountDeletionToken,
    AdminAction,
    AdminActionLevel,
    AdminTag,
    Comment,
    ContentReport,
    Discussion,
    Event,
    EventOccurrence,
    FriendRelationship,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    LanguageAbility,
    Message,
    ModerationUserList,
    ModerationVisibility,
    ModNote,
    OTAPackage,
    OTAPlatform,
    Reference,
    Reply,
    User,
    UserActivity,
    UserAdminTag,
    UserBadge,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.models.uploads import Upload, has_avatar_photo_expression
from couchers.notifications.notify import notify
from couchers.proto import admin_pb2, admin_pb2_grpc, api_pb2, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.resources import get_badge_dict
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.auth import create_session
from couchers.servicers.events import generate_event_delete_notifications
from couchers.servicers.moderation import bulk_set_user_content_visibility
from couchers.servicers.threads import unpack_thread_id
from couchers.sql import to_bool, username_or_email_or_id
from couchers.utils import Timestamp_from_datetime, date_to_api, now, parse_date, to_aware_datetime

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 250


adminactionlevel2api = {
    AdminActionLevel.debug: admin_pb2.ADMIN_ACTION_LEVEL_DEBUG,
    AdminActionLevel.normal: admin_pb2.ADMIN_ACTION_LEVEL_NORMAL,
    AdminActionLevel.high: admin_pb2.ADMIN_ACTION_LEVEL_HIGH,
}

api2adminactionlevel = {
    admin_pb2.ADMIN_ACTION_LEVEL_DEBUG: AdminActionLevel.debug,
    admin_pb2.ADMIN_ACTION_LEVEL_NORMAL: AdminActionLevel.normal,
    admin_pb2.ADMIN_ACTION_LEVEL_HIGH: AdminActionLevel.high,
}

otaplatform2api = {
    OTAPlatform.ios: admin_pb2.OTA_PLATFORM_IOS,
    OTAPlatform.android: admin_pb2.OTA_PLATFORM_ANDROID,
}

api2otaplatform = {
    admin_pb2.OTA_PLATFORM_IOS: OTAPlatform.ios,
    admin_pb2.OTA_PLATFORM_ANDROID: OTAPlatform.android,
}


def log_admin_action(
    session: Session,
    context: CouchersContext,
    target_user: User,
    action_type: str,
    note: str | None = None,
    data: object | None = None,
    tag: str | None = None,
    level: AdminActionLevel = AdminActionLevel.normal,
) -> AdminAction:
    action = AdminAction(
        admin_user_id=context.user_id,
        target_user_id=target_user.id,
        action_type=action_type,
        level=level,
        note=note,
        data=data,
        tag=tag,
    )
    session.add(action)
    session.flush()
    return action


def _live_ota_package_ids(session: Session) -> set[int]:
    # The package served to a matching client is the newest non-banned one per
    # (platform, runtime_version), ordered by manifest_created_at (id as tiebreak) — exactly what
    # GetNativeUpdateManifest resolves.
    rows = session.execute(
        select(OTAPackage.id, OTAPackage.platform, OTAPackage.runtime_version, OTAPackage.manifest_created_at).where(
            OTAPackage.banned.is_(False)
        )
    ).all()
    best: dict[tuple[OTAPlatform, str], tuple[datetime, int]] = {}
    for id_, platform, runtime_version, manifest_created_at in rows:
        key = (platform, runtime_version)
        rank = (manifest_created_at, id_)
        if key not in best or rank > best[key]:
            best[key] = rank
    return {id_ for _, id_ in best.values()}


def _ota_package_to_pb(package: OTAPackage, live_ids: set[int]) -> admin_pb2.OTAPackage:
    return admin_pb2.OTAPackage(
        ota_package_id=package.id,
        created=Timestamp_from_datetime(package.created),
        created_by_user_id=package.created_by_user_id,
        platform=otaplatform2api[package.platform],
        runtime_version=package.runtime_version,
        version=package.version,
        manifest_created_at=Timestamp_from_datetime(package.manifest_created_at),
        manifest_id=package.manifest_id,
        note=package.note or "",
        banned=package.banned,
        banned_at=Timestamp_from_datetime(package.banned_at) if package.banned_at else None,
        banned_by_user_id=package.banned_by_user_id or 0,
        banned_reason=package.banned_reason or "",
        live=package.id in live_ids,
    )


def _user_to_details(session: Session, user: User) -> admin_pb2.UserDetails:
    # Query admin actions for this user
    actions = session.execute(
        select(AdminAction, User.username)
        .join(User, AdminAction.admin_user_id == User.id)
        .where(AdminAction.target_user_id == user.id)
        .order_by(AdminAction.created.asc())
    ).all()

    action_pbs = []
    for action, admin_username in actions:
        action_pbs.append(
            admin_pb2.AdminActionLog(
                admin_action_id=action.id,
                created=Timestamp_from_datetime(action.created),
                admin_user_id=action.admin_user_id,
                admin_username=admin_username,
                action_type=action.action_type,
                level=adminactionlevel2api[action.level],
                note=action.note or "",
                data=json.dumps(action.data) if action.data is not None else "",
                tag=action.tag or "",
                target_user_id=action.target_user_id,
                target_username=user.username,
            )
        )

    # Query admin tags
    admin_tags = (
        session.execute(
            select(AdminTag.tag)
            .join(UserAdminTag, UserAdminTag.admin_tag_id == AdminTag.id)
            .where(UserAdminTag.user_id == user.id)
            .order_by(AdminTag.tag)
        )
        .scalars()
        .all()
    )

    return admin_pb2.UserDetails(
        user_id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        gender=user.gender,
        birthdate=date_to_api(user.birthdate),
        banned=user.banned_at is not None,
        deleted=user.deleted_at is not None,
        shadowed=user.shadowed_at is not None,
        do_not_email=user.do_not_email,
        badges=[badge.badge_id for badge in user.badges],
        **get_strong_verification_fields(session, user),
        has_passport_sex_gender_exception=user.has_passport_sex_gender_exception,
        pending_mod_notes_count=user.mod_notes.where(ModNote.is_pending).count(),
        acknowledged_mod_notes_count=user.mod_notes.where(~ModNote.is_pending).count(),
        admin_actions=action_pbs,
        admin_tags=list(admin_tags),
        mod_score=user.mod_score,
    )


def _content_report_to_pb(content_report: ContentReport) -> admin_pb2.ContentReport:
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


def _reference_to_pb(reference: Reference) -> admin_pb2.AdminReference:
    return admin_pb2.AdminReference(
        reference_id=reference.id,
        from_user_id=reference.from_user_id,
        to_user_id=reference.to_user_id,
        reference_type=reference.reference_type.name,
        text=reference.text,
        private_text=reference.private_text or "",
        time=Timestamp_from_datetime(reference.time),
        host_request_id=reference.host_request_id or 0,
        rating=reference.rating,
        was_appropriate=reference.was_appropriate,
    )


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserDetails(
        self, request: admin_pb2.GetUserDetailsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        return _user_to_details(session, user)

    def GetUser(self, request: admin_pb2.GetUserReq, context: CouchersContext, session: Session) -> api_pb2.User:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        return user_model_to_pb(user, session, context, is_admin_see_ghosts=True)

    def SearchUsers(
        self, request: admin_pb2.SearchUsersReq, context: CouchersContext, session: Session
    ) -> admin_pb2.SearchUsersRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        statement = select(User)
        if request.username:
            statement = statement.where(User.username.ilike(request.username))
        if request.email:
            statement = statement.where(User.email.ilike(request.email))
        if request.name:
            statement = statement.where(User.name.ilike(request.name))
        if request.admin_action_log:
            statement = statement.where(
                User.id.in_(select(AdminAction.target_user_id).where(AdminAction.note.ilike(request.admin_action_log)))
            )
        if request.city:
            statement = statement.where(User.city.ilike(request.city))
        if request.min_user_id:
            statement = statement.where(User.id >= request.min_user_id)
        if request.max_user_id:
            statement = statement.where(User.id <= request.max_user_id)
        if request.min_birthdate:
            statement = statement.where(User.birthdate >= parse_date(request.min_birthdate))
        if request.max_birthdate:
            statement = statement.where(User.birthdate <= parse_date(request.max_birthdate))
        if request.genders:
            statement = statement.where(User.gender.in_(request.genders))
        if request.min_joined_date:
            statement = statement.where(User.joined >= parse_date(request.min_joined_date))
        if request.max_joined_date:
            statement = statement.where(User.joined <= parse_date(request.max_joined_date))
        if request.min_last_active_date:
            statement = statement.where(User.last_active >= parse_date(request.min_last_active_date))
        if request.max_last_active_date:
            statement = statement.where(User.last_active <= parse_date(request.max_last_active_date))
        if request.genders:
            statement = statement.where(User.gender.in_(request.genders))
        if request.language_codes:
            statement = statement.join(
                LanguageAbility,
                and_(LanguageAbility.user_id == User.id, LanguageAbility.language_code.in_(request.language_codes)),
            )
        if request.HasField("is_deleted"):
            statement = statement.where((User.deleted_at != None) == request.is_deleted.value)
        if request.HasField("is_banned"):
            statement = statement.where((User.banned_at != None) == request.is_banned.value)
        if request.HasField("is_shadowed"):
            statement = statement.where((User.shadowed_at != None) == request.is_shadowed.value)
        if request.HasField("has_avatar"):
            statement = statement.where(has_avatar_photo_expression(User) == request.has_avatar.value)
        if request.admin_tags:
            for tag_name in request.admin_tags:
                statement = statement.where(
                    User.id.in_(
                        select(UserAdminTag.user_id)
                        .join(AdminTag, UserAdminTag.admin_tag_id == AdminTag.id)
                        .where(AdminTag.tag == tag_name)
                    )
                )
        users = (
            session.execute(
                statement.where(User.id >= next_user_id)
                .order_by(User.id)
                .limit(page_size + 1)
                .options(selectinload(User.badges))
            )
            .scalars()
            .all()
        )
        logger.info(users)
        return admin_pb2.SearchUsersRes(
            users=[_user_to_details(session, user) for user in users[:page_size]],
            next_page_token=str(users[-1].id) if len(users) > page_size else None,
        )

    def ChangeUserGender(
        self, request: admin_pb2.ChangeUserGenderReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        old_gender = user.gender
        user.gender = request.gender
        log_admin_action(
            session, context, user, "change_gender", note=f"Changed from '{old_gender}' to '{request.gender}'"
        )
        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.gender__change,
            key="",
            data=notification_data_pb2.GenderChange(
                gender=request.gender,
            ),
        )

        return _user_to_details(session, user)

    def ChangeUserBirthdate(
        self, request: admin_pb2.ChangeUserBirthdateReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not (birthdate := parse_date(request.birthdate)):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_birthdate")

        old_birthdate = user.birthdate
        user.birthdate = birthdate
        log_admin_action(
            session, context, user, "change_birthdate", note=f"Changed from {old_birthdate} to {request.birthdate}"
        )
        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.birthdate__change,
            key="",
            data=notification_data_pb2.BirthdateChange(
                birthdate=request.birthdate,
            ),
        )

        return _user_to_details(session, user)

    def AddBadge(
        self, request: admin_pb2.AddBadgeReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        badge = get_badge_dict().get(request.badge_id)
        if not badge:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "badge_not_found")

        if not badge.admin_editable:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_cannot_edit_badge")

        if badge.id in [b.badge_id for b in user.badges]:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_already_has_badge")

        user_add_badge(session, user.id, request.badge_id)
        log_admin_action(session, context, user, "add_badge", note=f"Added badge {request.badge_id}")

        return _user_to_details(session, user)

    def RemoveBadge(
        self, request: admin_pb2.RemoveBadgeReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        badge = get_badge_dict().get(request.badge_id)
        if not badge:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "badge_not_found")

        if not badge.admin_editable:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "admin_cannot_edit_badge")

        user_badge = session.execute(
            select(UserBadge).where(UserBadge.user_id == user.id, UserBadge.badge_id == badge.id)
        ).scalar_one_or_none()
        if not user_badge:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_does_not_have_badge")

        user_remove_badge(session, user.id, request.badge_id)
        log_admin_action(session, context, user, "remove_badge", note=f"Removed badge {request.badge_id}")

        return _user_to_details(session, user)

    def SetPassportSexGenderException(
        self, request: admin_pb2.SetPassportSexGenderExceptionReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        old_exception = user.has_passport_sex_gender_exception
        user.has_passport_sex_gender_exception = request.passport_sex_gender_exception
        log_admin_action(
            session,
            context,
            user,
            "set_passport_sex_gender_exception",
            note=f"Changed from {old_exception} to {request.passport_sex_gender_exception}",
        )
        return _user_to_details(session, user)

    def BanUser(
        self, request: admin_pb2.BanUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not request.admin_note.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_note_cant_be_empty")
        log_admin_action(session, context, user, "ban", note=request.admin_note, level=AdminActionLevel.high)
        user.banned_at = now()
        return _user_to_details(session, user)

    def UnbanUser(
        self, request: admin_pb2.UnbanUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not request.admin_note.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_note_cant_be_empty")
        log_admin_action(session, context, user, "unban", note=request.admin_note, level=AdminActionLevel.high)
        user.banned_at = None
        return _user_to_details(session, user)

    def ShadowUser(
        self, request: admin_pb2.ShadowUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not request.admin_note.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_note_cant_be_empty")
        log_admin_action(session, context, user, "shadow", note=request.admin_note, level=AdminActionLevel.high)
        user.shadowed_at = now()
        # Bulk-shadow all UMS-governed content authored by this user so existing visible content is hidden too
        bulk_set_user_content_visibility(
            session=session,
            user=user,
            new_visibility=ModerationVisibility.shadowed,
            moderator_user_id=context.user_id,
            reason=f"User {user.id} shadowed: {request.admin_note}",
        )
        return _user_to_details(session, user)

    def UnshadowUser(
        self, request: admin_pb2.UnshadowUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not request.admin_note.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_note_cant_be_empty")
        log_admin_action(session, context, user, "unshadow", note=request.admin_note, level=AdminActionLevel.high)
        user.shadowed_at = None
        # Existing UMS content remains where moderators left it; admins can manually re-approve as appropriate
        return _user_to_details(session, user)

    def AddAdminNote(
        self, request: admin_pb2.AddAdminNoteReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        has_note = bool(request.admin_note.strip())
        has_data = bool(request.data.strip())
        if has_note == has_data:
            context.abort_with_error_code(
                grpc.StatusCode.INVALID_ARGUMENT, "admin_note_requires_exactly_one_of_note_or_data"
            )
        data = None
        if has_data:
            try:
                data = json.loads(request.data)
            except json.JSONDecodeError:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_note_data_must_be_valid_json")
        level = api2adminactionlevel.get(request.level, AdminActionLevel.normal)
        log_admin_action(
            session,
            context,
            user,
            "note",
            note=request.admin_note if has_note else None,
            data=data,
            level=level,
        )
        return _user_to_details(session, user)

    def GetContentReport(
        self, request: admin_pb2.GetContentReportReq, context: CouchersContext, session: Session
    ) -> admin_pb2.GetContentReportRes:
        content_report = session.execute(
            select(ContentReport).where(ContentReport.id == request.content_report_id)
        ).scalar_one_or_none()
        if not content_report:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "content_report_not_found")
        return admin_pb2.GetContentReportRes(
            content_report=_content_report_to_pb(content_report),
        )

    def GetContentReportsForAuthor(
        self, request: admin_pb2.GetContentReportsForAuthorReq, context: CouchersContext, session: Session
    ) -> admin_pb2.GetContentReportsForAuthorRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
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

    def SendModNote(
        self, request: admin_pb2.SendModNoteReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        session.add(
            ModNote(
                user_id=user.id,
                internal_id=request.internal_id,
                creator_user_id=context.user_id,
                note_content=request.content,
            )
        )
        session.flush()
        notify_user = "No" if request.do_not_notify else "Yes"
        log_admin_action(
            session,
            context,
            user,
            "send_mod_note",
            note=f"Notify user: {notify_user}\n\n{request.content}",
        )

        if not request.do_not_notify:
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.modnote__create,
                key="",
            )

        return _user_to_details(session, user)

    def MarkUserNeedsLocationUpdate(
        self, request: admin_pb2.MarkUserNeedsLocationUpdateReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        user.needs_to_update_location = True
        log_admin_action(
            session, context, user, "mark_needs_location_update", note="Marked user as needing location update"
        )
        return _user_to_details(session, user)

    def DeleteUser(
        self, request: admin_pb2.DeleteUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        user.deleted_at = now()
        log_admin_action(session, context, user, "delete_user", level=AdminActionLevel.high)
        return _user_to_details(session, user)

    def RecoverDeletedUser(
        self, request: admin_pb2.RecoverDeletedUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        user.deleted_at = None
        user.undelete_token = None
        user.undelete_until = None
        log_admin_action(session, context, user, "recover_user", level=AdminActionLevel.high)
        return _user_to_details(session, user)

    def CreateApiKey(
        self, request: admin_pb2.CreateApiKeyReq, context: CouchersContext, session: Session
    ) -> admin_pb2.CreateApiKeyRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        token, expiry = create_session(
            context, session, user, long_lived=True, is_api_key=True, duration=timedelta(days=365), set_cookie=False
        )
        log_admin_action(session, context, user, "create_api_key")

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.api_key__create,
            key="",
            data=notification_data_pb2.ApiKeyCreate(
                api_key=token,
                expiry=Timestamp_from_datetime(expiry),
            ),
        )

        return admin_pb2.CreateApiKeyRes()

    def GetChats(
        self, request: admin_pb2.GetChatsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.GetChatsRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        # Cache for ChatUserInfo to avoid recomputing for the same user
        user_info_cache = {}

        def get_chat_user_info(user_id: int) -> admin_pb2.ChatUserInfo:
            if user_id not in user_info_cache:
                u = session.execute(select(User).where(User.id == user_id)).scalar_one()
                user_info_cache[user_id] = admin_pb2.ChatUserInfo(
                    user_id=u.id,
                    username=u.username,
                    name=u.name,
                    birthdate=date_to_api(u.birthdate),
                    gender=u.gender,
                )
            return user_info_cache[user_id]

        def message_to_pb(message: Message) -> admin_pb2.ChatMessage:
            return admin_pb2.ChatMessage(
                message_id=message.id,
                author=get_chat_user_info(message.author_id),
                time=Timestamp_from_datetime(message.time),
                message_type=message.message_type.name if message.message_type else "",
                text=message.text or "",
                host_request_status_target=(
                    message.host_request_status_target.name if message.host_request_status_target else ""
                ),
                target=get_chat_user_info(message.target_id) if message.target_id else None,
            )

        def get_messages_for_conversation(conversation_id: int) -> list[admin_pb2.ChatMessage]:
            messages = (
                session.execute(
                    select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id.asc())
                )
                .scalars()
                .all()
            )
            return [message_to_pb(msg) for msg in messages]

        def get_host_request_pb(host_request: HostRequest) -> admin_pb2.AdminHostRequest:
            return admin_pb2.AdminHostRequest(
                host_request_id=host_request.conversation_id,
                surfer=get_chat_user_info(host_request.initiator_user_id),
                host=get_chat_user_info(host_request.recipient_user_id),
                status=host_request.status.name if host_request.status else "",
                from_date=date_to_api(host_request.from_date),
                to_date=date_to_api(host_request.to_date),
                created=Timestamp_from_datetime(host_request.conversation.created),
                messages=get_messages_for_conversation(host_request.conversation_id),
            )

        def get_group_chat_pb(group_chat: GroupChat) -> admin_pb2.AdminGroupChat:
            subs = (
                session.execute(
                    select(GroupChatSubscription)
                    .where(GroupChatSubscription.group_chat_id == group_chat.conversation_id)
                    .order_by(GroupChatSubscription.joined.asc())
                )
                .scalars()
                .all()
            )
            members = [
                admin_pb2.GroupChatMember(
                    user=get_chat_user_info(sub.user_id),
                    joined=Timestamp_from_datetime(sub.joined),
                    left=Timestamp_from_datetime(sub.left) if sub.left else None,
                    role=sub.role.name if sub.role else "",
                )
                for sub in subs
            ]
            return admin_pb2.AdminGroupChat(
                group_chat_id=group_chat.conversation_id,
                title=group_chat.title or "",
                is_dm=group_chat.is_dm,
                creator=get_chat_user_info(group_chat.creator_id),
                members=members,
                messages=get_messages_for_conversation(group_chat.conversation_id),
            )

        # Get all host requests for the user
        host_requests = (
            session.execute(
                select(HostRequest)
                .where(or_(HostRequest.recipient_user_id == user.id, HostRequest.initiator_user_id == user.id))
                .order_by(HostRequest.conversation_id.desc())
            )
            .scalars()
            .all()
        )

        # Get all group chats for the user
        group_chat_ids = (
            session.execute(
                select(GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.user_id == user.id)
                .order_by(GroupChatSubscription.joined.desc())
            )
            .scalars()
            .all()
        )
        group_chats = (
            session.execute(select(GroupChat).where(GroupChat.conversation_id.in_(group_chat_ids))).scalars().all()
        )

        # Build protobuf objects, then sort by latest message time (most recent first)
        host_request_pbs = [get_host_request_pb(hr) for hr in host_requests]
        host_request_pbs.sort(key=lambda hr: hr.messages[-1].time.seconds if hr.messages else 0, reverse=True)

        group_chat_pbs = [get_group_chat_pb(gc) for gc in group_chats]
        group_chat_pbs.sort(key=lambda gc: gc.messages[-1].time.seconds if gc.messages else 0, reverse=True)

        return admin_pb2.GetChatsRes(
            user=get_chat_user_info(user.id),
            host_requests=host_request_pbs,
            group_chats=group_chat_pbs,
        )

    def DeleteEvent(
        self, request: admin_pb2.DeleteEventReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        res = session.execute(
            select(Event, EventOccurrence)
            .where(EventOccurrence.id == request.event_id)
            .where(EventOccurrence.event_id == Event.id)
            .where(~EventOccurrence.is_deleted)
        ).one_or_none()

        if not res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "event_not_found")

        event, occurrence = res

        occurrence.is_deleted = True

        queue_job(
            session,
            job=generate_event_delete_notifications,
            payload=jobs_pb2.GenerateEventDeleteNotificationsPayload(
                occurrence_id=occurrence.id,
            ),
        )

        return empty_pb2.Empty()

    def ListUserIds(
        self, request: admin_pb2.ListUserIdsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListUserIdsRes:
        start_date = to_aware_datetime(request.start_time)
        end_date = to_aware_datetime(request.end_time)

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0

        user_ids = (
            session.execute(
                select(User.id)
                .where(or_(User.id <= next_user_id, to_bool(next_user_id == 0)))
                .where(User.joined >= start_date)
                .where(User.joined <= end_date)
                .order_by(User.id.desc())
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )

        return admin_pb2.ListUserIdsRes(
            user_ids=user_ids[:page_size],
            next_page_token=str(user_ids[-1]) if len(user_ids) > page_size else None,
        )

    def EditReferenceText(
        self, request: admin_pb2.EditReferenceTextReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        reference = session.execute(select(Reference).where(Reference.id == request.reference_id)).scalar_one_or_none()

        if reference is None:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "reference_not_found")

        if not request.new_text.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "reference_no_text")

        reference.text = request.new_text.strip()
        # Log action against the reference author
        author = session.execute(select(User).where(User.id == reference.from_user_id)).scalar_one()
        log_admin_action(session, context, author, "edit_reference", note=f"Edited reference {reference.id}")
        return empty_pb2.Empty()

    def DeleteReference(
        self, request: admin_pb2.DeleteReferenceReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        context.abort_with_error_code(
            grpc.StatusCode.FAILED_PRECONDITION,
            "deletereference_deprecated_use_ums",
        )

    def GetUserReferences(
        self, request: admin_pb2.GetUserReferencesReq, context: CouchersContext, session: Session
    ) -> admin_pb2.GetUserReferencesRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        references_from = (
            session.execute(select(Reference).where(Reference.from_user_id == user.id).order_by(Reference.id.desc()))
            .scalars()
            .all()
        )

        references_to = (
            session.execute(select(Reference).where(Reference.to_user_id == user.id).order_by(Reference.id.desc()))
            .scalars()
            .all()
        )

        return admin_pb2.GetUserReferencesRes(
            references_from=[_reference_to_pb(ref) for ref in references_from],
            references_to=[_reference_to_pb(ref) for ref in references_to],
        )

    def GetFriendRequests(
        self, request: admin_pb2.GetFriendRequestsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.GetFriendRequestsRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        user_info_cache: dict[int, admin_pb2.ChatUserInfo] = {}

        def get_chat_user_info(user_id: int) -> admin_pb2.ChatUserInfo:
            if user_id not in user_info_cache:
                u = session.execute(select(User).where(User.id == user_id)).scalar_one()
                user_info_cache[user_id] = admin_pb2.ChatUserInfo(
                    user_id=u.id,
                    username=u.username,
                    name=u.name,
                    birthdate=date_to_api(u.birthdate),
                    gender=u.gender,
                )
            return user_info_cache[user_id]

        def friend_request_to_pb(rel: FriendRelationship) -> admin_pb2.AdminFriendRequest:
            return admin_pb2.AdminFriendRequest(
                friend_request_id=rel.id,
                from_user=get_chat_user_info(rel.from_user_id),
                to_user=get_chat_user_info(rel.to_user_id),
                status=rel.status.name if rel.status else "",
                time_sent=Timestamp_from_datetime(rel.time_sent),
                time_responded=Timestamp_from_datetime(rel.time_responded) if rel.time_responded else None,
                moderation_visibility=rel.moderation_state.visibility.name,
            )

        sent = (
            session.execute(
                select(FriendRelationship)
                .where(FriendRelationship.from_user_id == user.id)
                .order_by(FriendRelationship.id.desc())
            )
            .scalars()
            .all()
        )

        received = (
            session.execute(
                select(FriendRelationship)
                .where(FriendRelationship.to_user_id == user.id)
                .order_by(FriendRelationship.id.desc())
            )
            .scalars()
            .all()
        )

        return admin_pb2.GetFriendRequestsRes(
            sent=[friend_request_to_pb(rel) for rel in sent],
            received=[friend_request_to_pb(rel) for rel in received],
        )

    def EditDiscussion(
        self, request: admin_pb2.EditDiscussionReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        discussion = session.execute(
            select(Discussion).where(Discussion.id == request.discussion_id)
        ).scalar_one_or_none()
        if not discussion:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "discussion_not_found")
        if request.new_title:
            discussion.title = request.new_title.strip()
        if request.new_content:
            discussion.content = request.new_content.strip()
        return empty_pb2.Empty()

    def EditReply(self, request: admin_pb2.EditReplyReq, context: CouchersContext, session: Session) -> empty_pb2.Empty:
        database_id, depth = unpack_thread_id(request.reply_id)
        if depth == 1:
            obj: Comment | Reply | None = session.execute(
                select(Comment).where(Comment.id == database_id)
            ).scalar_one_or_none()
        elif depth == 2:
            obj = session.execute(select(Reply).where(Reply.id == database_id)).scalar_one_or_none()
        else:
            obj = None

        if not obj:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "object_not_found")
        obj.content = request.new_content.strip()
        return empty_pb2.Empty()

    def AddUsersToModerationUserList(
        self, request: admin_pb2.AddUsersToModerationUserListReq, context: CouchersContext, session: Session
    ) -> admin_pb2.AddUsersToModerationUserListRes:
        """Add multiple users to a moderation user list. If no moderation list is provided, a new one is created.
        Id of the moderation list is returned."""
        req_users = request.users
        users = []

        for req_user in req_users:
            user = session.execute(select(User).where(username_or_email_or_id(req_user))).scalar_one_or_none()
            if not user:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
            users.append(user)

        if request.moderation_list_id:
            moderation_user_list = session.get(ModerationUserList, request.moderation_list_id)
            if not moderation_user_list:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "moderation_user_list_not_found")
        # Create a new moderation user list if no one is provided
        else:
            moderation_user_list = ModerationUserList()
            session.add(moderation_user_list)
            session.flush()

        # Add users to the moderation list only if not already in it
        for user in users:
            if user not in moderation_user_list.users:
                moderation_user_list.users.append(user)
            log_admin_action(session, context, user, "add_to_moderation_list")

        return admin_pb2.AddUsersToModerationUserListRes(moderation_list_id=moderation_user_list.id)

    def ListModerationUserLists(
        self, request: admin_pb2.ListModerationUserListsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListModerationUserListsRes:
        """Lists all moderation user lists for a user."""
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        moderation_lists = [
            admin_pb2.ModerationList(
                moderation_list_id=ml.id,
                members=[_user_to_details(session, u) for u in ml.users],
            )
            for ml in user.moderation_user_lists
        ]
        return admin_pb2.ListModerationUserListsRes(moderation_lists=moderation_lists)

    def RemoveUserFromModerationUserList(
        self, request: admin_pb2.RemoveUserFromModerationUserListReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """Removes a user from a provided moderation user list."""
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        if not request.moderation_list_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_moderation_user_list_id")

        moderation_user_list = session.get(ModerationUserList, request.moderation_list_id)
        if not moderation_user_list:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "moderation_user_list_not_found")
        if user not in moderation_user_list.users:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_in_the_moderation_user_list")

        moderation_user_list.users.remove(user)
        log_admin_action(session, context, user, "remove_from_moderation_list")

        if len(moderation_user_list.users) == 0:
            session.delete(moderation_user_list)

        return empty_pb2.Empty()

    def CreateAccountDeletionLink(
        self, request: admin_pb2.CreateAccountDeletionLinkReq, context: CouchersContext, session: Session
    ) -> admin_pb2.CreateAccountDeletionLinkRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        token = AccountDeletionToken(token=urlsafe_secure_token(), user_id=user.id, expiry=now() + timedelta(hours=2))
        session.add(token)
        log_admin_action(session, context, user, "create_account_deletion_link", level=AdminActionLevel.high)
        return admin_pb2.CreateAccountDeletionLinkRes(
            account_deletion_confirm_url=urls.delete_account_link(account_deletion_token=token.token)
        )

    def AccessStats(
        self, request: admin_pb2.AccessStatsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.AccessStatsRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        start_time = (
            to_aware_datetime(request.start_time) if request.HasField("start_time") else now() - timedelta(days=90)
        )
        end_time = to_aware_datetime(request.end_time) if request.HasField("end_time") else now()

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
            .where(UserActivity.period <= end_time)
            .order_by(func.max(UserActivity.period).desc())
            .group_by(UserActivity.ip_address, UserActivity.user_agent)
        ).all()

        out = admin_pb2.AccessStatsRes()

        for ip_address, user_agent, api_call_count, periods_count, first_seen, last_seen in user_activity:
            ip_address_str = str(ip_address) if ip_address is not None else None
            user_agent_data = user_agents_parse(user_agent or "")
            asn = geoip_asn(ip_address_str)
            out.stats.append(
                admin_pb2.AccessStat(
                    ip_address=ip_address_str,
                    asn=str(asn[0]) if asn else None,
                    asorg=str(asn[1]) if asn else None,
                    asnetwork=str(asn[2]) if asn else None,
                    user_agent=user_agent,
                    operating_system=user_agent_data.os.family,
                    browser=user_agent_data.browser.family,
                    device=user_agent_data.device.family,
                    approximate_location=geoip_approximate_location(ip_address_str) or "Unknown",
                    api_call_count=api_call_count,
                    periods_count=periods_count,
                    first_seen=Timestamp_from_datetime(first_seen),
                    last_seen=Timestamp_from_datetime(last_seen),
                )
            )

        return out

    def SetLastDonated(
        self, request: admin_pb2.SetLastDonatedReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        if request.HasField("last_donated"):
            user.last_donated = to_aware_datetime(request.last_donated)
        else:
            user.last_donated = None

        log_admin_action(session, context, user, "set_last_donated")
        return _user_to_details(session, user)

    def CreateAdminTag(
        self, request: admin_pb2.CreateAdminTagReq, context: CouchersContext, session: Session
    ) -> admin_pb2.AdminTagInfo:
        if not request.tag.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "admin_tag_cant_be_empty")
        existing = session.execute(select(AdminTag).where(AdminTag.tag == request.tag.strip())).scalar_one_or_none()
        if existing:
            context.abort_with_error_code(grpc.StatusCode.ALREADY_EXISTS, "admin_tag_already_exists")
        admin_tag = AdminTag(tag=request.tag.strip())
        session.add(admin_tag)
        session.flush()
        return admin_pb2.AdminTagInfo(admin_tag_id=admin_tag.id, tag=admin_tag.tag)

    def ListAdminTags(
        self, request: admin_pb2.ListAdminTagsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListAdminTagsRes:
        tags = session.execute(select(AdminTag).order_by(AdminTag.tag)).scalars().all()
        return admin_pb2.ListAdminTagsRes(
            tags=[admin_pb2.AdminTagInfo(admin_tag_id=tag.id, tag=tag.tag) for tag in tags]
        )

    def AddAdminTagToUser(
        self, request: admin_pb2.AddAdminTagToUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        admin_tag = session.execute(select(AdminTag).where(AdminTag.tag == request.tag)).scalar_one_or_none()
        if not admin_tag:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "admin_tag_not_found")
        existing = session.execute(
            select(UserAdminTag).where(UserAdminTag.user_id == user.id, UserAdminTag.admin_tag_id == admin_tag.id)
        ).scalar_one_or_none()
        if existing:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_already_has_admin_tag")
        session.add(UserAdminTag(user_id=user.id, admin_tag_id=admin_tag.id))
        session.flush()
        log_admin_action(session, context, user, "add_tag", tag=request.tag)
        return _user_to_details(session, user)

    def RemoveAdminTagFromUser(
        self, request: admin_pb2.RemoveAdminTagFromUserReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        admin_tag = session.execute(select(AdminTag).where(AdminTag.tag == request.tag)).scalar_one_or_none()
        if not admin_tag:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "admin_tag_not_found")
        user_admin_tag = session.execute(
            select(UserAdminTag).where(UserAdminTag.user_id == user.id, UserAdminTag.admin_tag_id == admin_tag.id)
        ).scalar_one_or_none()
        if not user_admin_tag:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_does_not_have_admin_tag")
        session.delete(user_admin_tag)
        session.flush()
        log_admin_action(session, context, user, "remove_tag", tag=request.tag)
        return _user_to_details(session, user)

    def SetModScore(
        self, request: admin_pb2.SetModScoreReq, context: CouchersContext, session: Session
    ) -> admin_pb2.UserDetails:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")
        user.mod_score = request.mod_score
        log_admin_action(session, context, user, "set_mod_score", note=f"mod_score={request.mod_score}")
        return _user_to_details(session, user)

    def ListAdminActions(
        self, request: admin_pb2.ListAdminActionsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListAdminActionsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)

        admin_user = aliased(User)
        target_user = aliased(User)

        statement = (
            select(AdminAction, admin_user.username, target_user.username)
            .join(admin_user, AdminAction.admin_user_id == admin_user.id)
            .join(target_user, AdminAction.target_user_id == target_user.id)
        )

        if request.admin_user_id:
            statement = statement.where(AdminAction.admin_user_id == request.admin_user_id)
        if request.target_user_id:
            statement = statement.where(AdminAction.target_user_id == request.target_user_id)
        if request.page_token:
            statement = statement.where(AdminAction.id < int(request.page_token))

        statement = statement.order_by(AdminAction.id.desc()).limit(page_size + 1)

        rows = session.execute(statement).all()

        action_pbs = [
            admin_pb2.AdminActionLog(
                admin_action_id=action.id,
                created=Timestamp_from_datetime(action.created),
                admin_user_id=action.admin_user_id,
                admin_username=admin_username,
                action_type=action.action_type,
                level=adminactionlevel2api[action.level],
                note=action.note or "",
                data=json.dumps(action.data) if action.data is not None else "",
                tag=action.tag or "",
                target_user_id=action.target_user_id,
                target_username=target_username,
            )
            for action, admin_username, target_username in rows[:page_size]
        ]

        return admin_pb2.ListAdminActionsRes(
            admin_actions=action_pbs,
            next_page_token=str(rows[page_size - 1][0].id) if len(rows) > page_size else None,
        )

    def ListUserUploads(
        self, request: admin_pb2.ListUserUploadsReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListUserUploadsRes:
        user = session.execute(select(User).where(username_or_email_or_id(request.user))).scalar_one_or_none()
        if not user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)

        statement = select(Upload).where(Upload.creator_user_id == user.id)
        if request.page_token:
            cursor_created = session.execute(
                select(Upload.created).where(Upload.key == request.page_token)
            ).scalar_one()
            statement = statement.where(tuple_(Upload.created, Upload.key) < (cursor_created, request.page_token))

        uploads = (
            session.execute(statement.order_by(Upload.created.desc(), Upload.key.desc()).limit(page_size + 1))
            .scalars()
            .all()
        )

        return admin_pb2.ListUserUploadsRes(
            uploads=[
                admin_pb2.UserUpload(
                    key=upload.key,
                    filename=upload.filename,
                    full_url=upload.full_url,
                    thumbnail_url=upload.thumbnail_url,
                    credit=upload.credit or "",
                    created=Timestamp_from_datetime(upload.created),
                )
                for upload in uploads[:page_size]
            ],
            next_page_token=uploads[page_size - 1].key if len(uploads) > page_size else None,
        )

    def CreateOTAPackage(
        self, request: admin_pb2.CreateOTAPackageReq, context: CouchersContext, session: Session
    ) -> admin_pb2.OTAPackage:
        platform = api2otaplatform.get(request.platform)
        if platform is None:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_platform")

        if not request.version:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_version")

        try:
            manifest = json.loads(request.manifest_json)
        except json.JSONDecodeError:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_manifest_json")

        # We don't store or serve the manifest (the signed bytes come from the CDN), but we read the
        # fields we key and order on out of it: runtimeVersion is the compatibility key, createdAt is
        # the rollout-ordering lever, and id is kept for reference.
        runtime_version = manifest.get("runtimeVersion") if isinstance(manifest, dict) else None
        manifest_id = manifest.get("id") if isinstance(manifest, dict) else None
        created_at_raw = manifest.get("createdAt") if isinstance(manifest, dict) else None
        if (
            not isinstance(manifest, dict)
            or not isinstance(runtime_version, str)
            or not runtime_version
            or not isinstance(manifest_id, str)
            or not manifest_id
            or not isinstance(created_at_raw, str)
            or not created_at_raw
        ):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_manifest")
        try:
            manifest_created_at = datetime.fromisoformat(created_at_raw)
        except ValueError:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_manifest")
        if manifest_created_at.tzinfo is None:
            manifest_created_at = manifest_created_at.replace(tzinfo=UTC)

        existing = session.execute(
            select(OTAPackage.id).where(OTAPackage.platform == platform).where(OTAPackage.version == request.version)
        ).scalar_one_or_none()
        if existing is not None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "ota_package_already_exists")

        package = OTAPackage(
            created_by_user_id=context.user_id,
            platform=platform,
            runtime_version=runtime_version,
            version=request.version,
            manifest_created_at=manifest_created_at,
            manifest_id=manifest_id,
            note=request.note or None,
        )
        session.add(package)
        session.flush()

        return _ota_package_to_pb(package, _live_ota_package_ids(session))

    def ListOTAPackages(
        self, request: admin_pb2.ListOTAPackagesReq, context: CouchersContext, session: Session
    ) -> admin_pb2.ListOTAPackagesRes:
        statement = select(OTAPackage).order_by(OTAPackage.manifest_created_at.desc(), OTAPackage.id.desc())
        if request.platform != admin_pb2.OTA_PLATFORM_UNSPECIFIED:
            platform = api2otaplatform.get(request.platform)
            if platform is None:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_ota_platform")
            statement = statement.where(OTAPackage.platform == platform)
        if request.runtime_version:
            statement = statement.where(OTAPackage.runtime_version == request.runtime_version)
        if not request.include_banned:
            statement = statement.where(OTAPackage.banned.is_(False))

        packages = session.execute(statement).scalars().all()
        live_ids = _live_ota_package_ids(session)
        return admin_pb2.ListOTAPackagesRes(packages=[_ota_package_to_pb(package, live_ids) for package in packages])

    def BanOTAPackage(
        self, request: admin_pb2.BanOTAPackageReq, context: CouchersContext, session: Session
    ) -> admin_pb2.OTAPackage:
        package = session.execute(
            select(OTAPackage).where(OTAPackage.id == request.ota_package_id)
        ).scalar_one_or_none()
        if package is None:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "ota_package_not_found")

        if not package.banned:
            package.banned = True
            package.banned_at = now()
            package.banned_by_user_id = context.user_id
            package.banned_reason = request.reason or None
        session.flush()

        return _ota_package_to_pb(package, _live_ota_package_ids(session))

    def UnbanOTAPackage(
        self, request: admin_pb2.UnbanOTAPackageReq, context: CouchersContext, session: Session
    ) -> admin_pb2.OTAPackage:
        package = session.execute(
            select(OTAPackage).where(OTAPackage.id == request.ota_package_id)
        ).scalar_one_or_none()
        if package is None:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "ota_package_not_found")

        package.banned = False
        package.banned_at = None
        package.banned_by_user_id = None
        package.banned_reason = None
        session.flush()

        return _ota_package_to_pb(package, _live_ota_package_ids(session))
