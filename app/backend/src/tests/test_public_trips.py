from datetime import date, timedelta
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy import select

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.db import session_scope
from couchers.models import Cluster, ClusterRole, ClusterSubscription, Node, NodeType, User
from couchers.models.host_requests import HostRequest, HostRequestStatus
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.proto import public_trips_pb2, requests_pb2
from couchers.utils import create_polygon_lat_lng, now, to_multi, today
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import public_trips_session, requests_session


def _valid_request_text(text: str = "Offer to host") -> str:
    utf16_length = len(text.encode("utf-16-le")) // 2
    if utf16_length >= HOST_REQUEST_MIN_LENGTH_UTF16:
        return text
    return text + "_" * (HOST_REQUEST_MIN_LENGTH_UTF16 - utf16_length)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# 150+ utf-16 code units to satisfy PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16.
VALID_DESCRIPTION = (
    "Visiting the area for a week for a music festival. I love meeting new people "
    "and would really appreciate local tips. Happy to help with tasks in exchange."
)


def _make_node(node_type: NodeType = NodeType.locality, small_community_features_enabled: bool = True) -> int:
    # Polygon inside the fake Europe/Helsinki timezone area so node.timezone resolves.
    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[60, 24], [60, 26], [62, 26], [62, 24], [60, 24]])),
            node_type=node_type,
        )
        session.add(node)
        session.flush()
        cluster = Cluster(
            name="Test community",
            description="Test",
            parent_node_id=node.id,
            is_official_cluster=True,
            small_community_features_enabled=small_community_features_enabled,
        )
        session.add(cluster)
        session.flush()
        return node.id


def _make_node_admin(user_id: int, node_id: int):
    with session_scope() as session:
        cluster_id = session.execute(
            select(Cluster.id).where(Cluster.parent_node_id == node_id).where(Cluster.is_official_cluster)
        ).scalar_one()
        session.add(ClusterSubscription(cluster_id=cluster_id, user_id=user_id, role=ClusterRole.admin))


def _create_trip_directly(
    user_id: int,
    node_id: int,
    from_date,
    to_date,
    *,
    description: str = "Looking for a host!",
    status=None,
    same_gender_only: bool = False,
) -> int:
    with session_scope() as session:
        trip = PublicTrip(
            user_id=user_id,
            node_id=node_id,
            from_date=from_date,
            to_date=to_date,
            description=description,
            status=status or PublicTripStatus.searching_for_host,
            same_gender_only=same_gender_only,
        )
        session.add(trip)
        session.flush()
        return trip.id


def test_create_public_trip(db):
    user, token = generate_user()
    node_id = _make_node()

    from_date = today() + timedelta(days=5)
    to_date = today() + timedelta(days=10)

    with public_trips_session(token) as api:
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                description=VALID_DESCRIPTION,
            )
        )

        assert res.trip_id > 0
        assert res.user.user_id == user.id
        assert res.community_id == node_id
        assert res.community_slug == "test-community"
        assert res.community_name == "Test community"
        assert res.from_date == from_date.isoformat()
        assert res.to_date == to_date.isoformat()
        assert res.description == VALID_DESCRIPTION
        assert res.status == public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == res.trip_id)).scalar_one()
        assert trip.user_id == user.id
        assert trip.node_id == node_id
        assert trip.status == PublicTripStatus.searching_for_host


def test_create_public_trip_incomplete_profile(db):
    _, token = generate_user(complete_profile=False)
    node_id = _make_node()

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You have to complete your profile before you can create a public trip."


def test_create_public_trip_community_not_found(db):
    _, token = generate_user()

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=999999,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Community not found."


def test_create_public_trip_not_enabled(db):
    _, token = generate_user()
    node_id = _make_node(small_community_features_enabled=False)

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "Public trips are not enabled in this community."


@pytest.mark.parametrize(
    "node_type",
    [NodeType.region, NodeType.subregion, NodeType.locality, NodeType.sublocality],
)
def test_create_public_trip_allows_region_and_narrower(db, node_type):
    _, token = generate_user()
    node_id = _make_node(node_type=node_type)

    with public_trips_session(token) as api:
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                description=VALID_DESCRIPTION,
            )
        )
        assert res.trip_id > 0


def test_create_public_trip_in_past_uses_node_timezone(db):
    # Default user geom resolves to America/New_York; the node's geom is in Europe/Helsinki.
    # Simulate a moment where Helsinki has already rolled into the next day (2026-01-16)
    # while NYC is still on 2026-01-15. A from_date of 2026-01-15 is "today" in NYC but
    # "yesterday" in Helsinki, and must be rejected because the check uses the node's tz.
    _, token = generate_user()
    node_id = _make_node()

    fake_today_by_tz = {"America/New_York": date(2026, 1, 15), "Europe/Helsinki": date(2026, 1, 16)}

    with patch(
        "couchers.servicers.public_trips.today_in_timezone",
        side_effect=lambda tz: fake_today_by_tz[tz],
    ):
        with public_trips_session(token) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.CreatePublicTrip(
                    public_trips_pb2.CreatePublicTripReq(
                        community_id=node_id,
                        from_date="2026-01-15",
                        to_date="2026-01-20",
                        description=VALID_DESCRIPTION,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_create_public_trip_date_errors(db):
    _, token = generate_user()
    node_id = _make_node()

    with public_trips_session(token) as api:
        # from_date in the past
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() - timedelta(days=2)).isoformat(),
                    to_date=(today() + timedelta(days=1)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # from_date after to_date
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=10)).isoformat(),
                    to_date=(today() + timedelta(days=5)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # empty description
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="   ",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # invalid date format
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date="not-a-date",
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_create_public_trip_overlap(db):
    user, token = generate_user()
    node_id = _make_node()

    _create_trip_directly(
        user.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
    )

    with public_trips_session(token) as api:
        # overlapping dates should fail
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=8)).isoformat(),
                    to_date=(today() + timedelta(days=12)).isoformat(),
                    description=VALID_DESCRIPTION,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # non-overlapping dates should succeed
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=(today() + timedelta(days=20)).isoformat(),
                to_date=(today() + timedelta(days=25)).isoformat(),
                description=VALID_DESCRIPTION,
            )
        )
        assert res.trip_id > 0


def test_create_public_trip_closed_trip_allows_new_overlap(db):
    user, token = generate_user()
    node_id = _make_node()

    _create_trip_directly(
        user.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        status=PublicTripStatus.closed,
    )

    with public_trips_session(token) as api:
        # closed trips shouldn't block new overlapping ones
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=(today() + timedelta(days=7)).isoformat(),
                to_date=(today() + timedelta(days=12)).isoformat(),
                description=VALID_DESCRIPTION,
            )
        )
        assert res.trip_id > 0


def test_get_public_trip(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        res = api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=trip_id))
        assert res.trip_id == trip_id
        assert res.user.user_id == user.id
        assert res.community_slug == "test-community"
        assert res.community_name == "Test community"


def test_get_public_trip_not_found(db):
    _, token = generate_user()
    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=999999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_list_public_trips(db):
    traveler, _ = generate_user()
    _, host_token = generate_user()
    node_id = _make_node()

    trip1 = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    trip2 = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=20), today() + timedelta(days=25))

    with public_trips_session(host_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        returned_ids = {t.trip_id for t in res.public_trips}
        assert returned_ids == {trip1, trip2}
        assert all(t.community_slug == "test-community" for t in res.public_trips)
        assert all(t.community_name == "Test community" for t in res.public_trips)


def test_list_public_trips_filters_closed_and_past(db):
    traveler, _ = generate_user()
    _, host_token = generate_user()
    node_id = _make_node()

    active = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    # closed trip - should be hidden
    _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=15),
        today() + timedelta(days=20),
        status=PublicTripStatus.closed,
    )
    # past trip (to_date < today) - should be hidden
    _create_trip_directly(traveler.id, node_id, today() - timedelta(days=10), today() - timedelta(days=1))

    with public_trips_session(host_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        assert [t.trip_id for t in res.public_trips] == [active]


def test_list_public_trips_hides_invisible_user(db):
    traveler, _ = generate_user()
    _, host_token = generate_user()
    node_id = _make_node()

    _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    # soft-delete the traveler
    with session_scope() as session:
        t = session.execute(select(User).where(User.id == traveler.id)).scalar_one()
        t.deleted_at = now()

    with public_trips_session(host_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        assert len(res.public_trips) == 0


def test_list_public_trips_pagination(db):
    traveler, _ = generate_user()
    _, host_token = generate_user()
    node_id = _make_node()

    trip_ids = [
        _create_trip_directly(
            traveler.id, node_id, today() + timedelta(days=5 + i * 10), today() + timedelta(days=10 + i * 10)
        )
        for i in range(5)
    ]

    with public_trips_session(host_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id, page_size=2))
        assert [t.trip_id for t in res.public_trips] == [trip_ids[4], trip_ids[3]]
        assert res.next_page_token

        res2 = api.ListPublicTrips(
            public_trips_pb2.ListPublicTripsReq(community_id=node_id, page_size=2, page_token=res.next_page_token)
        )
        assert [t.trip_id for t in res2.public_trips] == [trip_ids[2], trip_ids[1]]
        assert res2.next_page_token

        res3 = api.ListPublicTrips(
            public_trips_pb2.ListPublicTripsReq(community_id=node_id, page_size=2, page_token=res2.next_page_token)
        )
        assert [t.trip_id for t in res3.public_trips] == [trip_ids[0]]
        assert not res3.next_page_token


def test_list_public_trips_by_user_self_sees_all(db):
    user, token = generate_user()
    other, _ = generate_user()
    node_id = _make_node()

    mine_active = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    mine_closed = _create_trip_directly(
        user.id,
        node_id,
        today() + timedelta(days=15),
        today() + timedelta(days=20),
        status=PublicTripStatus.closed,
    )
    mine_past = _create_trip_directly(user.id, node_id, today() - timedelta(days=10), today() - timedelta(days=1))
    # other user's trip should not be returned
    _create_trip_directly(other.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=user.id))
        assert {t.trip_id for t in res.public_trips} == {mine_active, mine_closed, mine_past}


def test_list_public_trips_by_user_other_filters_inactive_and_past(db):
    traveler, _ = generate_user()
    _, viewer_token = generate_user()
    node_id = _make_node()

    active = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    # closed trip - hidden from others
    _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=15),
        today() + timedelta(days=20),
        status=PublicTripStatus.closed,
    )
    # past trip - hidden from others
    _create_trip_directly(traveler.id, node_id, today() - timedelta(days=10), today() - timedelta(days=1))

    with public_trips_session(viewer_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        assert [t.trip_id for t in res.public_trips] == [active]


def test_list_public_trips_by_user_invisible_user(db):
    traveler, _ = generate_user()
    _, viewer_token = generate_user()
    node_id = _make_node()

    _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    # soft-delete the traveler
    with session_scope() as session:
        t = session.execute(select(User).where(User.id == traveler.id)).scalar_one()
        t.deleted_at = now()

    with public_trips_session(viewer_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        assert len(res.public_trips) == 0


def test_update_public_trip_close(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                status=public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED,
            )
        )
        assert res.status == public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == trip_id)).scalar_one()
        assert trip.status == PublicTripStatus.closed


def test_update_public_trip_reopen(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(
        user.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        status=PublicTripStatus.closed,
    )

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                status=public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
            )
        )
        assert res.status == public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == trip_id)).scalar_one()
        assert trip.status == PublicTripStatus.searching_for_host


def test_update_public_trip_cant_reopen_past_trip(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(
        user.id,
        node_id,
        today() - timedelta(days=10),
        today() - timedelta(days=1),
        status=PublicTripStatus.closed,
    )

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    status=public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_update_public_trip_close_past_trip_allowed(db):
    # Closing a trip whose dates are in the past is allowed, even though content edits are not.
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() - timedelta(days=10), today() - timedelta(days=1))

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                status=public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED,
            )
        )
        assert res.status == public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED


def test_update_public_trip_description_only(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(
        user.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        description="Original description",
    )

    updated = VALID_DESCRIPTION + " Updated plans."

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                description=updated,
            )
        )
        assert res.trip_id == trip_id
        assert res.description == updated
        # dates should be unchanged
        assert res.from_date == (today() + timedelta(days=5)).isoformat()
        assert res.to_date == (today() + timedelta(days=10)).isoformat()

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == trip_id)).scalar_one()
        assert trip.description == updated


def test_update_public_trip_dates(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    new_from = today() + timedelta(days=7)
    new_to = today() + timedelta(days=14)

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                from_date=new_from.isoformat(),
                to_date=new_to.isoformat(),
            )
        )
        assert res.from_date == new_from.isoformat()
        assert res.to_date == new_to.isoformat()


def test_update_public_trip_not_owner(db):
    user, _ = generate_user()
    _, other_token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(other_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    description="I don't own this!",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_update_public_trip_in_past(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() - timedelta(days=10), today() - timedelta(days=2))

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    description="Too late!",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_update_public_trip_date_validation(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        # from_date after to_date (using the stored to_date of today+10)
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    from_date=(today() + timedelta(days=20)).isoformat(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # Empty description
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    description="   ",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_create_public_trip_description_too_short(db):
    _, token = generate_user()
    node_id = _make_node()

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    community_id=node_id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Too short.",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert "150" in (e.value.details() or "")


def test_update_public_trip_description_too_short(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTrip(
                public_trips_pb2.UpdatePublicTripReq(
                    trip_id=trip_id,
                    description="Too short.",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert "150" in (e.value.details() or "")


def test_same_gender_only_create_and_retrieve(db):
    user, token = generate_user(gender="Woman")
    node_id = _make_node()

    from_date = today() + timedelta(days=5)
    to_date = today() + timedelta(days=10)

    with public_trips_session(token) as api:
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                description=VALID_DESCRIPTION,
                same_gender_only=True,
            )
        )
        assert res.same_gender_only is True

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == res.trip_id)).scalar_one()
        assert trip.same_gender_only is True


def test_same_gender_only_visibility_list_and_get(db):
    traveler, _ = generate_user(gender="Woman")
    _, same_gender_token = generate_user(gender="Woman")
    _, diff_gender_token = generate_user(gender="Man")
    node_id = _make_node()

    filtered_trip_id = _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        same_gender_only=True,
    )
    open_trip_id = _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=20),
        today() + timedelta(days=25),
    )

    with public_trips_session(same_gender_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        assert {t.trip_id for t in res.public_trips} == {filtered_trip_id, open_trip_id}

        get_res = api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=filtered_trip_id))
        assert get_res.trip_id == filtered_trip_id
        assert get_res.same_gender_only is True

    with public_trips_session(diff_gender_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        assert [t.trip_id for t in res.public_trips] == [open_trip_id]

        with pytest.raises(grpc.RpcError) as e:
            api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=filtered_trip_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_same_gender_only_moderator_bypass(db):
    traveler, _ = generate_user(gender="Woman")
    mod, mod_token = generate_user(gender="Man")
    node_id = _make_node()
    _make_node_admin(mod.id, node_id)

    trip_id = _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        same_gender_only=True,
    )

    with public_trips_session(mod_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        assert any(t.trip_id == trip_id for t in res.public_trips)

        get_res = api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=trip_id))
        assert get_res.trip_id == trip_id


def test_same_gender_only_owner_always_sees_own_trips(db):
    traveler, traveler_token = generate_user(gender="Woman")
    _, diff_gender_token = generate_user(gender="Man")
    node_id = _make_node()

    trip_id = _create_trip_directly(
        traveler.id,
        node_id,
        today() + timedelta(days=5),
        today() + timedelta(days=10),
        same_gender_only=True,
    )

    # Owner always sees their own trips (is_self path skips the gender filter)
    with public_trips_session(traveler_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        assert any(t.trip_id == trip_id for t in res.public_trips)

    # Different-gender viewer doesn't see it on the traveler's profile
    with public_trips_session(diff_gender_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        assert not any(t.trip_id == trip_id for t in res.public_trips)


def test_same_gender_only_update(db):
    user, token = generate_user(gender="Woman")
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                same_gender_only=True,
            )
        )
        assert res.same_gender_only is True

        res = api.UpdatePublicTrip(
            public_trips_pb2.UpdatePublicTripReq(
                trip_id=trip_id,
                same_gender_only=False,
            )
        )
        assert res.same_gender_only is False

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == trip_id)).scalar_one()
        assert trip.same_gender_only is False


def test_list_public_trips_by_user_ascending_order(db):
    user, token = generate_user()
    node_id = _make_node()

    trip_near = _create_trip_directly(user.id, node_id, today() + timedelta(days=3), today() + timedelta(days=5))
    trip_far = _create_trip_directly(user.id, node_id, today() + timedelta(days=20), today() + timedelta(days=25))
    trip_mid = _create_trip_directly(user.id, node_id, today() + timedelta(days=10), today() + timedelta(days=12))

    with public_trips_session(token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=user.id, ascending=True))
        trip_ids = [t.trip_id for t in res.public_trips]
        assert trip_ids.index(trip_near) < trip_ids.index(trip_mid) < trip_ids.index(trip_far)

        res_desc = api.ListPublicTripsByUser(
            public_trips_pb2.ListPublicTripsByUserReq(user_id=user.id, ascending=False)
        )
        trip_ids_desc = [t.trip_id for t in res_desc.public_trips]
        assert trip_ids_desc.index(trip_far) < trip_ids_desc.index(trip_mid) < trip_ids_desc.index(trip_near)


def test_list_public_trips_by_user_status_filter(db):
    user, token = generate_user()
    node_id = _make_node()

    active = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    closed = _create_trip_directly(
        user.id, node_id, today() + timedelta(days=15), today() + timedelta(days=20), status=PublicTripStatus.closed
    )

    with public_trips_session(token) as api:
        # Filter to active only
        res = api.ListPublicTripsByUser(
            public_trips_pb2.ListPublicTripsByUserReq(
                user_id=user.id,
                statuses_in=[public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST],
            )
        )
        assert {t.trip_id for t in res.public_trips} == {active}

        # Filter to closed only
        res = api.ListPublicTripsByUser(
            public_trips_pb2.ListPublicTripsByUserReq(
                user_id=user.id,
                statuses_in=[public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED],
            )
        )
        assert {t.trip_id for t in res.public_trips} == {closed}

        # No filter returns all
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=user.id))
        assert {t.trip_id for t in res.public_trips} == {active, closed}


def test_list_public_trips_by_user_status_filter_ignored_for_others(db):
    traveler, _ = generate_user()
    _, viewer_token = generate_user()
    node_id = _make_node()

    active = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    _create_trip_directly(
        traveler.id, node_id, today() + timedelta(days=15), today() + timedelta(days=20), status=PublicTripStatus.closed
    )

    with public_trips_session(viewer_token) as api:
        # status_filter is ignored for other users — always returns active+upcoming only
        res = api.ListPublicTripsByUser(
            public_trips_pb2.ListPublicTripsByUserReq(
                user_id=traveler.id,
                statuses_in=[public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED],
            )
        )
        assert [t.trip_id for t in res.public_trips] == [active]


def test_list_public_trips_by_user_offers_count_owner(db):
    traveler, traveler_token = generate_user()
    host, host_token = generate_user()
    node_id = _make_node()

    trip_id = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(traveler_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.HasField("offers_count")
        assert trip.offers_count == 0

    # Host creates an offer via a host request linked to the trip
    with requests_session(host_token) as api:
        api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=traveler.id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                text=_valid_request_text(),
                public_trip_id=trip_id,
            )
        )

    with public_trips_session(traveler_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.HasField("offers_count")
        assert trip.offers_count == 1


def test_list_public_trips_by_user_offers_count_not_set_for_others(db):
    traveler, _ = generate_user()
    _, viewer_token = generate_user()
    node_id = _make_node()

    _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(viewer_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        assert len(res.public_trips) == 1
        assert not res.public_trips[0].HasField("offers_count")
        assert not res.public_trips[0].HasField("offer_tally")


def test_list_public_trips_by_user_offer_tally_owner(db):
    traveler, traveler_token = generate_user()
    hosts = [generate_user() for _ in range(5)]
    node_id = _make_node()

    trip_id = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    for _host, host_token in hosts:
        with requests_session(host_token) as api:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=traveler.id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    text=_valid_request_text(),
                    public_trip_id=trip_id,
                )
            )

    # Set one offer per status: pending, accepted, confirmed, rejected, cancelled.
    with session_scope() as session:
        offers = (
            session.execute(
                select(HostRequest).where(HostRequest.public_trip_id == trip_id).order_by(HostRequest.conversation_id)
            )
            .scalars()
            .all()
        )
        offers[0].status = HostRequestStatus.pending
        offers[1].status = HostRequestStatus.accepted
        offers[2].status = HostRequestStatus.confirmed
        offers[3].status = HostRequestStatus.rejected
        offers[4].status = HostRequestStatus.cancelled

    with public_trips_session(traveler_token) as api:
        res = api.ListPublicTripsByUser(public_trips_pb2.ListPublicTripsByUserReq(user_id=traveler.id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.HasField("offer_tally")
        assert trip.offer_tally.pending == 1
        assert trip.offer_tally.accepted == 1
        assert trip.offer_tally.confirmed == 1
        assert trip.offer_tally.declined == 1
        # cancelled is excluded from offers_count and the tally
        assert trip.offers_count == 4


def test_viewer_host_request_id_reflects_viewers_own_offer(db):
    traveler, _ = generate_user()
    host, host_token = generate_user()
    _, other_token = generate_user()
    node_id = _make_node()

    trip_id = _create_trip_directly(traveler.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    # Before offering, the host sees 0.
    with public_trips_session(host_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.viewer_host_request_id == 0

    # The host makes an offer on the trip.
    with requests_session(host_token) as api:
        create_res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=traveler.id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                text=_valid_request_text(),
                public_trip_id=trip_id,
            )
        )
    host_request_id = create_res.host_request_id

    with public_trips_session(host_token) as api:
        # The offering host now sees their own host request id (List and Get).
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.viewer_host_request_id == host_request_id

        get_res = api.GetPublicTrip(public_trips_pb2.GetPublicTripReq(trip_id=trip_id))
        assert get_res.viewer_host_request_id == host_request_id

    # A different viewer who hasn't offered still sees 0.
    with public_trips_session(other_token) as api:
        res = api.ListPublicTrips(public_trips_pb2.ListPublicTripsReq(community_id=node_id))
        trip = next(t for t in res.public_trips if t.trip_id == trip_id)
        assert trip.viewer_host_request_id == 0
