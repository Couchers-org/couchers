"""
template mailer/push notification formatter v2
"""

from couchers import urls
import logging
from datetime import date, datetime
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml
from jinja2 import Environment, FileSystemLoader

from couchers.config import config
from couchers.email import queue_email
from couchers.notifications.push import push_to_user
from couchers.notifications.unsubscribe import generate_do_not_email
from couchers.utils import get_tz_as_text, now

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

loader = FileSystemLoader(template_folder)
env = Environment(loader=loader, trim_blocks=True)


def v2esc(value):
    return escape(str(value))


def v2multiline(value):
    return "<br />".join(value.splitlines())


def v2sf(value):
    return value


def v2url(value):
    return value


def v2phone(value):
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)


def v2date(value, user):
    # todo: user locale-based date formatting
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return value.strftime("%A %-d %B %Y")


def v2time(value, user):
    tz = ZoneInfo(user.timezone or "Etc/UTC")
    if isinstance(value, str):
        value = datetime.fromisoformat(str(value))
    return value.astimezone(tz=tz).strftime("%-I:%M %p (%H:%M)")


def v2avatar(user):
    if not user.avatar_thumbnail_url:
        return urls.icon_url()
    return user.avatar_thumbnail_url


def v2quote(value):
    """
    Multiline quote
    """
    return "\n> ".join([""] + value.splitlines())


env.filters["v2esc"] = v2esc
env.filters["v2multiline"] = v2multiline
env.filters["v2sf"] = v2sf
env.filters["v2url"] = v2url
env.filters["v2phone"] = v2phone
env.filters["v2date"] = v2date
env.filters["v2time"] = v2time
env.filters["v2avatar"] = v2avatar
env.filters["v2quote"] = v2quote


def email_user(user, template_name, template_args={}, override_recipient=None):
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

    list_unsubscribe_header = None
    if "list_unsubscribe_url" in frontmatter:
        url = frontmatter["list_unsubscribe_url"]
        list_unsubscribe_header = f"<{url}>"

    queue_email(
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=user.email if not override_recipient else override_recipient,
        subject=config["NOTIFICATION_EMAIL_PREFIX"] + frontmatter["subject"],
        plain=plain,
        html=html,
        source_data=config["VERSION"] + f"/{template_name}",
        list_unsubscribe_header=list_unsubscribe_header,
    )


def push_user(user, template_name, template_args={}):
    # Titles/config are from {template_name}.yaml, plaintext from {template_name}.txt, and html from generated_html/{template_name}.html (generated from {template_name}.mjml)
    frontmatter_template = env.get_template(f"{template_name}.yaml")
    rendered_frontmatter = frontmatter_template.render(**template_args)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    assert "push_title" in frontmatter
    assert "push_body" in frontmatter

    push_to_user(
        user.id,
        title=frontmatter["push_title"],
        body=frontmatter["push_body"],
        icon=frontmatter.get("push_icon"),
    )
