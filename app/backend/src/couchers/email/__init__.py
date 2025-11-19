import logging
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm.session import Session

from couchers.config import config
from couchers.jobs.enqueue import queue_job
from couchers.metrics import emails_counter
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

loader = FileSystemLoader(Path(__file__).parent / ".." / ".." / ".." / "templates")
env = Environment(loader=loader, trim_blocks=True)


def _queue_email(
    session: Session,
    sender_name: str,
    sender_email: str,
    recipient: str,
    subject: str,
    plain: str,
    html: str | None,
    list_unsubscribe_header: str | None,
    source_data: str | None,
) -> None:
    payload = jobs_pb2.SendEmailPayload(
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )
    queue_job(
        session,
        job_type="send_email",
        payload=payload,
        priority=5,
    )


def queue_email(
    session: Session,
    sender_name: str,
    sender_email: str,
    recipient: str,
    subject: str,
    plain: str,
    html: str | None,
    list_unsubscribe_header: str | None = None,
    source_data: str | None = None,
) -> None:
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """
    _queue_email(
        session=session,
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )


def enqueue_system_email(session: Session, recipient: str, template_name: str, template_args: dict[str, Any]) -> None:
    source, _, _ = loader.get_source(env, f"system/{template_name}.md")
    _, frontmatter_source, text_source = source.split("---", 2)

    rendered_frontmatter = env.from_string(frontmatter_source).render(**template_args, plain=True, html=False)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain = env.from_string(text_source.strip()).render(
        {**template_args, "frontmatter": frontmatter}, plain=True, html=False
    )

    queue_email(
        session,
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=recipient,
        subject=config["NOTIFICATION_PREFIX"] + frontmatter["subject"],
        plain=plain,
        html=None,
        source_data=template_name,
    )

    emails_counter.inc()
