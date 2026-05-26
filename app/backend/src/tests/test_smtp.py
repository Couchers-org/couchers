from couchers.email.smtp import email_proto_to_message
from couchers.proto.internal.jobs_pb2 import EmailAttachmentV2, SendEmailPayload


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
            EmailAttachmentV2(
                data=bytes([0, 255]),  # Force base64 encoding
                content_type='maintype/subtype; quoted-header="value"; unquoted-header=value',
                content_disposition="attachment",
            )
        ],
    )

    email_message, _ = email_proto_to_message(send_email_payload, couchers_id="42")
    smtp_str = email_message.as_string()

    expected_snippet = """
Content-Type: maintype/subtype; quoted-header="value"; unquoted-header=value
Content-Transfer-Encoding: base64
Content-Disposition: attachment
MIME-Version: 1.0
    """.strip()

    assert expected_snippet in smtp_str
