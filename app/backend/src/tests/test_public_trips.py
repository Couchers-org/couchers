from datetime import timedelta

import grpc
import pytest
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import Node, NodeType
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.proto import public_trips_pb2
from couchers.utils import create_polygon_lat_lng, to_multi, today
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import public_trips_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _make_node(node_type: NodeType = NodeType.locality) -> int:
    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])),
            node_type=node_type,
        )
        session.add(node)
        session.flush()
        return node.id


def _create_trip_directly(
    user_id: int, node_id: int, from_date, to_date, *, description: str = "Looking for a host!", status=None
) -> int:
    with session_scope() as session:
        trip = PublicTrip(
            user_id=user_id,
            node_id=node_id,
            from_date=from_date,
            to_date=to_date,
            description=description,
            status=status or PublicTripStatus.searching_for_host,
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
                node_id=node_id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                description="Visiting town!",
            )
        )

        assert res.trip_id > 0
        assert res.user.user_id == user.id
        assert res.node_id == node_id
        assert res.from_date == from_date.isoformat()
        assert res.to_date == to_date.isoformat()
        assert res.description == "Visiting town!"
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
                    node_id=node_id,
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
                    node_id=999999,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Community not found."


def test_create_public_trip_community_too_broad(db):
    _, token = generate_user()
    node_id = _make_node(node_type=NodeType.region)

    with public_trips_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    node_id=node_id,
                    from_date=(today() + timedelta(days=5)).isoformat(),
                    to_date=(today() + timedelta(days=10)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert "city-level" in (e.value.details() or "")


def test_create_public_trip_allows_sublocality(db):
    _, token = generate_user()
    node_id = _make_node(node_type=NodeType.sublocality)

    with public_trips_session(token) as api:
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                node_id=node_id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                description="Visiting neighborhood!",
            )
        )
        assert res.trip_id > 0


def test_create_public_trip_date_errors(db):
    _, token = generate_user()
    node_id = _make_node()

    with public_trips_session(token) as api:
        # from_date in the past
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    node_id=node_id,
                    from_date=(today() - timedelta(days=1)).isoformat(),
                    to_date=(today() + timedelta(days=1)).isoformat(),
                    description="Visiting town!",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # from_date after to_date
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePublicTrip(
                public_trips_pb2.CreatePublicTripReq(
                    node_id=node_id,
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
                    node_id=node_id,
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
                    node_id=node_id,
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
                    node_id=node_id,
                    from_date=(today() + timedelta(days=8)).isoformat(),
                    to_date=(today() + timedelta(days=12)).isoformat(),
                    description="Another visit!",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # non-overlapping dates should succeed
        res = api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                node_id=node_id,
                from_date=(today() + timedelta(days=20)).isoformat(),
                to_date=(today() + timedelta(days=25)).isoformat(),
                description="Second visit!",
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
                node_id=node_id,
                from_date=(today() + timedelta(days=7)).isoformat(),
                to_date=(today() + timedelta(days=12)).isoformat(),
                description="Trying again!",
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
        from couchers.models import User
        from couchers.utils import now

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


def test_list_my_public_trips(db):
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
    # other user's trip should not be returned
    _create_trip_directly(other.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        res = api.ListMyPublicTrips(public_trips_pb2.ListMyPublicTripsReq())
        assert {t.trip_id for t in res.public_trips} == {mine_active, mine_closed}


def test_update_public_trip_status_close(db):
    user, token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(token) as api:
        api.UpdatePublicTripStatus(
            public_trips_pb2.UpdatePublicTripStatusReq(
                trip_id=trip_id,
                status=public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED,
            )
        )

    with session_scope() as session:
        trip = session.execute(select(PublicTrip).where(PublicTrip.id == trip_id)).scalar_one()
        assert trip.status == PublicTripStatus.closed


def test_update_public_trip_status_not_owner(db):
    user, _ = generate_user()
    _, other_token = generate_user()
    node_id = _make_node()
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))

    with public_trips_session(other_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTripStatus(
                public_trips_pb2.UpdatePublicTripStatusReq(
                    trip_id=trip_id,
                    status=public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_update_public_trip_cant_reopen(db):
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
        # can't reopen a closed trip
        with pytest.raises(grpc.RpcError) as e:
            api.UpdatePublicTripStatus(
                public_trips_pb2.UpdatePublicTripStatusReq(
                    trip_id=trip_id,
                    status=public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
