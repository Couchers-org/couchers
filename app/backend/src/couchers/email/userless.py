from typing import Any

from sqlalchemy.orm import Session

from couchers.config import config
from couchers.email.content import EmailContent
from couchers.email.queuing import queue_email
from couchers.i18n import LocalizationContext
from couchers.templating import Jinja2Template, template_folder
from couchers.utils import now


def get_userless_email_content(
    subject: str, template_name: str, template_args: dict[str, Any], loc_context: LocalizationContext
) -> EmailContent:
    template_args = {
        **template_args,
        "header_subject": subject,
        "footer_timezone_name": loc_context.localized_timezone,
        "footer_copyright_year": now().year,
        "footer_email_is_critical": True,  # Results in no unsubscribe footer.
    }

    # Format plaintext template
    plain_tmplt_body = (template_folder / f"{template_name}.txt").read_text()
    plain_tmplt_footer = (template_folder / "_footer.txt").read_text()
    plain_tmplt = Jinja2Template(source=plain_tmplt_body + plain_tmplt_footer, html=False)
    plain = plain_tmplt.render(template_args, loc_context)

    # Format html template
    html_tmplt = Jinja2Template(
        source=(template_folder / "generated_html" / f"{template_name}.html").read_text(), html=True
    )
    html = html_tmplt.render(template_args, loc_context)

    return EmailContent(subject=config["NOTIFICATION_PREFIX"] + subject, body_plaintext=plain, body_html=html)


def queue_userless_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._queue_notification_email

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    # Not yet localizable
    email_content = get_userless_email_content(subject, template_name, template_args, LocalizationContext.en_utc())

    queue_email(
        session,
        recipient=recipient,
        content=email_content,
        source_data=config["VERSION"] + f"/{template_name}",
    )
