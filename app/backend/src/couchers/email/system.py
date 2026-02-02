from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm.session import Session

from couchers.config import config
from couchers.email.content import EmailContent
from couchers.email.queuing import queue_email
from couchers.i18n import LocalizationContext
from couchers.templating import Jinja2Template

_templates_dir = Path(__file__).parent / ".." / ".." / ".." / "templates"


def get_system_email_content(template_name: str, template_args: dict[str, Any]) -> EmailContent:
    source = (_templates_dir / f"system/{template_name}.md").read_text(encoding="utf-8")
    _, frontmatter_source, text_source = source.split("---", 2)

    loc_context = LocalizationContext.en_utc()

    frontmatter_template = Jinja2Template(source=frontmatter_source, html=False)
    frontmatter_str = frontmatter_template.render(template_args, loc_context)
    frontmatter = yaml.load(frontmatter_str, Loader=yaml.FullLoader)

    body_template = Jinja2Template(source=text_source, html=False)
    body_str = body_template.render(template_args, loc_context)

    return EmailContent(
        subject=config["NOTIFICATION_PREFIX"] + frontmatter["subject"],
        body_plaintext=body_str,
    )


def queue_system_email(session: Session, recipient: str, template_name: str, template_args: dict[str, Any]) -> None:
    content = get_system_email_content(template_name, template_args)
    queue_email(session, recipient=recipient, content=content, source_data=template_name)
