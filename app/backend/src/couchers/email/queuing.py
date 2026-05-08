from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm.session import Session

from couchers.config import Config
from couchers.i18n import LocalizationContext
from couchers.jobs.enqueue import queue_job
from couchers.metrics import emails_counter
from couchers.proto.internal import jobs_pb2
from couchers.templating import Jinja2Template, template_folder
from couchers.utils import now


def _queue_email(session: Session, payload: jobs_pb2.SendEmailPayload) -> None:
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """

    # Import here to avoid circular dependency
    from couchers.jobs.handlers import send_email  # noqa: PLC0415

    queue_job(
        session,
        job=send_email,
        payload=payload,
        priority=5,
    )

    emails_counter.inc()


def queue_email(session: Session, payload: jobs_pb2.SendEmailPayload) -> None:
    _queue_email(session, payload)


def queue_userless_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    # Not yet localizable
    loc_context = LocalizationContext.en_utc()

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

    queue_email(
        session,
        jobs_pb2.SendEmailPayload(
            sender_name=Config.current.notification_email_sender,
            sender_email=Config.current.notification_email_address,
            recipient=recipient,
            subject=Config.current.notification_prefix + subject,
            plain=plain,
            html=html,
            source_data=Config.current.version + f"/{template_name}",
        ),
    )


_system_email_templates_dir = Path(__file__).parent / ".." / ".." / ".." / "templates" / "system"


def queue_system_email(session: Session, recipient: str, template_name: str, template_args: dict[str, Any]) -> None:
    source = (_system_email_templates_dir / f"{template_name}.md").read_text(encoding="utf8")
    _, frontmatter_source, text_source = source.split("---", 2)

    loc_context = LocalizationContext.en_utc()
    rendered_frontmatter = Jinja2Template(source=frontmatter_source, html=False).render(template_args, loc_context)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain = Jinja2Template(source=text_source.strip(), html=False).render(template_args, loc_context)

    queue_email(
        session,
        jobs_pb2.SendEmailPayload(
            sender_name=Config.current.notification_email_sender,
            sender_email=Config.current.notification_email_address,
            recipient=recipient,
            subject=Config.current.notification_prefix + frontmatter["subject"],
            plain=plain,
            source_data=template_name,
        ),
    )
