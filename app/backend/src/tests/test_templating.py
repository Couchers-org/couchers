# Tests jinja template rendering

from markupsafe import Markup

from couchers.templating import Jinja2Template


def test_html_escaping() -> None:
    template = Jinja2Template(source="Hello {{ name }}!", html=True)

    rendered = template.render({"name": "<script />"})
    assert rendered == "Hello &lt;script /&gt;!"

    rendered = template.render({"name": Markup("<script />")})
    assert rendered == "Hello <script />!"
