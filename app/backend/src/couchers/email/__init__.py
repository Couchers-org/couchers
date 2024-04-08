from html import escape
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader

from couchers.config import config
from couchers.jobs.enqueue import queue_job
from proto.internal import jobs_pb2

loader = FileSystemLoader(Path(__file__).parent / ".." / ".." / ".." / "templates")
env = Environment(loader=loader, trim_blocks=True)


def couchers_escape(value):
    return escape(str(value))


def couchers_safe(value):
    return value


env.filters["couchers_escape"] = couchers_escape
env.filters["couchers_safe"] = couchers_safe

plain_base_template = env.get_template("email_base_plain.md")
html_base_template = env.get_template("email_base_html.html")


def render_html(text):
    stripped_paragraphs = text.strip().split("\n\n")
    return "\n\n".join(f"<p>{paragraph.strip()}</p>" for paragraph in stripped_paragraphs)


def _render_email(template_file, template_args={}):
    """
    Renders both a plain-text and a HTML version of an email, and embeds both in their base templates

    The template should look something like this:

    ```
    ---
    subject: "Email for {{ user.name|couchers_escape }}"
    ---

    Hello {{ user.name|couchers_escape }}, this is a sample email
    ```

    The first bit, sandwiched between the first two `---`s is the "frontmatter", some YAML stuff. Currently it just
    contains the subject.

    We split these into the frontmatter and the message text (note the text may contain more `---`s which then denote
    horizontal rules `<hr />` in HTML). The frontmatter is rendered through jinja2 so that you can use the template
    arguments to modify it, e.g. use the user name or something in the subject.

    The body is run through twice, once for the plaintext, once for HTML, and then the HTML version is run through
    render_html above to turn it into HTML.
    """
    source, _, _ = loader.get_source(env, f"{template_file}.md")

    # the file should start with a "---"
    stub, frontmatter_source, text_source = source.split("---", 2)
    assert stub == ""

    frontmatter_template = env.from_string(frontmatter_source)
    template = env.from_string(text_source)

    rendered_frontmatter = frontmatter_template.render(**template_args, plain=True, html=False)
    frontmatter = yaml.load(rendered_frontmatter, Loader=yaml.FullLoader)

    plain_content = template.render({**template_args, "frontmatter": frontmatter}, plain=True, html=False)
    html_content = render_html(template.render({**template_args, "frontmatter": frontmatter}, plain=False, html=True))

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
        job_type="send_email",
        payload=payload,
    )


def enqueue_email_from_template(recipient, template_file, template_args={}):
    frontmatter, plain, html = _render_email(template_file, template_args)
    queue_email(
        config["NOTIFICATION_EMAIL_SENDER"],
        config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient,
        config["NOTIFICATION_EMAIL_PREFIX"] + frontmatter["subject"],
        plain,
        html,
    )
