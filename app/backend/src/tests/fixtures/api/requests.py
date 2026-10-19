from contextlib import contextmanager
from datetime import date, timedelta
from typing import cast

import grpc

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.proto import messages_pb2, requests_pb2, requests_pb2_grpc
from couchers.servicers.requests import Requests
from couchers.utils import date_to_api, today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


def _pad_request_text_to_valid_length(text: str) -> str:
    # Request lengths are measured in utf-16 code units to match the frontend.
    while len(text.encode("utf-16-le")) // 2 < HOST_REQUEST_MIN_LENGTH_UTF16:
        text += " padding"
    return text


# Neutral default text of valid length
REQUEST_TEXT_DEFAULT = _pad_request_text_to_valid_length("Dummy request text.")


@contextmanager
def _requests_session(token: str):
    channel = FakeChannel(token)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), cast(grpc.Server, channel))
    yield requests_pb2_grpc.RequestsStub(cast(grpc.Channel, channel))


def create_host_request(
    *,
    token: str,
    host_user_id: int,
    # Strings allow testing malformed dates.
    from_date: date | str | None = None,
    to_date: date | str | None = None,
    text: str | None = REQUEST_TEXT_DEFAULT,
    pad_text_to_valid_length: bool = False,
    public_trip_id: int | None = None,
    approve_by: Moderator | None = None,
) -> int:
    if text is not None and pad_text_to_valid_length:
        text = _pad_request_text_to_valid_length(text)
    if from_date is None:
        # Two days later is in the future no matter the host's timezone.
        from_date = today() + timedelta(days=2)
    if to_date is None:
        to_date = (date_to_api(from_date) if isinstance(from_date, str) else from_date) + timedelta(days=1)

    with _requests_session(token) as session:
        res: requests_pb2.CreateHostRequestRes = session.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_user_id,
                from_date=from_date if isinstance(from_date, str) else date_to_api(from_date),
                to_date=to_date if isinstance(to_date, str) else date_to_api(to_date),
                text=text,
                public_trip_id=public_trip_id,
            )
        )

    if approve_by is not None:
        approve_by.approve_host_request(res.host_request_id)

    return res.host_request_id


def get_host_request(*, token: str, host_request_id: int) -> requests_pb2.HostRequest:
    with _requests_session(token) as session:
        host_request: requests_pb2.HostRequest = session.GetHostRequest(
            requests_pb2.GetHostRequestReq(host_request_id=host_request_id)
        )
    return host_request


def respond_host_request(
    *,
    token: str,
    host_request_id: int,
    status: messages_pb2.HostRequestStatus.ValueType,
    text: str | None = None,
) -> None:
    with _requests_session(token) as session:
        session.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(host_request_id=host_request_id, status=status, text=text)
        )


def set_host_request_archive_status(
    *, token: str, host_request_id: int, is_archived: bool
) -> requests_pb2.SetHostRequestArchiveStatusRes:
    with _requests_session(token) as session:
        res: requests_pb2.SetHostRequestArchiveStatusRes = session.SetHostRequestArchiveStatus(
            requests_pb2.SetHostRequestArchiveStatusReq(host_request_id=host_request_id, is_archived=is_archived)
        )
    return res


def list_host_requests(
    *,
    token: str,
    number: int | None = None,
    only_active: bool = False,
    only_sent: bool = False,
    only_received: bool = False,
    only_archived: bool | None = None,
    status_in: list[messages_pb2.HostRequestStatus.ValueType] | None = None,
    sort_by: requests_pb2.HostRequestSortBy.ValueType | None = None,
    page_token: str | None = None,
) -> requests_pb2.ListHostRequestsRes:
    with _requests_session(token) as session:
        res: requests_pb2.ListHostRequestsRes = session.ListHostRequests(
            requests_pb2.ListHostRequestsReq(
                number=number,
                only_active=only_active,
                only_sent=only_sent,
                only_received=only_received,
                only_archived=only_archived,
                status_in=status_in,
                sort_by=sort_by,
                page_token=page_token,
            )
        )
    return res


def list_stays(
    *,
    token: str,
    role: requests_pb2.StayRole.ValueType,
    page_size: int | None = None,
    page_token: str | None = None,
) -> requests_pb2.ListStaysRes:
    with _requests_session(token) as session:
        res: requests_pb2.ListStaysRes = session.ListStays(
            requests_pb2.ListStaysReq(role=role, page_size=page_size, page_token=page_token)
        )
    return res


def get_host_request_messages(
    *, token: str, host_request_id: int, last_message_id: int | None = None, number: int | None = None
) -> requests_pb2.GetHostRequestMessagesRes:
    with _requests_session(token) as session:
        res: requests_pb2.GetHostRequestMessagesRes = session.GetHostRequestMessages(
            requests_pb2.GetHostRequestMessagesReq(
                host_request_id=host_request_id, last_message_id=last_message_id, number=number
            )
        )
    return res


def send_host_request_message(*, token: str, host_request_id: int, text: str = "Dummy message.") -> None:
    with _requests_session(token) as session:
        session.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text=text)
        )


def get_host_request_updates(
    *,
    token: str,
    newest_message_id: int,
    number: int | None = None,
    only_sent: bool = False,
    only_received: bool = False,
) -> requests_pb2.GetHostRequestUpdatesRes:
    with _requests_session(token) as session:
        res: requests_pb2.GetHostRequestUpdatesRes = session.GetHostRequestUpdates(
            requests_pb2.GetHostRequestUpdatesReq(
                newest_message_id=newest_message_id,
                number=number,
                only_sent=only_sent,
                only_received=only_received,
            )
        )
    return res


def mark_last_seen_host_request(*, token: str, host_request_id: int, last_seen_message_id: int) -> None:
    with _requests_session(token) as session:
        session.MarkLastSeenHostRequest(
            requests_pb2.MarkLastSeenHostRequestReq(
                host_request_id=host_request_id, last_seen_message_id=last_seen_message_id
            )
        )


def get_response_rate(*, token: str, user_id: int) -> requests_pb2.GetResponseRateRes:
    with _requests_session(token) as session:
        res: requests_pb2.GetResponseRateRes = session.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=user_id))
    return res


def send_host_request_feedback(
    *,
    token: str,
    host_request_id: int,
    host_request_quality: requests_pb2.HostRequestQuality.ValueType = requests_pb2.HOST_REQUEST_QUALITY_UNSPECIFIED,
    decline_reason: str | None = None,
) -> None:
    with _requests_session(token) as session:
        session.SendHostRequestFeedback(
            requests_pb2.SendHostRequestFeedbackReq(
                host_request_id=host_request_id,
                host_request_quality=host_request_quality,
                decline_reason=decline_reason,
            )
        )
