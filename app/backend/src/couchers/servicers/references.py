"""
* Only one friend reference
* Multiple of the other types (one for each stay)
* Have 2 weeks to write a reference after hosting/surfing
* References become visible after min{2 weeks, both reciprocal references written}
* Get bugged about writing reference 1 day after, 1 week after, 2weeks-2days
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


class References(references_pb2_grpc.ReferencesServicer):
    def WriteReference(self, request, context):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REFER_SELF)

        reference = Reference(
            from_user_id=context.user_id,
            to_user_id=request.to_user_id,
            reference_type=reftype2sql[request.reference_type],
            text=request.text,
            was_safe=request.was_safe,
            rating=request.rating,
        )
        with session_scope() as session:
            if not session.query(User).filter(User.id == request.to_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if (
                session.query(Reference)
                .filter(Reference.from_user_id == context.user_id)
                .filter(Reference.to_user_id == request.to_user_id)
                .filter(Reference.reference_type == reftype2sql[request.reference_type])
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.REFERENCE_ALREADY_GIVEN)
            session.add(reference)
        return empty_pb2.Empty()

    def GetGivenReferences(self, request, context):
        with session_scope() as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id == request.from_user_id)
            if request.HasField("type_filter"):
                query = query.filter(Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def GetReceivedReferences(self, request, context):
        with session_scope() as session:
            query = session.query(Reference)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            if request.HasField("type_filter"):
                query = query.filter(Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def AvailableWriteReferenceTypes(self, request, context):
        available = {
            ReferenceType.friend,
            ReferenceType.surfed,
            ReferenceType.hosted,
        }

        # Filter out already written ones.
        with session_scope() as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id == context.user_id)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            for reference in query.all():
                available.remove(reference.reference_type)

        # TODO: make surfing/hosted only available if you actually have been surfing/hosting
        return references_pb2.AvailableWriteReferenceTypesRes(reference_types=[reftype2api[r] for r in available])


def paginate_references_result(request, query):
    total_matches = query.count()
    references = query.order_by(Reference.time.desc()).offset(request.start_at).limit(request.number).all()
    # order by time, pagination
    return references_pb2.GetReferencesRes(
        total_matches=total_matches,
        references=[
            references_pb2.Reference(
                reference_id=reference.id,
                from_user_id=reference.from_user_id,
                to_user_id=reference.to_user_id,
                reference_type=reftype2api[reference.reference_type],
                text=reference.text,
                # Fuzz reference written time
                written_time=Timestamp_from_datetime(reference.time.replace(hour=0, minute=0, second=0, microsecond=0)),
            )
            for reference in references
        ],
    )
