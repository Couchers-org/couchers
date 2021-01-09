from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader
from markdown2 import markdown

from couchers import config
from couchers.jobs.enqueue import queue_job
from couchers.models import BackgroundJobType
from pb.internal import jobs_pb2

loader = FileSystemLoader(Path(__file__).parent / ".." / ".." / ".." / "templates")
env = Environment(loader=loader, trim_blocks=True)

plain_base_template = env.get_template("email_base_plain.md")
html_base_template = env.get_template("email_base_html.html")


def _escape_plain(text):
    return text


def _escape_html(text):
    return text.replace("_", "\\_")


def _render_email(template_file, template_args={}):
    """
    Renders both a plain-text and a HTML version of an email, and embeds both in their base templates

    The template should look something like this:

    ```
    ---
    subject: "Email for {{ user.name }}"
    ---

    Hello {{ user.name }}, this is a sample email
    ```

    The first bit, sandwiched between the first two `---`s is the "frontmatter", some YAML stuff. Currently it just
    contains the subject.

    We split these into the frontmatter and the message text (note the text may contain more `---`s which then denote
    horizontal rules `<hr />` in HTML). The frontmatter is rendered through jinja2 so that you can use the template
    arguments to modify it, e.g. use the user name or something in the subject.

    The body is run through twice, once for the plaintext, once for HTML, and then the HTML version is run through
    markdown2 to turn it into HTML.
    """
    source, _, _ = loader.get_source(env, f"{template_file}.md")

    # the file should start with a "---"
    stub, frontmatter_source, text_source = source.split("---", 2)
    assert stub == ""

    frontmatter_template = env.from_string(frontmatter_source)
    template = env.from_string(text_source)

    rendered_frontmatter = frontmatter_template.render(**template_args, plain=True, html=False, escape=_escape_plain)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain_content = template.render(
        {**template_args, "frontmatter": frontmatter}, plain=True, html=False, escape=_escape_plain
    )
    html_content = markdown(
        template.render({**template_args, "frontmatter": frontmatter}, plain=False, html=True, escape=_escape_html)
    )

    plain = plain_base_template.render(frontmatter=frontmatter, content=plain_content)
    html = html_base_template.render(frontmatter=frontmatter, content=html_content)

    return frontmatter, plain, html


def queue_email(sender_name, sender_email, recipient, subject, plain, html):
    payload = jobs_pb2.SendEmailPayload(
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
    )
    queue_job(
        job_type=BackgroundJobType.send_email,
        payload=payload,
    )


def send_email_template(recipient, template_file, template_args={}):
    frontmatter, plain, html = _render_email(template_file, template_args)
    queue_email(
        config.NOTIFICATION_EMAIL_SENDER,
        config.config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient,
        frontmatter["subject"],
        plain,
        html,
    )
