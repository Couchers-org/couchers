from collections.abc import Sequence
from contextlib import contextmanager
from datetime import date, timedelta
from typing import cast

import grpc

from couchers.constants import PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16
from couchers.proto import public_trips_pb2, public_trips_pb2_grpc
from couchers.servicers.public_trips import PublicTrips
from couchers.utils import date_to_api, today
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


def _pad_description_to_valid_length(text: str) -> str:
    # Description lengths are measured in utf-16 code units to match the frontend.
    while len(text.encode("utf-16-le")) // 2 < PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16:
        text += " padding"
    return text


def _date_to_api(value: date | str) -> str:
    # Strings allow testing malformed dates.
    return value if isinstance(value, str) else date_to_api(value)


@contextmanager
def _public_trips_session(token: str):
    channel = FakeChannel(token)
    public_trips_pb2_grpc.add_PublicTripsServicer_to_server(PublicTrips(), cast(grpc.Server, channel))
    yield public_trips_pb2_grpc.PublicTripsStub(cast(grpc.Channel, channel))


# Neutral default description of valid length
_CREATE_DEFAULT_TEXT = _pad_description_to_valid_length("Dummy public trip description.")


def create_public_trip(
    *,
    token: str,
    community_id: int,
    # Strings allow testing malformed dates.
    from_date: date | str | None = None,
    to_date: date | str | None = None,
    description: str | None = _CREATE_DEFAULT_TEXT,
    pad_description_to_valid_length: bool = False,
    same_gender_only: bool = False,
    approve_by: Moderator | None = None,
) -> public_trips_pb2.PublicTrip:
    if description is not None and pad_description_to_valid_length:
        description = _pad_description_to_valid_length(description)
    if from_date is None:
        # Two days later is in the future no matter the community's timezone.
        from_date = today() + timedelta(days=2)
    if to_date is None:
        to_date = (date.fromisoformat(from_date) if isinstance(from_date, str) else from_date) + timedelta(days=1)

    with _public_trips_session(token) as session:
        public_trip: public_trips_pb2.PublicTrip = session.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=community_id,
                from_date=_date_to_api(from_date),
                to_date=_date_to_api(to_date),
                description=description,
                same_gender_only=same_gender_only,
            )
        )

    if approve_by is not None:
        approve_by.approve_public_trip(public_trip.trip_id)

    return public_trip


def get_public_trip(*, token: str, trip_id: int) -> public_trips_pb2.PublicTrip:
    with _public_trips_session(token) as session:
        public_trip: public_trips_pb2.PublicTrip = session.GetPublicTrip(
            public_trips_pb2.GetPublicTripReq(trip_id=trip_id)
        )
    return public_trip


def list_public_trips(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> public_trips_pb2.ListPublicTripsRes:
    with _public_trips_session(token) as session:
        res: public_trips_pb2.ListPublicTripsRes = session.ListPublicTrips(
            public_trips_pb2.ListPublicTripsReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_public_trips_by_user(
    *,
    token: str,
    user_id: int,
    statuses_in: Sequence[public_trips_pb2.PublicTripStatus.ValueType] | None = None,
    ascending: bool = False,
    include_past: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
) -> public_trips_pb2.ListPublicTripsByUserRes:
    with _public_trips_session(token) as session:
        res: public_trips_pb2.ListPublicTripsByUserRes = session.ListPublicTripsByUser(
            public_trips_pb2.ListPublicTripsByUserReq(
                user_id=user_id,
                statuses_in=statuses_in,
                ascending=ascending,
                include_past=include_past,
                page_size=page_size,
                page_token=page_token,
            )
        )
    return res


def list_my_communities_public_trips(
    *, token: str, page_size: int | None = None, page_token: str | None = None
) -> public_trips_pb2.ListMyCommunitiesPublicTripsRes:
    with _public_trips_session(token) as session:
        res: public_trips_pb2.ListMyCommunitiesPublicTripsRes = session.ListMyCommunitiesPublicTrips(
            public_trips_pb2.ListMyCommunitiesPublicTripsReq(page_size=page_size, page_token=page_token)
        )
    return res


def update_public_trip(
    *,
    token: str,
    trip_id: int,
    # None leaves the field unchanged. Strings allow testing malformed dates.
    from_date: date | str | None = None,
    to_date: date | str | None = None,
    description: str | None = None,
    status: public_trips_pb2.PublicTripStatus.ValueType | None = None,
    same_gender_only: bool | None = None,
) -> public_trips_pb2.PublicTrip:
    with _public_trips_session(token) as session:
        public_trip: public_trips_pb2.PublicTrip = session.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                from_date=_date_to_api(from_date) if from_date is not None else None,
                to_date=_date_to_api(to_date) if to_date is not None else None,
                description=description,
                status=status,
                same_gender_only=same_gender_only,
            )
        )
    return public_trip
