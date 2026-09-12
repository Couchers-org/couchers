import re
import smtplib
from email.headerregistry import Address
from email.message import EmailMessage, MIMEPart
from email.utils import make_msgid
from pathlib import Path
from typing import cast

import couchers
from couchers.config import config
from couchers.crypto import EMAIL_SOURCE_DATA_KEY_NAME, random_hex, simple_hash_signature
from couchers.models import Email
from couchers.proto.internal import jobs_pb2

# Base directory for relative EmailPart.data_file_path
email_related_part_data_path_base = Path(couchers.__file__).parents[3]  # /app/backend


def embed_html_relative_images(
    html: str, *, base_dir: Path, content_id_domain: str
) -> tuple[str, list[jobs_pb2.EmailPart]]:
    """Modifies HTML markup's image references such that they can be embedded in multipart/related MIME parts."""
    related_parts: list[jobs_pb2.EmailPart] = []

    def process_relative_src_match(match: re.Match[str]) -> str:
        """Replaces a src="" attribute with a content id reference."""
        image_path = base_dir / str(match.group(1))
        if not image_path.exists():
            raise FileExistsError(f"HTML references missing relative image: {image_path}")

        root_relative_path = image_path.relative_to(email_related_part_data_path_base)
        mime_type = f"image/{image_path.suffix.removeprefix('.')}"
        filename = image_path.name
        bracketed_content_id = make_msgid(domain=content_id_domain)
        content_id = bracketed_content_id[1:-1]
        related_parts.append(
            jobs_pb2.EmailPart(
                data_file_path=str(root_relative_path),
                content_type=f'{mime_type}; name="{filename}"',
                content_disposition=f'inline; filename="{filename}"',
                content_id=bracketed_content_id,
            )
        )

        return f'src="cid:{content_id}"'

    # The lookbehind keeps us inside a tag: without it a url ending in "src=" (base64 tokens are "=" padded,
    # so this happens) matches from within its own href across into the following attribute.
    html = re.sub(r'(?<=\s)src="([^":]+)"', repl=process_relative_src_match, string=html)
    return html, related_parts


def email_proto_to_message(payload: jobs_pb2.SendEmailPayload, couchers_id: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = payload.subject
    msg["From"] = Address(payload.sender_name, addr_spec=payload.sender_email)
    msg["To"] = Address(addr_spec=payload.recipient)
    msg["X-Couchers-ID"] = couchers_id

    if payload.list_unsubscribe_header:
        msg["List-Unsubscribe"] = payload.list_unsubscribe_header

    if payload.source_data:
        msg["X-Couchers-Source-Data"] = payload.source_data
        msg["X-Couchers-Source-Sig"] = simple_hash_signature(payload.source_data, EMAIL_SOURCE_DATA_KEY_NAME)

    msg.set_content(payload.plain)

    if payload.html:
        msg.add_alternative(payload.html, subtype="html")
        html_part = cast(list[MIMEPart], msg.get_payload())[-1]

        if payload.html_related_parts:
            for related_part in payload.html_related_parts:
                _add_email_part(html_part, related_part, related=True)

    if payload.attachments:
        for attachment in payload.attachments:
            _add_email_part(msg, attachment, related=False)

    return msg


def _add_email_part(msg: MIMEPart, part: jobs_pb2.EmailPart, *, related: bool) -> MIMEPart:
    # The data is either part of the payload or must be loaded from a file
    data = part.data
    if not data and part.data_file_path:
        data_path = Path(part.data_file_path)
        if not data_path.is_absolute():
            data_path = email_related_part_data_path_base / data_path
        data = data_path.read_bytes()

    # Create with generic Content-Type/Content-Disposition headers,
    # then overwrite them with the headers specified by the caller.
    if related:
        msg.add_related(data, maintype="application", subtype="octet-stream", disposition="inline")
    else:
        msg.add_attachment(data, maintype="application", subtype="octet-stream", disposition="attachment")

    mime_part = cast(list[MIMEPart], msg.get_payload())[-1]
    _replace_header_verbatim(mime_part, "Content-Type", part.content_type)
    if part.content_disposition:
        _replace_header_verbatim(mime_part, "Content-Disposition", part.content_disposition)
    if part.content_id:
        _replace_header_verbatim(mime_part, "Content-ID", part.content_id)

    return mime_part


def send_smtp_email(payload: jobs_pb2.SendEmailPayload) -> Email:
    """
    Sends out the email through SMTP, settings from config.

    Returns a models.Email object that can be straight away added to the database.
    """
    message_id = random_hex()
    msg = email_proto_to_message(payload, message_id)

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
        server.ehlo()
        if not config.DEV:
            server.starttls()
            # stmplib docs recommend calling ehlo() before and after starttls()
            server.ehlo()
            server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.sendmail(payload.sender_email, payload.recipient, msg.as_string())

    return Email(
        message_id=message_id,
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=payload.html,
        list_unsubscribe_header=payload.list_unsubscribe_header,
        source_data=payload.source_data,
    )


def _replace_header_verbatim(part: MIMEPart, name: str, value: str) -> None:
    # MIMEPart.replace_header will parse the value and reformat it,
    # resulting in additional quoting for an .ics "method=PUBLISH" parameter,
    # which are not as backwards compatible with older email clients.

    if hasattr(part, "_headers"):
        # Replace the header in the internal data structure to avoid reformatting.
        header_index = next((i for i, val in enumerate(part._headers) if val[0] == name), None)
        if isinstance(header_index, int):
            part._headers[header_index] = (name, value)
        else:
            part._headers.append((name, value))
    else:
        # Non-verbatim fallback, in case the internals change
        part.replace_header(name, value)
