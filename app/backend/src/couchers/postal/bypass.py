"""
Emails the recipient their verification code instead of posting them a postcard.

Used when POSTAL_VERIFICATION_BYPASS_POST_AND_EMAIL_CODE_FOR_TESTING is set, so a deployment can run the whole
postal verification flow end to end without placing (billed) MyPostcard orders. The code is real and completes
verification; only the printing and posting is skipped.
"""

import logging

from sqlalchemy.orm.session import Session

from couchers.email.queuing import queue_system_email
from couchers.postal.my_postcard import _generate_back_left_side_png
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

ATTACHMENT_FILENAME = "postcard.png"


def email_verification_code_instead_of_posting(
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
    address = ", ".join(part for part in (address_line_1, address_line_2, city, state, postal_code, country) if part)

    queue_system_email(
        session,
        recipient_email,
        "postal_verification_testing_code",
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
