from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from couchers.config import config
from couchers.email import queue_email
from couchers.templates.v2 import CONTEXT_YEAR_KEY, Context, render_template, template_folder
from couchers.utils import now


def send_simple_pretty_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    template_args[CONTEXT_YEAR_KEY] = now().year
    template_args["header_subject"] = subject
    template_args["footer_email_is_critical"] = True  # Results in no unsubscribe footer.

    # Format plaintext template
    plain_tmplt = (template_folder / f"{template_name}.txt").read_text()
    plain_tmplt_footer = (template_folder / "_footer.txt").read_text()
    plain = render_template(
        plain_tmplt + plain_tmplt_footer,
        template_args,
        Context(
            # Not yet localizable
            timezone=ZoneInfo("Etc/UTC"),
            locale="en",
            plaintext=True,
        ),
    )

    # Format html template
    html_tmplt = (template_folder / "generated_html" / f"{template_name}.html").read_text()
    html = render_template(
        html_tmplt,
        template_args,
        Context(
            # Not yet localizable
            timezone=ZoneInfo("Etc/UTC"),
            locale="en",
            plaintext=False,
        ),
    )

    queue_email(
        session,
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=recipient,
        subject=config["NOTIFICATION_PREFIX"] + subject,
        plain=plain,
        html=html,
        source_data=config["VERSION"] + f"/{template_name}",
    )
