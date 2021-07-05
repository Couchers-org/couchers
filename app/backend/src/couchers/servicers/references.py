"""
* Only one friend reference
* Multiple of the other types (one for each stay)
* Have 2 weeks to write a reference after hosting/surfing
* References become visible after min{2 weeks, both reciprocal references written}

* TODO: Get bugged about writing reference 1 day after, 1 week after, 2weeks-2days
"""
import grpc
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, literal, or_

from couchers import errors
from couchers.couchers_select import couchers_select as select
from couchers.db import session_scope
from couchers.models import HostRequest, Reference, ReferenceType, User
from couchers.tasks import send_friend_reference_email, send_host_reference_email
from couchers.utils import Timestamp_from_datetime
from proto import references_pb2, references_pb2_grpc

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
        host_request_id=reference.host_request_id
        if context.user_id in [reference.from_user_id, reference.to_user_id]
        else None,
    )


def check_valid_reference(request, context):
    if request.rating < 0 or request.rating > 1:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REFERENCE_INVALID_RATING)

    if request.text.strip() == "":
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REFERENCE_NO_TEXT)


MAX_PAGINATION_LENGTH = 25


class References(references_pb2_grpc.ReferencesServicer):
    def ListReferences(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_reference_id = int(request.page_token) if request.page_token else 0

            if not request.from_user_id and not request.to_user_id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NEED_TO_SPECIFY_AT_LEAST_ONE_USER)

            to_users = aliased(User)
            from_users = aliased(User)
            statement = select(Reference)
            if request.from_user_id:
                # join the to_users, because only interested if the recipient is visible
                statement = (
                    statement.join(to_users, Reference.to_user_id == to_users.id)
                    .where(
                        ~to_users.is_banned
                    )  # instead of filter_users; if user is deleted or blocked, reference still visible
                    .where(Reference.from_user_id == request.from_user_id)
                )
            if request.to_user_id:
                # join the from_users, because only interested if the writer is visible
                statement = (
                    statement.join(from_users, Reference.from_user_id == from_users.id)
                    .where(
                        ~from_users.is_banned
                    )  # instead of filter_users; if user is deleted or blocked, reference still visible
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

    def WriteFriendReference(self, request, context):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REFER_SELF)

        with session_scope() as session:

            check_valid_reference(request, context)

            if not session.execute(
                select(User).filter_users(context).where(User.id == request.to_user_id)
            ).scalar_one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if session.execute(
                select(Reference)
                .where(Reference.from_user_id == context.user_id)
                .where(Reference.to_user_id == request.to_user_id)
                .where(Reference.reference_type == ReferenceType.friend)
            ).scalar_one_or_none():
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)

            reference = Reference(
                from_user_id=context.user_id,
                to_user_id=request.to_user_id,
                reference_type=ReferenceType.friend,
                text=request.text,
                rating=request.rating,
                was_appropriate=request.was_appropriate,
            )
            session.add(reference)
            session.commit()

            # send the recipient of the reference an email
            send_friend_reference_email(reference)

            return reference_to_pb(reference, context)

    def WriteHostRequestReference(self, request, context):
        with session_scope() as session:
            check_valid_reference(request, context)

            host_request = session.execute(
                select(HostRequest)
                .filter_users_column(context, HostRequest.from_user_id)
                .filter_users_column(context, HostRequest.to_user_id)
                .where(HostRequest.conversation_id == request.host_request_id)
                .where(or_(HostRequest.from_user_id == context.user_id, HostRequest.to_user_id == context.user_id))
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

            other_reference = session.execute(
                select(Reference)
                .where(Reference.host_request_id == host_request.conversation_id)
                .where(Reference.to_user_id == context.user_id)
            ).scalar_one_or_none()

            reference = Reference(
                from_user_id=context.user_id,
                host_request_id=host_request.conversation_id,
                text=request.text,
                rating=request.rating,
                was_appropriate=request.was_appropriate,
            )

            if host_request.from_user_id == context.user_id:
                # we requested to surf with someone
                reference.reference_type = ReferenceType.surfed
                reference.to_user_id = host_request.to_user_id
                assert context.user_id == host_request.from_user_id
            else:
                # we hosted someone
                reference.reference_type = ReferenceType.hosted
                reference.to_user_id = host_request.from_user_id
                assert context.user_id == host_request.to_user_id

            session.add(reference)
            session.commit()

            # send the recipient of the reference an email
            send_host_reference_email(reference, both_written=other_reference is not None)

            return reference_to_pb(reference, context)

    def AvailableWriteReferences(self, request, context):
        # can't write anything for ourselves, but let's return empty so this can be used generically on profile page
        if request.to_user_id == context.user_id:
            return references_pb2.AvailableWriteReferencesRes()

        with session_scope() as session:
            if not session.execute(
                select(User).filter_users(context).where(User.id == request.to_user_id)
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
                session.query(literal(True), HostRequest)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        Reference.from_user_id == context.user_id,
                    ),
                )
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.from_user_id == context.user_id)
                .where(HostRequest.to_user_id == request.to_user_id)
            )

            q2 = (
                session.query(literal(False), HostRequest)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        Reference.from_user_id == context.user_id,
                    ),
                )
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.from_user_id == request.to_user_id)
                .where(HostRequest.to_user_id == context.user_id)
            )

            host_request_references = q1.union_all(q2).order_by(HostRequest.end_time_to_write_reference.asc()).all()

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

    def ListPendingReferencesToWrite(self, request, context):
        with session_scope() as session:
            q1 = (
                session.query(literal(True), HostRequest)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        Reference.from_user_id == context.user_id,
                    ),
                )
                .filter_users_column(context, HostRequest.to_user_id)
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.from_user_id == context.user_id)
            )

            q2 = (
                session.query(literal(False), HostRequest)
                .outerjoin(
                    Reference,
                    and_(
                        Reference.host_request_id == HostRequest.conversation_id,
                        Reference.from_user_id == context.user_id,
                    ),
                )
                .filter_users_column(context, HostRequest.from_user_id)
                .where(Reference.id == None)
                .where(HostRequest.can_write_reference)
                .where(HostRequest.to_user_id == context.user_id)
            )

            host_request_references = q1.union_all(q2).order_by(HostRequest.end_time_to_write_reference.asc()).all()

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
