import re

import pytest

from couchers.email.rendering import template_folder
from couchers.email.smtp import email_proto_to_message, embed_html_relative_images
from couchers.proto.internal.jobs_pb2 import EmailPart, SendEmailPayload


def test_verbatim_attachment_headers():
    """
    Test that specified Content-Type/Content-Disposition are preserved verbatim (with original quoting).
    This ensures we can create attachments compatible with older email clients.
    """

    send_email_payload = SendEmailPayload(
        sender_name="alice",
        sender_email="alice@couchers.org",
        recipient="bob@couchers.org",
        subject="greeting",
        plain="hello",
        attachments=[
            EmailPart(
                data=bytes([0, 255]),  # Force base64 encoding
                content_type='maintype/subtype; quoted-header="value"; unquoted-header=value',
                content_disposition="attachment",
            )
        ],
    )

    email_message = email_proto_to_message(send_email_payload, couchers_id="42")
    smtp_str = email_message.as_string()

    expected_snippet = """
Content-Type: maintype/subtype; quoted-header="value"; unquoted-header=value
Content-Transfer-Encoding: base64
Content-Disposition: attachment
MIME-Version: 1.0
    """.strip()

    assert expected_snippet in smtp_str


def test_embed_html_relative_images() -> None:
    html = """
        <img src="attachment_imgs/logo-grey.png"/>
        <img src="https://example.com/foo.png"/>
    """

    html, related_parts = embed_html_relative_images(html, base_dir=template_folder, content_id_domain="example.com")

    content_id_match = re.search(r'src="cid:(.*@example.com)"', html)
    assert content_id_match is not None, "html was not modified to include content id"

    assert "https://example.com/foo.png" in html, "Absolute image URL was replaced"

    assert len(related_parts) == 1
    related_part = related_parts[0]
    assert related_part.content_type == 'image/png; name="logo-grey.png"'
    assert related_part.content_disposition == 'inline; filename="logo-grey.png"'
    assert related_part.content_id == f"<{content_id_match.group(1)}>"


@pytest.mark.parametrize(
    ("html", "is_image_ref"),
    [
        ('<img src="attachment_imgs/logo-grey.png"/>', True),
        ('<img\n    src="attachment_imgs/logo-grey.png"/>', True),
        # A url that merely mentions "src=" never yields the `src="` the pattern looks for
        ('<a href="https://example.com/?src=foo" style="color: #777;">unsubscribe</a>', False),
        # ...but one that *ends* in "src=" does, and then runs on into the next attribute. Our urls end in
        # base64 tokens, whose "=" padding makes them end in "src=" about one time in 65k.
        ('<a href="https://example.com/quick-link?sig=src=" style="color: #777;">unsubscribe</a>', False),
        # The same url with no attribute following it, so there is no later quote to run the match into
        ('<a href="https://example.com/quick-link?sig=src=">unsubscribe</a>', False),
    ],
)
def test_embed_html_relative_images_only_matches_src_attributes(html: str, is_image_ref: bool) -> None:
    """Only a genuine src="" attribute is an image reference, no matter what a url in the markup contains."""
    embedded_html, related_parts = embed_html_relative_images(
        html, base_dir=template_folder, content_id_domain="example.com"
    )

    if is_image_ref:
        assert len(related_parts) == 1
        assert related_parts[0].content_disposition == 'inline; filename="logo-grey.png"'
        assert f'src="cid:{related_parts[0].content_id[1:-1]}"' in embedded_html
    else:
        assert related_parts == []
        assert embedded_html == html, "markup was rewritten"
