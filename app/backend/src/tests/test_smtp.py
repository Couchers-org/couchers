import re

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


def test_embed_html_relative_images_ignores_url_ending_in_src() -> None:
    """
    Our urls end in base64 tokens, whose "=" padding makes them occasionally end in "src=", which must not
    be picked up as an image reference spanning into the next attribute.
    """
    sig = f"{'A' * 40}src="  # a 32 byte blake2b signature, base64 encoded
    link = f"https://example.com/quick-link?payload=Zm9v&sig={sig}"
    html = f"""
        <a href="{link}" style="color: #777;">unsubscribe</a>
        <img src="attachment_imgs/logo-grey.png" style="border:0;"/>
    """

    html, related_parts = embed_html_relative_images(html, base_dir=template_folder, content_id_domain="example.com")

    assert link in html, "Link url was replaced"
    assert len(related_parts) == 1
    assert related_parts[0].content_disposition == 'inline; filename="logo-grey.png"'
