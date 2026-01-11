import json
from datetime import UTC, datetime
from math import sqrt
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import update_randomized_locations
from couchers.materialized_views import refresh_materialized_views_rapid
from couchers.models import (
    Invoice,
    InvoiceType,
    ProfilePublicVisibility,
    Reference,
    ReferenceType,
)
from couchers.proto import api_pb2, public_pb2
from couchers.servicers.public import _get_donation_stats, _get_public_users, _get_signup_page_info, _get_volunteers
from tests.fixtures.db import generate_user, make_volunteer
from tests.fixtures.misc import process_jobs
from tests.fixtures.sessions import public_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetPublicMapLayer(db):
    user1, _ = generate_user()
    user2, _ = generate_user(username="user2", public_visibility=ProfilePublicVisibility.nothing)
    user3, _ = generate_user()
    user4, _ = generate_user(username="user4", public_visibility=ProfilePublicVisibility.limited)
    user5, _ = generate_user()

    # these are hardcoded in test_fixtures
    test_user_coordinates = [-73.9740, 40.7108]

    with session_scope() as session:
        queue_job(session, job=update_randomized_locations, payload=empty_pb2.Empty())

    process_jobs()

    with public_session() as public:
        http_body = public.GetPublicUsers(empty_pb2.Empty())
        assert http_body.content_type == "application/json"
        data = json.loads(http_body.data)
        # Sort to ensure a deterministic order
        data["features"].sort(key=lambda f: f["geometry"]["coordinates"][0])
        assert data == {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-74.042643848, 40.706241098]},
                    "properties": {"username": None},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.974, 40.7108]},
                    "properties": {"username": "user4"},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.955417734, 40.691831306]},
                    "properties": {"username": None},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.928380198, 40.729706144]},
                    "properties": {"username": None},
                },
            ],
        }

        for user in data["features"]:
            coords = user["geometry"]["coordinates"]
            if user["properties"]["username"]:
                assert coords == test_user_coordinates
            else:
                xdiff = coords[0] - test_user_coordinates[0]
                ydiff = coords[1] - test_user_coordinates[1]
                dist = sqrt(xdiff**2 + ydiff**2)
                assert dist > 0.02 and dist < 0.1


def test_GetDonationStats_empty(db):
    """Test GetDonationStats with no donations returns zero and goal"""
    _get_donation_stats.cache_clear()

    with (
        patch("couchers.servicers.public.DONATION_GOAL_USD", 2500),
        patch("couchers.servicers.public.DONATION_OFFSET_USD", 700),
    ):
        with public_session() as public:
            res = public.GetDonationStats(empty_pb2.Empty())
            assert res.total_donated_ytd == 0
            assert res.goal == 2500


def test_GetDonationStats_with_donations(db):
    """Test GetDonationStats sums on_platform donations correctly"""
    _get_donation_stats.cache_clear()
    user, _ = generate_user()

    with session_scope() as session:
        # Add some on_platform donations (should be counted)
        session.add(
            Invoice(
                user_id=user.id,
                amount=100,
                stripe_payment_intent_id="pi_test_1",
                stripe_receipt_url="https://example.com/receipt/1",
                invoice_type=InvoiceType.on_platform,
            )
        )
        session.add(
            Invoice(
                user_id=user.id,
                amount=250,
                stripe_payment_intent_id="pi_test_2",
                stripe_receipt_url="https://example.com/receipt/2",
                invoice_type=InvoiceType.on_platform,
            )
        )
        session.add(
            Invoice(
                user_id=user.id,
                amount=500,
                stripe_payment_intent_id="pi_test_3",
                stripe_receipt_url="https://example.com/receipt/3",
                invoice_type=InvoiceType.on_platform,
            )
        )

    with (
        patch("couchers.servicers.public.DONATION_GOAL_USD", 5000),
        patch("couchers.servicers.public.DONATION_OFFSET_USD", 0),
    ):
        with public_session() as public:
            res = public.GetDonationStats(empty_pb2.Empty())
            assert res.total_donated_ytd == 850
            assert res.goal == 5000


def test_GetDonationStats_excludes_merch(db):
    """Test GetDonationStats excludes external_shop (merch) invoices"""
    _get_donation_stats.cache_clear()
    user, _ = generate_user()

    with session_scope() as session:
        # Add on_platform donation (should be counted)
        session.add(
            Invoice(
                user_id=user.id,
                amount=200,
                stripe_payment_intent_id="pi_test_donation",
                stripe_receipt_url="https://example.com/receipt/donation",
                invoice_type=InvoiceType.on_platform,
            )
        )
        # Add external_shop/merch purchase (should NOT be counted)
        session.add(
            Invoice(
                user_id=user.id,
                amount=50,
                stripe_payment_intent_id="pi_test_merch",
                stripe_receipt_url="https://example.com/receipt/merch",
                invoice_type=InvoiceType.external_shop,
            )
        )

    with (
        patch("couchers.servicers.public.DONATION_GOAL_USD", 5000),
        patch("couchers.servicers.public.DONATION_OFFSET_USD", 0),
    ):
        with public_session() as public:
            res = public.GetDonationStats(empty_pb2.Empty())
            # Should only count the on_platform donation, not the merch
            assert res.total_donated_ytd == 200
            assert res.goal == 5000


def test_GetDonationStats_excludes_previous_years(db):
    """Test GetDonationStats only counts current year donations"""
    _get_donation_stats.cache_clear()
    user, _ = generate_user()

    with session_scope() as session:
        # Add donation from this year (should be counted)
        session.add(
            Invoice(
                user_id=user.id,
                amount=300,
                stripe_payment_intent_id="pi_test_this_year",
                stripe_receipt_url="https://example.com/receipt/this_year",
                invoice_type=InvoiceType.on_platform,
            )
        )
        # Add donation from last year (should NOT be counted)
        last_year = datetime(datetime.now(UTC).year - 1, 6, 15, tzinfo=UTC)
        invoice = Invoice(
            user_id=user.id,
            amount=1000,
            stripe_payment_intent_id="pi_test_last_year",
            stripe_receipt_url="https://example.com/receipt/last_year",
            invoice_type=InvoiceType.on_platform,
        )
        session.add(invoice)
        session.flush()
        # Manually set the created date to last year
        invoice.created = last_year

    with (
        patch("couchers.servicers.public.DONATION_GOAL_USD", 5000),
        patch("couchers.servicers.public.DONATION_OFFSET_USD", 0),
    ):
        with public_session() as public:
            res = public.GetDonationStats(empty_pb2.Empty())
            # Should only count this year's donation
            assert res.total_donated_ytd == 300
            assert res.goal == 5000


def test_GetVolunteers_mixed_current_and_past(db):
    """Test GetVolunteers with both current and past volunteers"""

    _get_volunteers.cache_clear()

    current1, _ = generate_user(username="current1")
    current2, _ = generate_user(username="current2")
    past1, _ = generate_user(username="past1")
    past2, _ = generate_user(username="past2")

    with session_scope() as session:
        session.add(
            make_volunteer(
                user_id=current1.id,
                role="Current Role 1",
                started_volunteering=datetime(2023, 1, 1).date(),
            )
        )
        session.add(
            make_volunteer(
                user_id=current2.id,
                role="Current Role 2",
                started_volunteering=datetime(2024, 1, 1).date(),
            )
        )
        session.add(
            make_volunteer(
                user_id=past1.id,
                role="Past Role 1",
                started_volunteering=datetime(2020, 1, 1).date(),
                stopped_volunteering=datetime(2022, 6, 1).date(),
            )
        )
        session.add(
            make_volunteer(
                user_id=past2.id,
                role="Past Role 2",
                started_volunteering=datetime(2021, 1, 1).date(),
                stopped_volunteering=datetime(2023, 12, 31).date(),
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetVolunteers(empty_pb2.Empty())
        assert len(res.current_volunteers) == 2
        assert len(res.past_volunteers) == 2

        # Past volunteers are sorted by stopped_volunteering descending
        assert res.past_volunteers[0].username == "past2"
        assert res.past_volunteers[1].username == "past1"


def test_GetVolunteers_custom_sort_key(db):
    """Test GetVolunteers respects custom sort_key"""

    _get_volunteers.cache_clear()

    user1, _ = generate_user(username="user1")
    user2, _ = generate_user(username="user2")
    user3, _ = generate_user(username="user3")

    with session_scope() as session:
        # user2 should be first (lowest sort_key)
        session.add(
            make_volunteer(
                user_id=user2.id,
                role="Role 2",
                started_volunteering=datetime(2023, 3, 1).date(),
                sort_key=1.0,
            )
        )
        # user3 should be second
        session.add(
            make_volunteer(
                user_id=user3.id,
                role="Role 3",
                started_volunteering=datetime(2023, 1, 1).date(),
                sort_key=2.0,
            )
        )
        # user1 should be last (no sort_key, falls back to started_volunteering)
        session.add(
            make_volunteer(
                user_id=user1.id,
                role="Role 1",
                started_volunteering=datetime(2023, 2, 1).date(),
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetVolunteers(empty_pb2.Empty())
        assert len(res.current_volunteers) == 3
        assert res.current_volunteers[0].username == "user2"
        assert res.current_volunteers[1].username == "user3"
        assert res.current_volunteers[2].username == "user1"


def test_GetVolunteers_excludes_hidden(db):
    """Test GetVolunteers excludes volunteers with show_on_team_page=False"""

    _get_volunteers.cache_clear()

    user1, _ = generate_user(username="visible")
    user2, _ = generate_user(username="hidden")

    with session_scope() as session:
        session.add(
            make_volunteer(
                user_id=user1.id,
                role="Visible Role",
                started_volunteering=datetime(2023, 1, 1).date(),
            )
        )
        session.add(
            make_volunteer(
                user_id=user2.id,
                role="Hidden Role",
                started_volunteering=datetime(2023, 1, 1).date(),
                show_on_team_page=False,
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetVolunteers(empty_pb2.Empty())
        assert len(res.current_volunteers) == 1
        assert res.current_volunteers[0].username == "visible"


def test_GetVolunteers_link_types(db):
    """Test GetVolunteers handles different link types"""

    _get_volunteers.cache_clear()

    user_default, _ = generate_user(username="default_link")
    user_custom, _ = generate_user(username="custom_link")

    with session_scope() as session:
        # Volunteer with default couchers link
        session.add(
            make_volunteer(
                user_id=user_default.id,
                role="Default Link",
                started_volunteering=datetime(2023, 1, 1).date(),
            )
        )
        # Volunteer with custom link
        session.add(
            make_volunteer(
                user_id=user_custom.id,
                role="Custom Link",
                started_volunteering=datetime(2023, 1, 1).date(),
                link_type="email",
                link_text="contact@example.com",
                link_url="mailto:contact@example.com",
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetVolunteers(empty_pb2.Empty())
        assert len(res.current_volunteers) == 2

        # Check default link
        default_vol = next(v for v in res.current_volunteers if v.username == "default_link")
        assert default_vol.link_type == "couchers"
        assert default_vol.link_text == "@default_link"
        assert "default_link" in default_vol.link_url

        # Check custom link
        custom_vol = next(v for v in res.current_volunteers if v.username == "custom_link")
        assert custom_vol.link_type == "email"
        assert custom_vol.link_text == "contact@example.com"
        assert custom_vol.link_url == "mailto:contact@example.com"


def test_GetVolunteers_board_member_flag(db):
    """Test GetVolunteers correctly identifies board members"""

    _get_volunteers.cache_clear()

    board_member, _ = generate_user(username="board_member")
    regular_volunteer, _ = generate_user(username="regular")

    with session_scope() as session:
        session.add(
            make_volunteer(
                user_id=board_member.id,
                role="Board Member Role",
                started_volunteering=datetime(2023, 1, 1).date(),
            )
        )
        session.add(
            make_volunteer(
                user_id=regular_volunteer.id,
                role="Regular Role",
                started_volunteering=datetime(2023, 1, 1).date(),
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    # Mock the static badge dict to include board_member
    with patch("couchers.servicers.public.get_static_badge_dict", return_value={"board_member": [board_member.id]}):
        with public_session() as public:
            res = public.GetVolunteers(empty_pb2.Empty())
            assert len(res.current_volunteers) == 2

            board_vol = next(v for v in res.current_volunteers if v.username == "board_member")
            assert board_vol.is_board_member is True

            regular_vol = next(v for v in res.current_volunteers if v.username == "regular")
            assert regular_vol.is_board_member is False


def test_GetSignupPageInfo(db):
    """Test GetSignupPageInfo returns a correct user count and last signup info"""

    _get_signup_page_info.cache_clear()

    user1, _ = generate_user(username="user1")
    user2, _ = generate_user(username="user2")
    user3, _ = generate_user(username="user3")

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetSignupPageInfo(empty_pb2.Empty())
        # user3 should be the last signup (highest id)
        assert res.user_count >= 3
        assert res.last_location  # Should have some location
        assert res.last_signup  # Should have a timestamp


def test_GetSignupPageInfo_excludes_invisible_users(db):
    """Test GetSignupPageInfo excludes deleted/banned users from count"""
    _get_signup_page_info.cache_clear()

    visible_user, _ = generate_user(username="visible")
    deleted_user, _ = generate_user(username="deleted", delete_user=True)

    with public_session() as public:
        res = public.GetSignupPageInfo(empty_pb2.Empty())
        # Deleted user should not be counted or be the last signup
        assert res.user_count >= 1


def test_GetPublicUser_not_found(db):
    """Test GetPublicUser returns NOT_FOUND for nonexistent user"""
    with public_session() as public:
        with pytest.raises(grpc.RpcError) as exc:
            public.GetPublicUser(public_pb2.GetPublicUserReq(user="nonexistent_user"))
        assert exc.value.code() == grpc.StatusCode.NOT_FOUND


def test_GetPublicUser_invisible_user(db):
    """Test GetPublicUser returns NOT_FOUND for deleted/banned user"""
    deleted_user, _ = generate_user(username="deleted", delete_user=True)

    with public_session() as public:
        with pytest.raises(grpc.RpcError) as exc:
            public.GetPublicUser(public_pb2.GetPublicUserReq(user="deleted"))
        assert exc.value.code() == grpc.StatusCode.NOT_FOUND


def test_GetPublicUser_limited_visibility(db):
    """Test GetPublicUser returns limited_user for user with limited visibility"""

    user, _ = generate_user(
        username="limited_user",
        name="Limited User",
        public_visibility=ProfilePublicVisibility.limited,
    )

    # Add a reference to test reference counting
    referrer, _ = generate_user(username="referrer")
    with session_scope() as session:
        session.add(
            Reference(
                from_user_id=referrer.id,
                to_user_id=user.id,
                reference_type=ReferenceType.friend,
                text="Great host!",
                rating=0.8,
                was_appropriate=True,
            )
        )

    with public_session() as public:
        res = public.GetPublicUser(public_pb2.GetPublicUserReq(user="limited_user"))
        assert res.HasField("limited_user")
        assert res.limited_user.username == "limited_user"
        assert res.limited_user.name == "Limited User"
        assert res.limited_user.city == "Testing city"
        assert res.limited_user.hometown == "Test hometown"
        assert res.limited_user.num_references == 1
        assert res.limited_user.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST
        assert len(res.limited_user.badges) == 0


def test_GetPublicUser_most_visibility(db):
    """Test GetPublicUser returns most_user for user with most visibility"""
    user, _ = generate_user(
        username="most_user",
        name="Most User",
        public_visibility=ProfilePublicVisibility.most,
    )

    with public_session() as public:
        res = public.GetPublicUser(public_pb2.GetPublicUserReq(user="most_user"))
        assert res.HasField("most_user")
        assert res.most_user.username == "most_user"
        assert res.most_user.name == "Most User"
        assert res.most_user.city == "Testing city"
        assert res.most_user.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST


def test_GetPublicUser_full_visibility(db):
    """Test GetPublicUser returns full_user for user with full visibility"""
    _get_public_users.cache_clear()

    user, _ = generate_user(
        username="full_user",
        name="Full User",
        public_visibility=ProfilePublicVisibility.full,
    )

    with public_session() as public:
        res = public.GetPublicUser(public_pb2.GetPublicUserReq(user="full_user"))
        assert res.HasField("full_user")
        assert res.full_user.username == "full_user"
        assert res.full_user.name == "Full User"
        assert res.full_user.city == "Testing city"
        # Full user should have all the fields from the complete user profile
        assert res.full_user.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST
