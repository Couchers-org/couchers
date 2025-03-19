"""
* Only one friend reference
* Multiple of the other types (one for each stay)
* Have 2 weeks to write a reference after hosting/surfing
* References become visible after min{2 weeks, both reciprocal references written}
"""

from types import SimpleNamespace

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, literal, or_, union_all

from couchers import errors
from couchers.models import HostRequest, Reference, ReferenceType, User
from couchers.notifications.notify import notify
from couchers.servicers.api import user_model_to_pb
from couchers.sql import couchers_select as select
from couchers.tasks import maybe_send_reference_report_email
from couchers.utils import Timestamp_from_datetime
from proto import notification_data_pb2, references_pb2, references_pb2_grpc

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


def reference_to_pb(reference: Reference, context):
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


def get_host_req_and_check_can_write_ref(session, context, host_request_id):
    """
    Checks that this can see the given host req and write a ref for it

    Returns the host req and `surfed`, a boolean of if the user was the surfer or not
    """
    host_request = session.execute(
        select(HostRequest)
        .where_users_column_visible(context, HostRequest.surfer_user_id)
        .where_users_column_visible(context, HostRequest.host_user_id)
        .where(HostRequest.conversation_id == host_request_id)
        .where(or_(HostRequest.surfer_user_id == context.user_id, HostRequest.host_user_id == context.user_id))
    ).scalar_one_or_none()

    if not host_request:
        context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

    if not host_request.can_write_reference:
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_WRITE_REFERENCE_FOR_REQUEST)

    if session.execute(
        select(Reference)
        .where(Reference.host_request_id == host_request.conversation_id)
        .where(Reference.from_user_id == context.user_id)
    ).scalar_one_or_none():
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)

    surfed = host_request.surfer_user_id == context.user_id

    if surfed:
        my_reason = host_request.surfer_reason_didnt_meetup
    else:
        my_reason = host_request.host_reason_didnt_meetup

    if my_reason != None:
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_WRITE_REFERENCE_INDICATED_DIDNT_MEETUP)

    return host_request, surfed


def check_valid_reference(request, context):
    if request.rating < 0 or request.rating > 1:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REFERENCE_INVALID_RATING)

    if request.text.strip() == "":
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REFERENCE_NO_TEXT)


MAX_PAGINATION_LENGTH = 100


class References(references_pb2_grpc.ReferencesServicer):
    def ListReferences(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_reference_id = int(request.page_token) if request.page_token else 0

        if not request.from_user_id and not request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NEED_TO_SPECIFY_AT_LEAST_ONE_USER)

        to_users = aliased(User)
        from_users = aliased(User)
        statement = select(Reference).where(Reference.is_deleted == False)
        if request.from_user_id:
            # join the to_users, because only interested if the recipient is visible
            statement = (
                statement.join(to_users, Reference.to_user_id == to_users.id)
                .where(
                    ~to_users.is_banned
                )  # instead of where_users_visible; if user is deleted or blocked, reference still visible
                .where(Reference.from_user_id == request.from_user_id)
            )
        if request.to_user_id:
            # join the from_users, because only interested if the writer is visible
            statement = (
                statement.join(from_users, Reference.from_user_id == from_users.id)
                .where(
                    ~from_users.is_banned
                )  # instead of where_users_visible; if user is deleted or blocked, reference still visible
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

        sub = sub.subquery()
        statement = (
            statement.outerjoin(sub, sub.c.host_request_id == Reference.host_request_id)
            .outerjoin(HostRequest, HostRequest.conversation_id == Reference.host_request_id)
            .where(
                or_(
                    Reference.reference_type == ReferenceType.friend,
                    sub.c.sub_id != None,
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

    def WriteFriendReference(self, request, context, session):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REFER_SELF)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        check_valid_reference(request, context)

        if not session.execute(
            select(User).where_users_visible(context).where(User.id == request.to_user_id)
        ).scalar_one_or_none():
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        if session.execute(
            select(Reference)
            .where(Reference.from_user_id == context.user_id)
            .where(Reference.to_user_id == request.to_user_id)
            .where(Reference.reference_type == ReferenceType.friend)
        ).scalar_one_or_none():
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)

        reference_text = request.text.strip()

        reference = Reference(
            from_user_id=context.user_id,
            to_user_id=request.to_user_id,
            reference_type=ReferenceType.friend,
            text=reference_text,
            private_text=request.private_text.strip(),
            rating=request.rating,
            was_appropriate=request.was_appropriate,
        )
        session.add(reference)
        session.commit()

        # send the recipient of the reference a reminder
        notify(
            session,
            user_id=request.to_user_id,
            topic_action="reference:receive_friend",
            data=notification_data_pb2.ReferenceReceiveFriend(
                from_user=user_model_to_pb(user, session, SimpleNamespace(user_id=request.to_user_id)),
                text=reference_text,
            ),
        )

        # possibly send out an alert to the mod team if the reference was bad
        maybe_send_reference_report_email(session, reference)

        return reference_to_pb(reference, context)

    def WriteHostRequestReference(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        check_valid_reference(request, context)

        host_request, surfed = get_host_req_and_check_can_write_ref(session, context, request.host_request_id)

        reference_text = request.text.strip()

        reference = Reference(
            from_user_id=context.user_id,
            host_request_id=host_request.conversation_id,
            text=reference_text,
            private_text=request.private_text.strip(),
            rating=request.rating,
            was_appropriate=request.was_appropriate,
        )

        if surfed:
            # we requested to surf with someone
            reference.reference_type = ReferenceType.surfed
            reference.to_user_id = host_request.host_user_id
            assert context.user_id == host_request.surfer_user_id
        else:
            # we hosted someone
            reference.reference_type = ReferenceType.hosted
            reference.to_user_id = host_request.surfer_user_id
            assert context.user_id == host_request.host_user_id

        session.add(reference)
        session.commit()

        other_reference = session.execute(
            select(Reference)
            .where(Reference.host_request_id == host_request.conversation_id)
            .where(Reference.to_user_id == context.user_id)
        ).scalar_one_or_none()

        # send notification out
        notify(
            session,
            user_id=reference.to_user_id,
            topic_action="reference:receive_surfed" if surfed else "reference:receive_hosted",
            data=notification_data_pb2.ReferenceReceiveHostRequest(
                host_request_id=host_request.conversation_id,
                from_user=user_model_to_pb(user, session, SimpleNamespace(user_id=reference.to_user_id)),
                text=reference_text if other_reference is not None else None,
            ),
        )

        # possibly send out an alert to the mod team if the reference was bad
        maybe_send_reference_report_email(session, reference)

        return reference_to_pb(reference, context)

    def HostRequestIndicateDidntMeetup(self, request, context, session):
        host_request, surfed = get_host_req_and_check_can_write_ref(session, context, request.host_request_id)

        reason = request.reason_didnt_meetup.strip()

        if surfed:
            host_request.surfer_reason_didnt_meetup = reason
        else:
            host_request.host_reason_didnt_meetup = reason

        return empty_pb2.Empty()

    def AvailableWriteReferences(self, request, context, session):
        # can't write anything for ourselves, but let's return empty so this can be used generically on profile page
        if request.to_user_id == context.user_id:
            return references_pb2.AvailableWriteReferencesRes()

        if not session.execute(
            select(User).where_users_visible(context).where(User.id == request.to_user_id)
        ).scalar_one_or_none():
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

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
            .where(HostRequest.surfer_user_id == context.user_id)
            .where(HostRequest.host_user_id == request.to_user_id)
            .where(HostRequest.surfer_reason_didnt_meetup == None)
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
            .where(HostRequest.surfer_user_id == request.to_user_id)
            .where(HostRequest.host_user_id == context.user_id)
            .where(HostRequest.host_reason_didnt_meetup == None)
        )

        union = union_all(q1, q2).order_by(HostRequest.end_time_to_write_reference.asc()).subquery()
        union = select(union.c[0].label("surfed"), aliased(HostRequest, union))
        host_request_references = session.execute(union).all()

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

    def ListPendingReferencesToWrite(self, request, context, session):
        q1 = (
            select(literal(True), HostRequest)
            .outerjoin(
                Reference,
                and_(
                    Reference.host_request_id == HostRequest.conversation_id,
                    Reference.from_user_id == context.user_id,
                ),
            )
            .where_users_column_visible(context, HostRequest.host_user_id)
            .where(Reference.id == None)
            .where(HostRequest.can_write_reference)
            .where(HostRequest.surfer_user_id == context.user_id)
            .where(HostRequest.surfer_reason_didnt_meetup == None)
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
            .where_users_column_visible(context, HostRequest.surfer_user_id)
            .where(Reference.id == None)
            .where(HostRequest.can_write_reference)
            .where(HostRequest.host_user_id == context.user_id)
            .where(HostRequest.host_reason_didnt_meetup == None)
        )

        union = union_all(q1, q2).order_by(HostRequest.end_time_to_write_reference.asc()).subquery()
        union = select(union.c[0].label("surfed"), aliased(HostRequest, union))
        host_request_references = session.execute(union).all()

        return references_pb2.ListPendingReferencesToWriteRes(
            pending_references=[
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.conversation_id,
                    reference_type=reftype2api[ReferenceType.surfed if surfed else ReferenceType.hosted],
                    time_expires=Timestamp_from_datetime(host_request.end_time_to_write_reference),
                )
                for surfed, host_request in host_request_references
            ],
        )
