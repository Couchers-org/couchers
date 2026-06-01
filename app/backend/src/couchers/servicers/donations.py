import json
import logging

import grpc
import stripe
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers import urls
from couchers.config import config
from couchers.context import CouchersContext
from couchers.event_log import log_event
from couchers.helpers.badges import user_add_badge
from couchers.models import DonationInitiation, DonationType, Invoice, InvoiceType, User
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import donations_pb2, donations_pb2_grpc, notification_data_pb2, stripe_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.sentry import report_error
from couchers.slack import send_slack_message
from couchers.utils import not_none

logger = logging.getLogger(__name__)


def _create_stripe_customer(session: Session, user: User) -> None:
    # create a new stripe id for this user
    customer = stripe.Customer.create(
        email=user.email,
        # metadata allows us to store arbitrary metadata for ourselves
        metadata={"user_id": user.id},  # type: ignore[dict-item]
        api_key=config["STRIPE_API_KEY"],
    )
    user.stripe_customer_id = customer.id
    # commit since we only ever want one stripe customer id per user, so if the rest of this api call fails, this will still be saved in the db
    session.commit()


class Donations(donations_pb2_grpc.DonationsServicer):
    def InitiateDonation(
        self, request: donations_pb2.InitiateDonationReq, context: CouchersContext, session: Session
    ) -> donations_pb2.InitiateDonationRes:
        if not context.get_boolean_value("donations_enabled", default=False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "donations_disabled")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if request.amount < 2:
            # we don't want to waste *all* of the donation on processing fees
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "donation_too_small")

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
            client_reference_id=str(user.id),
            # Stripe actually allows None, but the signature says it's either a string or not passed.
            submit_type="donate" if not request.recurring else None,  # type: ignore[arg-type]
            customer=not_none(user.stripe_customer_id),
            success_url=urls.donation_success_url(),
            cancel_url=urls.donation_cancelled_url(),
            payment_method_types=["card"],
            mode="subscription" if request.recurring else "payment",
            line_items=[item],  # type: ignore[list-item]
            api_key=config["STRIPE_API_KEY"],
        )

        session.add(
            DonationInitiation(
                user_id=user.id,
                amount=request.amount,
                stripe_checkout_session_id=checkout_session.id,
                donation_type=DonationType.recurring if request.recurring else DonationType.one_time,
                source=request.source if request.source else None,
            )
        )

        log_event(
            context,
            session,
            "donation.initiated",
            {"amount": request.amount, "recurring": request.recurring, "source": request.source or None},
        )

        return donations_pb2.InitiateDonationRes(
            stripe_checkout_session_id=checkout_session.id, stripe_checkout_url=checkout_session.url
        )

    def GetDonationPortalLink(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> donations_pb2.GetDonationPortalLinkRes:
        if not context.get_boolean_value("donations_enabled", default=False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "donations_disabled")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not user.stripe_customer_id:
            _create_stripe_customer(session, user)

        stripe_session = stripe.billing_portal.Session.create(
            customer=not_none(user.stripe_customer_id),
            return_url=urls.donation_url(),
            api_key=config["STRIPE_API_KEY"],
        )

        return donations_pb2.GetDonationPortalLinkRes(stripe_portal_url=stripe_session.url)


class Stripe(stripe_pb2_grpc.StripeServicer):
    def Webhook(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        # We're set up to receive the following webhook events (with explanations from stripe docs):
        # For both recurring and one-off donations, we get a `charge.succeeded` event and we then send the user an
        # invoice. There are other events too, but we don't handle them right now.
        event = stripe.Webhook.construct_event(  # type: ignore[no-untyped-call]
            payload=request.data,
            sig_header=context.headers.get("stripe-signature"),
            secret=config["STRIPE_WEBHOOK_SECRET"],
            api_key=config["STRIPE_API_KEY"],
        )
        data = event["data"]
        event_type = event["type"]
        event_id = event["id"]
        data_object = data["object"]
        metadata = data_object.get("metadata", {})

        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        logger.info(f"Got signed Stripe webhook, {event_type=}, {event_id=}")

        if event_type == "charge.succeeded":
            if metadata.get("site_url") == config["MERCH_SHOP_URL"]:
                # merch shop. look up this email and give them the swagster badge
                customer_email = metadata["customer_email"]
                amount = int(data_object["amount"]) // 100
                user = session.execute(select(User).where(User.email == customer_email)).scalar_one_or_none()
                if user:
                    user_add_badge(session, user.id, "swagster")
                    user_link = urls.user_link(username=user.username)
                    customer_info = f"<{user_link}|{user.name}>"
                else:
                    customer_info = customer_email
                try:
                    send_slack_message(
                        config["SLACK_MERCH_CHANNEL"],
                        f"Merch purchase: ${amount} from {customer_info}",
                    )
                except Exception as e:
                    report_error(e)
            else:
                customer_id = data_object["customer"]
                user = session.execute(select(User).where(User.stripe_customer_id == customer_id)).scalar_one()
                # amount comes in cents
                amount = int(data_object["amount"]) // 100
                receipt_url = data_object["receipt_url"]
                payment_intent_id = data_object["payment_intent"]

                invoice = Invoice(
                    user_id=user.id,
                    amount=amount,
                    stripe_payment_intent_id=payment_intent_id,
                    stripe_receipt_url=receipt_url,
                    invoice_type=InvoiceType.on_platform,
                )
                session.add(invoice)
                session.flush()
                user.last_donated = invoice.created

                notify(
                    session,
                    user_id=user.id,
                    topic_action=NotificationTopicAction.donation__received,
                    key="",
                    data=notification_data_pb2.DonationReceived(
                        amount=amount,
                        receipt_url=receipt_url,
                    ),
                )

                # Recurring donations go through Stripe invoices, one-time don't
                is_recurring = data_object.get("invoice") is not None
                donation_type = "recurring" if is_recurring else "one-time"
                user_link = urls.user_link(username=user.username)
                try:
                    send_slack_message(
                        config["SLACK_DONATIONS_CHANNEL"],
                        f"Donation received: ${amount} ({donation_type}) from <{user_link}|{user.name}>",
                    )
                except Exception as e:
                    report_error(e)
        else:
            logger.info(f"Unhandled event from Stripe: {event_type}")

        return httpbody_pb2.HttpBody(
            content_type="application/json",
            # json.dumps escapes non-ascii characters
            data=json.dumps({"success": True}).encode("ascii"),
        )
