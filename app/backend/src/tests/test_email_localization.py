"""
Guardrail tests that every email fully renders in English.

These emails build their localization keys at runtime (sometimes dynamically from internal
state, e.g. a host request status), so a missing or mistyped key only blows up when that
specific email is sent in production. Here we render every email -- and every variant of
emails whose output depends on internal state -- and assert that no localization key is
missing. See `EmailBase.test_instances`.
"""

import inspect
from datetime import UTC

import pytest

import couchers.email.emails
from couchers.email.emails import EmailBase
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
)
from couchers.i18n import LocalizationContext


def _all_email_variants() -> list[tuple[str, EmailBase]]:
    variants: list[tuple[str, EmailBase]] = []
    for _, email_class in inspect.getmembers(
        couchers.email.emails, lambda o: inspect.isclass(o) and o.__base__ == EmailBase
    ):
        instances = email_class.test_instances()
        for i, instance in enumerate(instances):
            variant_id = email_class.__name__ if len(instances) == 1 else f"{email_class.__name__}-{i}"
            variants.append((variant_id, instance))
    return variants


_VARIANTS = _all_email_variants()

_FOOTER = EmailFooter(
    timezone_name="UTC",
    unsubscribe_info=UnsubscribeInfo(
        manage_notifications_url="https://example.com/manage-notifications",
        do_not_email_url="https://example.com/do-not-email",
        topic_action_link=UnsubscribeLink(text="topic-action", url="https://example.com/unsubscribe"),
    ),
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@pytest.mark.parametrize("email", [v for _, v in _VARIANTS], ids=[i for i, _ in _VARIANTS])
def test_email_renders_in_english(email: EmailBase):
    loc_context = LocalizationContext(locale="en", timezone=UTC)

    subject = email.get_subject_line(loc_context)
    assert subject

    preview = email.get_preview_line(loc_context)
    blocks = email.get_body_blocks(loc_context)

    # Render both the html and plaintext bodies end-to-end, since each resolves its own keys.
    render_html_body(subject=subject, preview=preview, blocks=blocks, footer=_FOOTER, loc_context=loc_context)
    render_plaintext_body(blocks=blocks, footer=_FOOTER, loc_context=loc_context)
