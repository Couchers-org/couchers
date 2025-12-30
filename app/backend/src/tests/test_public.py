import json
from datetime import UTC, datetime
from math import sqrt
from unittest.mock import patch

import pytest
from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import update_randomized_locations
from couchers.models import (
    Invoice,
    InvoiceType,
    ProfilePublicVisibility,
)
from couchers.servicers.public import _get_donation_stats
from tests.test_fixtures import (  # noqa
    db,
    generate_user,
    process_jobs,
    public_session,
    testconfig,
)


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
    _get_donation_stats.cache.clear()

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
    _get_donation_stats.cache.clear()
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
    _get_donation_stats.cache.clear()
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
    _get_donation_stats.cache.clear()
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
