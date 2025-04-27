import json
import logging

import grpc
import stripe

from couchers import errors, urls
from couchers.config import config
from couchers.models import DonationInitiation, DonationType, Invoice, User
from couchers.notifications.notify import notify
from couchers.sql import couchers_select as select
from proto import donations_pb2, donations_pb2_grpc, notification_data_pb2, stripe_pb2_grpc
from proto.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


def _create_stripe_customer(session, user):
    # create a new stripe id for this user
    customer = stripe.Customer.create(
        email=user.email,
        # metadata allows us to store arbitrary metadata for ourselves
        metadata={"user_id": user.id},
        api_key=config["STRIPE_API_KEY"],
    )
    user.stripe_customer_id = customer.id
    # commit since we only ever want one stripe customer id per user, so if the rest of this api call fails, this will still be saved in the db
    session.commit()


class Donations(donations_pb2_grpc.DonationsServicer):
    def InitiateDonation(self, request, context, session):
        if not config["ENABLE_DONATIONS"]:
            context.abort(grpc.StatusCode.UNAVAILABLE, errors.DONATIONS_DISABLED)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if request.amount < 2:
            # we don't want to waste *all* of the donation on processing fees
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DONATION_TOO_SMALL)

        if not user.stripe_customer_id:
            _create_stripe_customer(session, user)

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
                        "name": "Couchers financial supporter (one-time)",
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
            api_key=config["STRIPE_API_KEY"],
        )

        session.add(
            DonationInitiation(
                user_id=user.id,
                amount=request.amount,
                stripe_checkout_session_id=checkout_session.id,
                donation_type=DonationType.recurring if request.recurring else DonationType.one_time,
            )
        )

        return donations_pb2.InitiateDonationRes(
            stripe_checkout_session_id=checkout_session.id, stripe_checkout_url=checkout_session.url
        )

    def GetDonationPortalLink(self, request, context, session):
        if not config["ENABLE_DONATIONS"]:
            context.abort(grpc.StatusCode.UNAVAILABLE, errors.DONATIONS_DISABLED)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not user.stripe_customer_id:
            _create_stripe_customer(session, user)

        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=urls.donation_url(),
            api_key=config["STRIPE_API_KEY"],
        )

        return donations_pb2.GetDonationPortalLinkRes(stripe_portal_url=session.url)


class Stripe(stripe_pb2_grpc.StripeServicer):
    def Webhook(self, request, context, session):
        # We're set up to receive the following webhook events (with explanations from stripe docs):
        # For both recurring and one-off donations, we get a `charge.succeeded` event and we then send the user an
        # invoice. There are other events too, but we don't handle them right now.
        headers = dict(context.invocation_metadata())

        event = stripe.Webhook.construct_event(
            payload=request.data,
            sig_header=headers.get("stripe-signature"),
            secret=config["STRIPE_WEBHOOK_SECRET"],
            api_key=config["STRIPE_API_KEY"],
        )
        data = event["data"]
        event_type = event["type"]
        event_id = event["id"]
        data_object = data["object"]

        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        logger.info(f"Got signed Stripe webhook, {event_type=}, {event_id=}")

        if event_type == "charge.succeeded":
            customer_id = data_object["customer"]
            user = session.execute(select(User).where(User.stripe_customer_id == customer_id)).scalar_one()
            # amount comes in cents
            amount = int(data_object["amount"]) // 100
            receipt_url = data_object["receipt_url"]

            # may be check for amount to enable phone verify
            user.has_donated = True

            session.add(
                Invoice(
                    user_id=user.id,
                    amount=amount,
                    stripe_payment_intent_id=data_object["payment_intent"],
                    stripe_receipt_url=receipt_url,
                )
            )

            notify(
                session,
                user_id=user.id,
                topic_action="donation:received",
                data=notification_data_pb2.DonationReceived(
                    amount=amount,
                    receipt_url=receipt_url,
                ),
            )
        else:
            logger.info(f"Unhandled event from Stripe: {event_type}")

        return httpbody_pb2.HttpBody(
            content_type="application/json",
            # json.dumps escapes non-ascii characters
            data=json.dumps({"success": True}).encode("ascii"),
        )
