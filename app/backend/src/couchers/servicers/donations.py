import logging

import grpc

from couchers import config, errors, urls
from couchers.db import session_scope
from couchers.models import User
from pb import donations_pb2, donations_pb2_grpc

enabled = config.config["ENABLE_DONATIONS"]

if enabled:
    import stripe

    stripe.api_key = config.config["STRIPE_API_KEY"]
    RECURRING_DONATION_ID = config.config["STRIPE_RECURRING_PRODUCT_ID"]


class Donations(donations_pb2_grpc.DonationsServicer):
    def InitiateDonation(self, request, context):
        if not enabled:
            context.abort(grpc.StatusCode.UNAVAILABLE, errors.DONATIONS_DISABLED)

        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if request.amount < 2:
                # we don't want to waste *all* the donations on processing fees
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DONATION_TOO_SMALL)

            if request.recurring:
                item = {
                    "price": RECURRING_DONATION_ID,
                    "quantity": request.amount,
                }
            else:
                item = {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": request.amount * 100,  # input is in cents
                        "product_data": {
                            "name": f"Couchers financial supporter (one-off)",
                            "images": ["https://couchers.org/img/share.jpg"],
                        },
                    },
                    "quantity": 1,
                }

            checkout_session = stripe.checkout.Session.create(
                submit_type="donate" if not request.recurring else None,
                customer_email=user.email,
                success_url=urls.donation_success_url(),
                cancel_url=urls.donation_cancelled_url(),
                payment_method_types=["card"],
                mode="subscription" if request.recurring else "payment",
                line_items=[item],
            )

            return donations_pb2.InitiateDonationRes(stripe_checkout_session_id=checkout_session.id)
