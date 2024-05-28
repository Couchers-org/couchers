"""
template mailer v2
"""

import logging
from html import escape
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader

from couchers.config import config
from couchers.email import queue_email
from couchers.notifications.unsubscribe import generate_do_not_email
from couchers.utils import get_tz_as_text, now

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

loader = FileSystemLoader(template_folder)
env = Environment(loader=loader, trim_blocks=True)


def v2esc(value):
    return escape(str(value))


def v2sf(value):
    return value


def v2url(value):
    return value


env.filters["v2esc"] = v2esc
env.filters["v2sf"] = v2sf
env.filters["v2url"] = v2url


def render_html(text):
    stripped_paragraphs = text.strip().split("\n\n")
    return "\n\n".join(f"<p>{paragraph.strip()}</p>" for paragraph in stripped_paragraphs)


def __render_email(template_name, template_args, _footer_unsub_link):
    return frontmatter, plain, html


def email_user(user, template_name, template_args={}, is_critical_email=False):
    # Titles/config are from {template_name}.yaml, plaintext from {template_name}.txt, and html from generated_html/{template_name}.html (generated from {template_name}.mjml)
    frontmatter_template = env.get_template(f"{template_name}.yaml")
    rendered_frontmatter = frontmatter_template.render(**template_args)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)
    assert "subject" in frontmatter
    assert "is_critical" in frontmatter
    assert "preview" in frontmatter

    if not frontmatter["is_critical"]:
        template_args["_footer_unsub_link"] = generate_do_not_email(user.id)

    template_args["_year"] = now().year
    template_args["_timezone_display"] = get_tz_as_text(user.timezone or "Etc/UTC")

    plain_template = env.get_template(f"{template_name}.txt")
    html_template = env.get_template(f"generated_html/{template_name}.html")

    plain = plain_template.render({**template_args, "frontmatter": frontmatter})
    html = html_template.render({**template_args, "frontmatter": frontmatter})

    if user.do_not_email and not frontmatter["is_critical"]:
        logger.info(f"Not emailing {user} based on template {template_name} due to emails turned off")
        return

    queue_email(
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=user.email,
        subject=config["NOTIFICATION_EMAIL_PREFIX"] + frontmatter["subject"],
        plain=plain,
        html=html,
        source_data=config["VERSION"] + f"/{template_name}",
    )
