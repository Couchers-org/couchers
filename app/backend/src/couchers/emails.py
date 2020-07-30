from jinja2 import Environment, FileSystemLoader, Template
from markdown2 import markdown

env = Environment(
    loader=FileSystemLoader("templates"),
    trim_blocks=True,
)

plain_base_template = env.get_template("email_base_plain.md")
html_base_template = env.get_template("email_base_html.html")

def render_email(recipient, subject, template_file, template_args={}):
    # we render both a plain-text and a HTML version, and embed both in the email

    template = env.get_template(template_file)

    def button(text, link):
        return f"""<a style="background-color: red; border-rounding: 3px" href="{link}">{text}</a>""".strip()

    plain_content = template.render(**template_args, plain=True, html=False)
    html_content = markdown(template.render(**template_args, plain=False, html=True, button=button))

    plain = plain_base_template.render(subject=subject, content=plain_content)
    html = html_base_template.render(subject=subject, content=html_content)

    print(plain)
    print(html)
