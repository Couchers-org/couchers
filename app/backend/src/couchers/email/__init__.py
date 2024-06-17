import logging
from html import escape
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader

from couchers.config import config
from couchers.jobs.enqueue import queue_job
from proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

loader = FileSystemLoader(Path(__file__).parent / ".." / ".." / ".." / "templates")
env = Environment(loader=loader, trim_blocks=True)


def _queue_email(sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header, source_data):
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
        job_type="send_email",
        payload=payload,
    )


def queue_email(
    sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header=None, source_data=None
):
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """
    _queue_email(
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )


def enqueue_system_email(recipient, template_name, template_args):
    source, _, _ = loader.get_source(env, f"system/{template_name}.md")
    _, frontmatter_source, text_source = source.split("---", 2)

    rendered_frontmatter = env.from_string(frontmatter_source).render(**template_args, plain=True, html=False)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain = env.from_string(text_source).render({**template_args, "frontmatter": frontmatter}, plain=True, html=False)

    # chatwoot won't show plaintext correctly, so wrap it in some HTML
    html = f"<html><body><pre>{escape(plain)}</pre></body></html>"

    queue_email(
        config["NOTIFICATION_EMAIL_SENDER"],
        config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient,
        config["NOTIFICATION_EMAIL_PREFIX"] + frontmatter["subject"],
        plain,
        html,
        source_data=template_name,
    )
