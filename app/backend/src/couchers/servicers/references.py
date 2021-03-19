"""
* Only one friend reference
* Multiple of the other types (one for each stay)
* Have 2 weeks to write a reference after hosting/surfing
* References become visible after min{2 weeks, both reciprocal references written}
* Get bugged about writing reference 1 day after, 1 week after, 2weeks-2days

TODO: timezone handling for dates
"""
import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import and_, func, or_

from couchers import errors
from couchers.db import session_scope
from couchers.models import HostRequest, Reference, ReferenceType, User
from couchers.utils import Timestamp_from_datetime, now
from pb import references_pb2, references_pb2_grpc

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


def reference_to_pb(reference: Reference, user_id):
    return references_pb2.Reference(
        reference_id=reference.id,
        from_user_id=reference.from_user_id,
        to_user_id=reference.to_user_id,
        reference_type=reftype2api[reference.reference_type],
        text=reference.text,
        written_time=Timestamp_from_datetime(reference.time.replace(hour=0, minute=0, second=0, microsecond=0)),
        host_request_id=reference.host_request_id
        if user_id in [reference.from_user_id, reference.to_user_id]
        else None,
    )


MAX_PAGINATION_LENGTH = 25


class References(references_pb2_grpc.ReferencesServicer):
    def ListReferences(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_reference_id = int(request.page_token) if request.page_token else 0

            if not request.from_user_id and not request.to_user_id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NEED_TO_SPECIFY_AT_LEAT_ONE_USER_ID)

            query = session.query(Reference).filter(Reference.visible_from < func.now())
            if request.from_user_id:
                query = query.filter(Reference.from_user_id == request.from_user_id)
            if request.to_user_id:
                query = query.filter(Reference.to_user_id == request.to_user_id)
            if len(request.reference_type_filter) > 0:
                query = query.filter(
                    Reference.reference_type.in_([reftype2sql[t] for t in request.reference_type_filter])
                )

            if next_reference_id:
                query = query.filter(Reference.id <= next_reference_id)

            references = query.order_by(Reference.id.desc()).limit(page_size + 1).all()

            return references_pb2.ListReferencesRes(
                references=[reference_to_pb(reference, context.user_id) for reference in references[:page_size]],
                next_page_token=str(references[-1].id) if len(references) > page_size else None,
            )

    def WriteFriendReference(self, request, context):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REFER_SELF)

        with session_scope() as session:
            if not session.query(User).filter(User.id == request.to_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if (
                session.query(Reference)
                .filter(Reference.from_user_id == context.user_id)
                .filter(Reference.to_user_id == request.to_user_id)
                .filter(Reference.reference_type == ReferenceType.friend)
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)

            reference = Reference(
                from_user_id=context.user_id,
                to_user_id=request.to_user_id,
                reference_type=ReferenceType.friend,
                text=request.text,
                rating=request.rating,
                was_safe=request.was_safe,
                visible_from=now(),
            )
            session.add(reference)
            session.flush()

            return reference_to_pb(reference, context.user_id)

    def WriteHostRequestReference(self, request, context):
        with session_scope() as session:
            host_request = (
                session.query(HostRequest)
                .filter(HostRequest.can_write_reference)
                .filter(HostRequest.conversation_id == request.host_request_id)
                .filter(or_(HostRequest.from_user_id == context.user_id, HostRequest.to_user_id == context.user_id))
                .one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CANT_WRITE_REFERENCE_FOR_REQUEST)

            if (
                session.query(Reference)
                .filter(Reference.host_request_id == host_request.conversation_id)
                .filter(Reference.from_user_id == context.user_id)
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)

            other_reference = (
                session.query(Reference)
                .filter(Reference.host_request_id == host_request.conversation_id)
                .filter(Reference.to_user_id == context.user_id)
                .one_or_none()
            )

            reference = Reference(
                from_user_id=context.user_id,
                host_request_id=host_request.conversation_id,
                text=request.text,
                rating=request.rating,
                was_safe=request.was_safe,
                visible_from=now() if other_reference else host_request.last_time_to_write_reference,
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
            session.flush()

            # if both references are written, make them visible, otherwise send the other a message to write a reference
            if other_reference:
                # so we neatly get the same timestamp
                other_reference.visible_from = reference.visible_from
                session.flush()

                # TODO: send email to both that references were written
            else:
                # TODO: send nagging email to other user to write a reference
                pass

            return reference_to_pb(reference, context.user_id)

    def AvailableWriteReferences(self, request, context):
        with session_scope() as session:
            if not session.query(User).filter(User.id == request.to_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            can_write_friend_reference = (
                session.query(Reference)
                .filter(Reference.from_user_id == context.user_id)
                .filter(Reference.to_user_id == request.to_user_id)
                .filter(Reference.reference_type == ReferenceType.friend)
                .one_or_none()
            ) is None

            # TODO: condence into one query

            host_requests_surfed = (
                session.query(HostRequest)
                .filter(HostRequest.can_write_reference)
                .filter(HostRequest.from_user_id == context.user_id)
                .filter(HostRequest.to_user_id == request.to_user_id)
                .all()
            )

            host_requests_hosted = (
                session.query(HostRequest)
                .filter(HostRequest.can_write_reference)
                .filter(HostRequest.from_user_id == request.to_user_id)
                .filter(HostRequest.to_user_id == context.user_id)
                .all()
            )

            host_request_references = [
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.id,
                    reference_type=reftype2api[ReferenceType.surfed],
                    time_expires=host_request.last_time_to_write_reference,
                )
                for host_request in host_requests_surfed
            ] + [
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.id,
                    reference_type=reftype2api[ReferenceType.hosted],
                    time_expires=host_request.last_time_to_write_reference,
                )
                for host_request in host_requests_hosted
            ]

            sort(host_request_references)

            return references_pb2.AvailableWriteReferencesRes(
                can_write_friend_reference=can_write_friend_reference,
                available_write_references=host_request_references,
            )

    def ListPendingReferencesToWrite(self, request, context):
        with session_scope() as session:
            # TODO: condence into one query

            host_requests_surfed = (
                session.query(HostRequest)
                .filter(HostRequest.can_write_reference)
                .filter(HostRequest.from_user_id == context.user_id)
                .all()
            )

            host_requests_hosted = (
                session.query(HostRequest)
                .filter(HostRequest.can_write_reference)
                .filter(HostRequest.to_user_id == context.user_id)
                .all()
            )

            host_request_references = [
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.id,
                    reference_type=reftype2api[ReferenceType.surfed],
                    time_expires=host_request.last_time_to_write_reference,
                )
                for host_request in host_requests_surfed
            ] + [
                references_pb2.AvailableWriteReferenceType(
                    host_request_id=host_request.id,
                    reference_type=reftype2api[ReferenceType.hosted],
                    time_expires=host_request.last_time_to_write_reference,
                )
                for host_request in host_requests_hosted
            ]

            sort(host_request_references)

            return references_pb2.ListPendingReferencesToWriteRes(
                pending_references=host_request_references,
            )
