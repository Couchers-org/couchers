from dataclasses import replace
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from couchers.config import config
from couchers.email import queue_email
from couchers.i18n.localize import localize_timezone
from couchers.templates.v2 import Context, render_template, template_folder
from couchers.utils import now


def send_simple_pretty_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    # Not yet localizable
    timezone = ZoneInfo("Etc/UTC")
    locale = "en"

    template_args = {
        **template_args,
        "header_subject": subject,
        "footer_timezone_name": localize_timezone(timezone, locale),
        "footer_copyright_year": now().year,
        "footer_email_is_critical": True,  # Results in no unsubscribe footer.
    }

    html_context = Context(output_html=True, timezone=timezone, locale=locale)
    plaintext_context = replace(html_context, output_html=False)

    # Format plaintext template
    plain_tmplt = (template_folder / f"{template_name}.txt").read_text()
    plain_tmplt_footer = (template_folder / "_footer.txt").read_text()
    plain = render_template(plain_tmplt + plain_tmplt_footer, template_args, plaintext_context)

    # Format html template
    html_tmplt = (template_folder / "generated_html" / f"{template_name}.html").read_text()
    html = render_template(html_tmplt, template_args, html_context)

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
