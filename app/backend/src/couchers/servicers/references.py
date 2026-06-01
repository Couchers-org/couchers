"""
* Only one friend reference
* Multiple of the other types (one for each stay)
* Have 2 weeks to write a reference after hosting/surfing
* References become visible after min{2 weeks, both reciprocal references written}
"""

from datetime import datetime

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import and_, func, literal, or_, union_all

from couchers.context import CouchersContext, make_background_user_context
from couchers.db import are_friends
from couchers.event_log import log_event
from couchers.materialized_views import LiteUser
from couchers.models import HostRequest, ModerationObjectType, Reference, ReferenceType, User
from couchers.models.notifications import NotificationTopicAction
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import notify
from couchers.proto import notification_data_pb2, references_pb2, references_pb2_grpc
from couchers.servicers.api import user_model_to_pb
from couchers.sql import users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.tasks import maybe_send_reference_report_email
from couchers.utils import Timestamp_from_datetime, now

MAX_PAGINATION_LENGTH = 100

reftype2sql = {
    references_pb2.ReferenceType.REFERENCE_TYPE_FRIEND: ReferenceType.friend,
    references_pb2.ReferenceType.REFERENCE_TYPE_SURFED: ReferenceType.surfed,
    references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED: ReferenceType.hosted,
}

reftype2api = {
    ReferenceType.friend: references_pb2.ReferenceType.REFERENCE_TYPE_FRIEND,
    ReferenceType.surfed: references_pb2.ReferenceType.REFERENCE_TYPE_SURFED,
    ReferenceType.hosted: references_pb2.ReferenceType.REFERENCE_TYPE_HOSTED,
}


def reference_to_pb(reference: Reference, context: CouchersContext) -> references_pb2.Reference:
    return references_pb2.Reference(
        reference_id=reference.id,
        from_user_id=reference.from_user_id,
        to_user_id=reference.to_user_id,
        reference_type=reftype2api[reference.reference_type],
        text=reference.text,
        written_time=Timestamp_from_datetime(reference.time.replace(hour=0, minute=0, second=0, microsecond=0)),
        host_request_id=(
            reference.host_request_id if context.user_id in [reference.from_user_id, reference.to_user_id] else None
        ),
    )


def get_host_req_and_check_can_write_ref(
    session: Session, context: CouchersContext, host_request_id: int
) -> tuple[HostRequest, bool]:
    """
    Checks that this can see the given host req and write a ref for it

    Returns the host req and `surfed`, a boolean of if the user was the surfer or not
    """
    query = select(HostRequest)
    query = where_users_column_visible(query, context, HostRequest.initiator_user_id)
    query = where_users_column_visible(query, context, HostRequest.recipient_user_id)
    query = where_moderated_content_visible(query, context, HostRequest, is_list_operation=False)
    query = query.where(HostRequest.conversation_id == host_request_id)
    query = query.where(
        or_(HostRequest.initiator_user_id == context.user_id, HostRequest.recipient_user_id == context.user_id)
    )
    host_request = session.execute(query).scalar_one_or_none()

    if not host_request:
        context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

    if not host_request.can_write_reference:
        context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_write_reference_for_request")

    if session.execute(
        select(Reference)
        .where(Reference.host_request_id == host_request.conversation_id)
        .where(Reference.from_user_id == context.user_id)
    ).scalar_one_or_none():
        context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "reference_already_given")

    surfed = host_request.initiator_user_id == context.user_id

    if surfed:
        my_reason = host_request.initiator_reason_didnt_meetup
    else:
        my_reason = host_request.recipient_reason_didnt_meetup

    if my_reason != None:
        context.abort_with_error_code(
            grpc.StatusCode.FAILED_PRECONDITION, "cant_write_reference_indicated_didnt_meetup"
        )

    return host_request, surfed


def check_valid_reference(
    request: references_pb2.WriteFriendReferenceReq | references_pb2.WriteHostRequestReferenceReq,
    context: CouchersContext,
) -> None:
    if request.rating < 0 or request.rating > 1:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "reference_invalid_rating")

    if request.text.strip() == "":
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "reference_no_text")


def get_pending_references_to_write(
    session: Session, context: CouchersContext
) -> list[tuple[int, ReferenceType, datetime, LiteUser]]:
    q1 = (
        select(literal(True), HostRequest, LiteUser)
        .outerjoin(
            Reference,
            and_(
                Reference.host_request_id == HostRequest.conversation_id,
                Reference.from_user_id == context.user_id,
            ),
        )
        .join(LiteUser, LiteUser.id == HostRequest.recipient_user_id)
    )
    q1 = where_users_column_visible(q1, context, HostRequest.recipient_user_id)
    q1 = where_moderated_content_visible(q1, context, HostRequest, is_list_operation=True)
    q1 = q1.where(Reference.id == None)
    q1 = q1.where(HostRequest.can_write_reference)
    q1 = q1.where(HostRequest.initiator_user_id == context.user_id)
    q1 = q1.where(HostRequest.initiator_reason_didnt_meetup == None)

    q2 = (
        select(literal(False), HostRequest, LiteUser)
        .outerjoin(
            Reference,
            and_(
                Reference.host_request_id == HostRequest.conversation_id,
                Reference.from_user_id == context.user_id,
            ),
        )
        .join(LiteUser, LiteUser.id == HostRequest.initiator_user_id)
    )
    q2 = where_users_column_visible(q2, context, HostRequest.initiator_user_id)
    q2 = where_moderated_content_visible(q2, context, HostRequest, is_list_operation=True)
    q2 = q2.where(Reference.id == None)
    q2 = q2.where(HostRequest.can_write_reference)
    q2 = q2.where(HostRequest.recipient_user_id == context.user_id)
    q2 = q2.where(HostRequest.recipient_reason_didnt_meetup == None)

    union = union_all(q1, q2).order_by(HostRequest.end_time_to_write_reference.asc()).subquery()
    query = select(union.c[0].label("surfed"), aliased(HostRequest, union), aliased(LiteUser, union))
    host_request_references = session.execute(query).all()

    return [
        (
            host_request.conversation_id,
            ReferenceType.surfed if surfed else ReferenceType.hosted,
            host_request.end_time_to_write_reference,
            other_user,
        )
        for surfed, host_request, other_user in host_request_references
    ]


class References(references_pb2_grpc.ReferencesServicer):
    def ListReferences(
        self, request: references_pb2.ListReferencesReq, context: CouchersContext, session: Session
    ) -> references_pb2.ListReferencesRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_reference_id = int(request.page_token) if request.page_token else 0

        if not request.from_user_id and not request.to_user_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "need_to_specify_at_least_one_user")

        to_users = aliased(User)
        from_users = aliased(User)
        statement = where_moderated_content_visible(select(Reference), context, Reference, is_list_operation=True)
        if request.from_user_id:
            # join the to_users, because only interested if the recipient is visible
            statement = (
                statement.join(to_users, Reference.to_user_id == to_users.id)
                .where(
                    to_users.banned_at.is_(None)
                )  # instead of where_users_visible; if user is deleted or blocked, reference still visible
                .where(or_(to_users.shadowed_at.is_(None), to_users.id == context.user_id))
                .where(Reference.from_user_id == request.from_user_id)
            )
        if request.to_user_id:
            # join the from_users, because only interested if the writer is visible
            statement = (
                statement.join(from_users, Reference.from_user_id == from_users.id)
                .where(
                    from_users.banned_at.is_(None)
                )  # instead of where_users_visible; if user is deleted or blocked, reference still visible
                .where(or_(from_users.shadowed_at.is_(None), from_users.id == context.user_id))
                .where(Reference.to_user_id == request.to_user_id)
            )
        if len(request.reference_type_filter) > 0:
            statement = statement.where(
                Reference.reference_type.in_([reftype2sql[t] for t in request.reference_type_filter])
            )

        if next_reference_id:
            statement = statement.where(Reference.id <= next_reference_id)

        # Reference visibility logic:
        # A reference is visible if any of the following apply:
        # 1. It is a friend reference
        # 2. Both references have been written
        # 3. It has been over 2 weeks since the host request ended

        # we get the matching other references through this subquery
        sub = select(Reference.id.label("sub_id"), Reference.host_request_id).where(
            Reference.reference_type != ReferenceType.friend
        )
        if request.from_user_id:
            sub = sub.where(Reference.to_user_id == request.from_user_id)
        if request.to_user_id:
            sub = sub.where(Reference.from_user_id == request.to_user_id)

        query = sub.subquery()
        statement = (
            statement.outerjoin(query, query.c.host_request_id == Reference.host_request_id)
            .outerjoin(HostRequest, HostRequest.conversation_id == Reference.host_request_id)
            .where(
                or_(
                    Reference.reference_type == ReferenceType.friend,
                    query.c.sub_id != None,
                    HostRequest.end_time_to_write_reference < func.now(),
                )
            )
        )

        statement = statement.order_by(Reference.id.desc()).limit(page_size + 1)
        references = session.execute(statement).scalars().all()

        return references_pb2.ListReferencesRes(
            references=[reference_to_pb(reference, context) for reference in references[:page_size]],
            next_page_token=str(references[-1].id) if len(references) > page_size else None,
        )

    def WriteFriendReference(
        self, request: references_pb2.WriteFriendReferenceReq, context: CouchersContext, session: Session
    ) -> references_pb2.Reference:
        if context.user_id == request.to_user_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_refer_self")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        check_valid_reference(request, context)

        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.to_user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        if not are_friends(session, context, request.to_user_id):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "can_only_refer_friends")

        if session.execute(
            select(Reference)
            .where(Reference.from_user_id == context.user_id)
            .where(Reference.to_user_id == request.to_user_id)
            .where(Reference.reference_type == ReferenceType.friend)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "reference_already_given")

        reference_text = request.text.strip()

        reference: Reference | None = None

        def create_object(moderation_state_id: int) -> int:
            nonlocal reference
            reference = Reference(
                from_user_id=context.user_id,
                to_user_id=request.to_user_id,
                reference_type=ReferenceType.friend,
                text=reference_text,
                private_text=request.private_text.strip(),
                rating=request.rating,
                was_appropriate=request.was_appropriate,
                moderation_state_id=moderation_state_id,
            )
            session.add(reference)
            session.flush()
            return reference.id

        create_moderation(
            session=session,
            object_type=ModerationObjectType.reference,
            object_id=create_object,
            creator_user_id=context.user_id,
        )
        assert reference is not None
        session.commit()

        # send the recipient of the reference a reminder
        notify(
            session,
            user_id=request.to_user_id,
            topic_action=NotificationTopicAction.reference__receive_friend,
            key=str(reference.id),
            data=notification_data_pb2.ReferenceReceiveFriend(
                from_user=user_model_to_pb(user, session, make_background_user_context(user_id=request.to_user_id)),
                text=reference_text,
            ),
            moderation_state_id=reference.moderation_state_id,
        )

        # possibly send out an alert to the mod team if the reference was bad
        maybe_send_reference_report_email(session, reference)

        log_event(
            context,
            session,
            "reference.friend_written",
            {
                "to_user_id": request.to_user_id,
                "rating": request.rating,
                "was_appropriate": request.was_appropriate,
            },
        )

        return reference_to_pb(reference, context)

    def WriteHostRequestReference(
        self, request: references_pb2.WriteHostRequestReferenceReq, context: CouchersContext, session: Session
    ) -> references_pb2.Reference:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        check_valid_reference(request, context)

        host_request, surfed = get_host_req_and_check_can_write_ref(session, context, request.host_request_id)

        reference_text = request.text.strip()

        if surfed:
            # we requested to surf with someone
            reference_type = ReferenceType.surfed
            to_user_id = host_request.recipient_user_id
            assert context.user_id == host_request.initiator_user_id
        else:
            # we hosted someone
            reference_type = ReferenceType.hosted
            to_user_id = host_request.initiator_user_id
            assert context.user_id == host_request.recipient_user_id

        reference: Reference | None = None

        def create_object(moderation_state_id: int) -> int:
            nonlocal reference
            reference = Reference(
                from_user_id=context.user_id,
                to_user_id=to_user_id,
                host_request_id=host_request.conversation_id,
                text=reference_text,
                private_text=request.private_text.strip(),
                rating=request.rating,
                was_appropriate=request.was_appropriate,
                reference_type=reference_type,
                moderation_state_id=moderation_state_id,
            )
            session.add(reference)
            session.flush()
            return reference.id

        create_moderation(
            session=session,
            object_type=ModerationObjectType.reference,
            object_id=create_object,
            creator_user_id=context.user_id,
        )
        assert reference is not None
        session.commit()

        other_reference = session.execute(
            select(Reference)
            .where(Reference.host_request_id == host_request.conversation_id)
            .where(Reference.to_user_id == context.user_id)
        ).scalar_one_or_none()

        # send notification out
        topic_action = (
            NotificationTopicAction.reference__receive_surfed
            if surfed
            else NotificationTopicAction.reference__receive_hosted
        )
        notify(
            session,
            user_id=reference.to_user_id,
            topic_action=topic_action,
            key=str(host_request.conversation_id),
            data=notification_data_pb2.ReferenceReceiveHostRequest(
                host_request_id=host_request.conversation_id,
                from_user=user_model_to_pb(user, session, make_background_user_context(user_id=reference.to_user_id)),
                text=reference_text if other_reference is not None else None,
            ),
            moderation_state_id=reference.moderation_state_id,
        )

        # possibly send out an alert to the mod team if the reference was bad
        maybe_send_reference_report_email(session, reference)

        log_event(
            context,
            session,
            "reference.host_request_written",
            {
                "to_user_id": to_user_id,
                "host_request_id": host_request.conversation_id,
                "reference_type": reference_type.name,
                "rating": request.rating,
                "was_appropriate": request.was_appropriate,
            },
        )

        return reference_to_pb(reference, context)

    def HostRequestIndicateDidntMeetup(
        self, request: references_pb2.HostRequestIndicateDidntMeetupReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        host_request, surfed = get_host_req_and_check_can_write_ref(session, context, request.host_request_id)

        reason = request.reason_didnt_meetup.strip()

        if surfed:
            host_request.initiator_reason_didnt_meetup = reason
        else:
            host_request.recipient_reason_didnt_meetup = reason

        return empty_pb2.Empty()

    def AvailableWriteReferences(
        self, request: references_pb2.AvailableWriteReferencesReq, context: CouchersContext, session: Session
    ) -> references_pb2.AvailableWriteReferencesRes:
        # can't write anything for ourselves, but let's return empty so this can be used generically on profile page
        if request.to_user_id == context.user_id:
            return references_pb2.AvailableWriteReferencesRes()

        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.to_user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        can_write_friend_reference = (
            session.execute(
                select(Reference)
                .where(Reference.from_user_id == context.user_id)
                .where(Reference.to_user_id == request.to_user_id)
                .where(Reference.reference_type == ReferenceType.friend)
            ).scalar_one_or_none()
        ) is None

        q1 = (
            select(literal(True), HostRequest)
            .outerjoin(
                Reference,
                and_(
                    Reference.host_request_id == HostRequest.conversation_id,
                    Reference.from_user_id == context.user_id,
                ),
            )
            .where(Reference.id == None)
            .where(HostRequest.can_write_reference)
            .where(HostRequest.initiator_user_id == context.user_id)
            .where(HostRequest.recipient_user_id == request.to_user_id)
            .where(HostRequest.initiator_reason_didnt_meetup == None)
        )

        q2 = (
            select(literal(False), HostRequest)
            .outerjoin(
                Reference,
                and_(
                    Reference.host_request_id == HostRequest.conversation_id,
                    Reference.from_user_id == context.user_id,
                ),
            )
            .where(Reference.id == None)
            .where(HostRequest.can_write_reference)
            .where(HostRequest.initiator_user_id == request.to_user_id)
            .where(HostRequest.recipient_user_id == context.user_id)
            .where(HostRequest.recipient_reason_didnt_meetup == None)
        )

        union = union_all(q1, q2).order_by(HostRequest.end_time_to_write_reference.asc()).subquery()
        query = select(union.c[0].label("surfed"), aliased(HostRequest, union))
        host_request_references = session.execute(query).all()

        return references_pb2.AvailableWriteReferencesRes(
            can_write_friend_reference=can_write_friend_reference,
            available_write_references=[
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.conversation_id,
                    reference_type=reftype2api[ReferenceType.surfed if surfed else ReferenceType.hosted],
                    time_expires=Timestamp_from_datetime(host_request.end_time_to_write_reference),
                )
                for surfed, host_request in host_request_references
            ],
        )

    def ListPendingReferencesToWrite(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> references_pb2.ListPendingReferencesToWriteRes:
        return references_pb2.ListPendingReferencesToWriteRes(
            pending_references=[
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request_id,
                    reference_type=reftype2api[reference_type],
                    time_expires=Timestamp_from_datetime(end_time_to_write_reference),
                )
                for host_request_id, reference_type, end_time_to_write_reference, other_user in get_pending_references_to_write(
                    session, context
                )
            ],
        )

    def GetHostRequestReferenceStatus(
        self, request: references_pb2.GetHostRequestReferenceStatusReq, context: CouchersContext, session: Session
    ) -> references_pb2.GetHostRequestReferenceStatusRes:
        # Compute has_given (whether current user already wrote a reference for this host request)
        has_given = (
            session.execute(
                select(Reference)
                .where(Reference.host_request_id == request.host_request_id)
                .where(Reference.from_user_id == context.user_id)
            ).scalar_one_or_none()
            is not None
        )

        query = select(HostRequest)
        query = where_moderated_content_visible(query, context, HostRequest, is_list_operation=False)
        query = query.where(HostRequest.conversation_id == request.host_request_id)
        query = query.where(
            or_(HostRequest.initiator_user_id == context.user_id, HostRequest.recipient_user_id == context.user_id)
        )
        host_request = session.execute(query).scalar_one_or_none()

        can_write = False
        is_expired = False
        didnt_stay = False

        if host_request is not None:
            # Compute expired from end_time_to_write_reference
            if host_request.end_time_to_write_reference is not None:
                is_expired = host_request.end_time_to_write_reference < now()

            # Block only if current user indicated didn't meet up
            didnt_stay = (
                (host_request.initiator_reason_didnt_meetup is not None)
                if host_request.initiator_user_id == context.user_id
                else (host_request.recipient_reason_didnt_meetup is not None)
            )

            # You can write only if: host_request allows it, you didn't already give one, and you didn't indicate didn't meet up
            can_write = bool(host_request.can_write_reference) and (not has_given) and (not didnt_stay)

        return references_pb2.GetHostRequestReferenceStatusRes(
            has_given=has_given,
            can_write=can_write,
            is_expired=is_expired,
            didnt_stay=didnt_stay,
        )
