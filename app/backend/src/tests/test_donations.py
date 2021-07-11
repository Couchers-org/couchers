from unittest.mock import patch

import pytest

import couchers.servicers.donations
from couchers.config import config
from proto import donations_pb2
from tests.test_fixtures import db, donations_session, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_one_off_donation_flow(db, monkeypatch):
    user, token = generate_user()
    user_email = user.email
    user_id = user.id

    new_config = config.copy()
    new_config["ENABLE_DONATIONS"] = True
    new_config["STRIPE_API_KEY"] = "sk_test_51I..."
    new_config["STRIPE_WEBHOOK_SECRET"] = "whsec_9BCbwyGS6a4XIwpUEkqy3aUASF5IADZV"
    new_config["STRIPE_RECURRING_PRODUCT_ID"] = "price_1IRoHdE5kUmYuPWz9tX8UpRv"

    monkeypatch.setattr(couchers.servicers.donations, "config", new_config)

    with donations_session(token) as donations:
        with patch("couchers.servicers.donations.stripe") as mock:
            mock.Customer.create.return_value = type("__MockCustomer", (), {"id": "dummy_customer_id"})
            mock.checkout.Session.create.return_value = type(
                "__MockCheckoutSession",
                (),
                {"id": "dummy_checkout_session_id", "payment_intent": "dummy_payment_intent"},
            )

            res = donations.InitiateDonation(
                donations_pb2.InitiateDonationReq(
                    amount=50,
                    recurring=False,
                )
            )

        mock.Customer.create.assert_called_once_with(email=user_email, metadata={"user_id": user_id})

        mock.checkout.Session.create.assert_called_once_with(
            client_reference_id=user_id,
            submit_type="donate",
            customer="dummy_customer_id",
            success_url="http://localhost:3000/donate?success=true&session={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:3000/donate?cancelled=true",
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": 5000,
                        "product_data": {
                            "name": f"Couchers financial supporter (one-time)",
                            "images": ["https://couchers.org/img/share.jpg"],
                        },
                    },
                    "quantity": 1,
                }
            ],
        )
