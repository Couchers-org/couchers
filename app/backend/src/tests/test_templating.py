# Tests jinja template rendering

from typing import Any

from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import I18Next
from couchers.templating import Jinja2Template


def _render_en_utc(template: Jinja2Template, args: dict[str, Any]) -> str:
    return template.render(args, LocalizationContext.en_utc(), i18next=I18Next())


def test_html_escaping() -> None:
    template = Jinja2Template(source="Hello {{ name }}!", html=True)
    rendered = _render_en_utc(template, {"name": "<script />"})
    assert rendered == "Hello &lt;script /&gt;!"
