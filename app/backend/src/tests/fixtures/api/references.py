from contextlib import contextmanager
from typing import cast

import grpc
from google.protobuf import empty_pb2

from couchers.proto import references_pb2, references_pb2_grpc
from couchers.servicers.references import References
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _references_session(token: str):
    channel = FakeChannel(token)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), cast(grpc.Server, channel))
    yield references_pb2_grpc.ReferencesStub(cast(grpc.Channel, channel))


def list_references(
    *,
    token: str,
    from_user_id: int | None = None,
    to_user_id: int | None = None,
    reference_type_filter: list[references_pb2.ReferenceType.ValueType] | None = None,
    page_size: int | None = None,
    page_token: str | None = None,
) -> references_pb2.ListReferencesRes:
    with _references_session(token) as session:
        res: references_pb2.ListReferencesRes = session.ListReferences(
            references_pb2.ListReferencesReq(
                from_user_id=from_user_id,
                to_user_id=to_user_id,
                reference_type_filter=reference_type_filter,
                page_size=page_size,
                page_token=page_token,
            )
        )
    return res


def write_friend_reference(
    *,
    token: str,
    to_user_id: int,
    text: str = "Dummy reference text.",
    private_text: str | None = None,
    was_appropriate: bool = True,
    rating: float = 0.5,
    approve_by: Moderator | None = None,
) -> references_pb2.Reference:
    with _references_session(token) as session:
        res: references_pb2.Reference = session.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=to_user_id,
                text=text,
                private_text=private_text,
                was_appropriate=was_appropriate,
                rating=rating,
            )
        )
    if approve_by is not None:
        approve_by.approve_reference(res.reference_id)
    return res


def write_host_request_reference(
    *,
    token: str,
    host_request_id: int,
    text: str = "Dummy reference text.",
    private_text: str | None = None,
    was_appropriate: bool = True,
    rating: float = 1,
    approve_by: Moderator | None = None,
) -> references_pb2.Reference:
    with _references_session(token) as session:
        res: references_pb2.Reference = session.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=host_request_id,
                text=text,
                private_text=private_text,
                was_appropriate=was_appropriate,
                rating=rating,
            )
        )
    if approve_by is not None:
        approve_by.approve_reference(res.reference_id)
    return res


def host_request_indicate_didnt_meetup(
    *, token: str, host_request_id: int, reason_didnt_meetup: str | None = None
) -> None:
    with _references_session(token) as session:
        session.HostRequestIndicateDidntMeetup(
            references_pb2.HostRequestIndicateDidntMeetupReq(
                host_request_id=host_request_id, reason_didnt_meetup=reason_didnt_meetup
            )
        )


def available_write_references(*, token: str, to_user_id: int) -> references_pb2.AvailableWriteReferencesRes:
    with _references_session(token) as session:
        res: references_pb2.AvailableWriteReferencesRes = session.AvailableWriteReferences(
            references_pb2.AvailableWriteReferencesReq(to_user_id=to_user_id)
        )
    return res


def list_pending_references_to_write(*, token: str) -> references_pb2.ListPendingReferencesToWriteRes:
    with _references_session(token) as session:
        res: references_pb2.ListPendingReferencesToWriteRes = session.ListPendingReferencesToWrite(empty_pb2.Empty())
    return res


def get_host_request_reference_status(
    *, token: str, host_request_id: int
) -> references_pb2.GetHostRequestReferenceStatusRes:
    with _references_session(token) as session:
        res: references_pb2.GetHostRequestReferenceStatusRes = session.GetHostRequestReferenceStatus(
            references_pb2.GetHostRequestReferenceStatusReq(host_request_id=host_request_id)
        )
    return res
