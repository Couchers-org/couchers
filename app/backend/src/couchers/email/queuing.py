from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm.session import Session

from couchers.config import config
from couchers.context import CouchersContext
from couchers.email.blocks import EmailBase, EmailFooter
from couchers.email.rendering import render_email
from couchers.i18n import LocalizationContext
from couchers.jobs.enqueue import queue_job
from couchers.metrics import emails_counter
from couchers.proto.internal import jobs_pb2
from couchers.templating import Jinja2Template
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
        priority=15,
    )

    emails_counter.inc()


def queue_email(session: Session, payload: jobs_pb2.SendEmailPayload) -> None:
    _queue_email(session, payload)


def queue_userless_email(
    context: CouchersContext, session: Session, recipient: str, email: EmailBase, source_data_header: str
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    loc_context = context.localization
    if not context.get_boolean_value("notification_translations_enabled", default=False):
        loc_context = LocalizationContext(locale="en", timezone=loc_context.timezone)

    footer = EmailFooter(timezone_name=loc_context.localized_timezone, copyright_year=now().year, unsubscribe_info=None)
    rendered = render_email(email, footer, loc_context)

    queue_email(
        session,
        jobs_pb2.SendEmailPayload(
            sender_name=config.NOTIFICATION_EMAIL_SENDER,
            sender_email=config.NOTIFICATION_EMAIL_ADDRESS,
            recipient=recipient,
            subject=config.NOTIFICATION_PREFIX + rendered.subject,
            plain=rendered.body_plaintext,
            html=rendered.body_html,
            html_related_parts=rendered.html_image_parts,
            source_data=f"{source_data_header}; version={config.VERSION}",
        ),
    )


_system_email_templates_dir = Path(__file__).parent / ".." / ".." / ".." / "templates" / "system"


def queue_system_email(
    session: Session,
    recipient: str,
    template_name: str,
    template_args: dict[str, Any],
    attachments: list[jobs_pb2.EmailPart] | None = None,
) -> None:
    source = (_system_email_templates_dir / f"{template_name}.md").read_text(encoding="utf8")
    _, frontmatter_source, text_source = source.split("---", 2)

    rendered_frontmatter = Jinja2Template(source=frontmatter_source, html=False).render(template_args)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain = Jinja2Template(source=text_source.strip(), html=False).render(template_args)

    queue_email(
        session,
        jobs_pb2.SendEmailPayload(
            sender_name=config.NOTIFICATION_EMAIL_SENDER,
            sender_email=config.NOTIFICATION_EMAIL_ADDRESS,
            recipient=recipient,
            subject=config.NOTIFICATION_PREFIX + frontmatter["subject"],
            plain=plain,
            source_data=template_name,
            attachments=attachments or [],
        ),
    )
