"""
Stand-in for the MyPostcard API, used when MYPOSTCARD_LIVE is off.

Lets non-prod deployments run the whole postal verification flow without placing (billed) orders: instead of
mailing a postcard, we email the recipient the image that would have been printed, so they can read the code
or scan the QR and carry on through the flow.
"""

import logging

from sqlalchemy.orm.session import Session

from couchers.email.queuing import queue_system_email
from couchers.postal.my_postcard import _generate_back_left_side_png
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

ATTACHMENT_FILENAME = "example-postcard.png"


def send_simulated_postcard(
    session: Session,
    *,
    recipient_email: str,
    recipient_name: str,
    address_line_1: str,
    address_line_2: str | None,
    city: str,
    state: str | None,
    postal_code: str | None,
    country: str,
    verification_code: str,
) -> None:
    """
    Emails the rendered postcard instead of mailing one. See the module docstring.
    """
    logger.warning(
        f"MYPOSTCARD_LIVE is off: simulating postcard to {recipient_email} instead of mailing one. "
        "If this is production, postal verification postcards are NOT being sent."
    )

    address = ", ".join(part for part in (address_line_1, address_line_2, city, state, postal_code, country) if part)

    queue_system_email(
        session,
        recipient_email,
        "simulated_postal_verification_postcard",
        {
            "recipient_name": recipient_name,
            "address": address,
            "verification_code": verification_code,
        },
        attachments=[
            jobs_pb2.EmailPart(
                data=_generate_back_left_side_png(verification_code),
                content_type=f'image/png; name="{ATTACHMENT_FILENAME}"',
                content_disposition=f'attachment; filename="{ATTACHMENT_FILENAME}"',
            )
        ],
    )
