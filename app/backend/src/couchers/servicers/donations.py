import json
import logging

import grpc
import stripe

from couchers import errors, urls
from couchers.config import config
from couchers.db import session_scope
from couchers.models import Invoice, OneTimeDonation, RecurringDonation, User
from couchers.sql import couchers_select as select
from couchers.tasks import send_donation_email
from couchers.utils import now
from proto import donations_pb2, donations_pb2_grpc, stripe_pb2_grpc
from proto.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


class Donations(donations_pb2_grpc.DonationsServicer):
    def __init__(self):
        self.enabled = config["ENABLE_DONATIONS"]

        if self.enabled:
            stripe.api_key = config["STRIPE_API_KEY"]

    def InitiateDonation(self, request, context):
        if not self.enabled:
            context.abort(grpc.StatusCode.UNAVAILABLE, errors.DONATIONS_DISABLED)

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if request.amount < 2:
                # we don't want to waste *all* the donations on processing fees
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DONATION_TOO_SMALL)

            if not user.stripe_customer_id:
                # create a new stripe id for this user
                customer = stripe.Customer.create(
                    email=user.email,
                    # metadata allows us to store arbitrary metadata for ourselves
                    metadata={"user_id": user.id},
                )
                user.stripe_customer_id = customer.id
                # commit since we only ever want one stripe customer id per user, so if the rest of this api call fails, this will still be saved in the db
                session.commit()

            if request.recurring:
                item = {
                    "price": config["STRIPE_RECURRING_PRODUCT_ID"],
                    "quantity": request.amount,
                }
            else:
                item = {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": request.amount * 100,  # input is in cents
                        "product_data": {
                            "name": f"Couchers financial supporter (one-time)",
                            "images": ["https://couchers.org/img/share.jpg"],
                        },
                    },
                    "quantity": 1,
                }

            checkout_session = stripe.checkout.Session.create(
                client_reference_id=user.id,
                submit_type="donate" if not request.recurring else None,
                customer=user.stripe_customer_id,
                success_url=urls.donation_success_url(),
                cancel_url=urls.donation_cancelled_url(),
                payment_method_types=["card"],
                mode="subscription" if request.recurring else "payment",
                line_items=[item],
            )

            if request.recurring:
                session.add(
                    RecurringDonation(
                        user_id=user.id,
                        amount=request.amount,
                        stripe_checkout_session_id=checkout_session.id,
                    )
                )
            else:
                session.add(
                    OneTimeDonation(
                        user_id=user.id,
                        amount=request.amount,
                        stripe_checkout_session_id=checkout_session.id,
                        stripe_payment_intent_id=checkout_session.payment_intent,
                        paid=None,
                    )
                )

            return donations_pb2.InitiateDonationRes(stripe_checkout_session_id=checkout_session.id)


class Stripe(stripe_pb2_grpc.StripeServicer):
    def Webhook(self, request, context):
        # We're set up to receive the following webhook events (with explanations from stripe docs):
        # For both recurring and one-off donations, we get a `checkout.session.completed` event, and then a `payment_intent.succeeded` event
        headers = dict(context.invocation_metadata())

        try:
            logger.info(request.data)
            event = stripe.Webhook.construct_event(
                payload=request.data,
                sig_header=headers.get("stripe-signature"),
                secret=config["STRIPE_WEBHOOK_SECRET"],
            )
            data = event["data"]
            event_type = event["type"]
            event_id = event["id"]
            data_object = data["object"]
        except Exception as e:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.STRIPE_WEBHOOK_FAILED_SIG)
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        logger.info(f"Got signed Stripe webhook, {event_type=}, {event_id=}")

        if event_type == "checkout.session.completed":
            checkout_session_id = data_object["id"]
            if data_object["payment_intent"]:
                with session_scope() as session:
                    donation = session.execute(
                        select(OneTimeDonation).where(OneTimeDonation.stripe_checkout_session_id == checkout_session_id)
                    ).scalar_one()
                    if data_object["payment_status"] == "paid":
                        donation.paid = now()
                    else:
                        raise Exception("Unknown payment status")
            elif data_object["subscription"]:
                with session_scope() as session:
                    donation = session.execute(
                        select(RecurringDonation).where(
                            RecurringDonation.stripe_checkout_session_id == checkout_session_id
                        )
                    ).scalar_one()
                    donation.stripe_subscription_id = data_object["subscription"]
            else:
                raise Exception("Unknown payment type")
        elif event_type == "payment_intent.succeeded":
            customer_id = data_object["customer"]
            with session_scope() as session:
                user = session.execute(select(User).where(User.stripe_customer_id == customer_id)).scalar_one()
                invoice_data = data_object["charges"]["data"][0]
                # amount comes in cents
                amount = float(invoice_data["amount"]) / 100
                receipt_url = invoice_data["receipt_url"]
                session.add(
                    Invoice(
                        user_id=user.id,
                        amount=amount,
                        stripe_payment_intent_id=invoice_data["payment_intent"],
                        stripe_receipt_url=receipt_url,
                    )
                )
                send_donation_email(user, amount, receipt_url)
        else:
            logger.info(f"Unhandled event from Stripe: {event_type}")

        return httpbody_pb2.HttpBody(
            content_type="application/json",
            # json.dumps escapes non-ascii characters
            data=json.dumps({"success": True}).encode("ascii"),
        )
