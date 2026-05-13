import smtplib
from email.headerregistry import Address
from email.message import EmailMessage, MIMEPart
from email.utils import make_msgid
from pathlib import Path
from typing import cast

from couchers.config import config
from couchers.crypto import EMAIL_SOURCE_DATA_KEY_NAME, random_hex, simple_hash_signature
from couchers.models import Email
from couchers.proto.internal import jobs_pb2

template_base = Path(Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2")


def make_cid(sender_email: str) -> tuple[str, str]:
    cid = make_msgid(domain=Address(addr_spec=sender_email).domain)
    without_tag = cid[1:-1]
    return cid, without_tag


def send_smtp_email(payload: jobs_pb2.SendEmailPayload) -> Email:
    """
    Sends out the email through SMTP, settings from config.

    Returns a models.Email object that can be straight away added to the database.
    """
    message_id = random_hex()
    msg = EmailMessage()
    msg["Subject"] = payload.subject
    msg["From"] = Address(payload.sender_name, addr_spec=payload.sender_email)
    msg["To"] = Address(addr_spec=payload.recipient)
    msg["X-Couchers-ID"] = message_id

    if payload.list_unsubscribe_header:
        msg["List-Unsubscribe"] = payload.list_unsubscribe_header

    if payload.source_data:
        msg["X-Couchers-Source-Data"] = payload.source_data
        msg["X-Couchers-Source-Sig"] = simple_hash_signature(payload.source_data, EMAIL_SOURCE_DATA_KEY_NAME)

    msg.set_content(payload.plain)

    updated_html = payload.html
    if updated_html:
        # for any png files in attachment_imgs/, goes through and replaces instances of the filename with attachment
        used_attachments = []
        for attachment_full_path in (template_base / "attachment_imgs").glob("*.png"):
            attachment_html_path = str(attachment_full_path.relative_to(template_base))
            if attachment_html_path not in updated_html:
                continue
            # it's used in this template, so attach and replace it
            data = attachment_full_path.read_bytes()
            cid, wcid = make_cid(payload.sender_email)
            updated_html = updated_html.replace(attachment_html_path, f"cid:{wcid}")
            used_attachments.append((cid, "image", "png", data))

        msg.add_alternative(updated_html, subtype="html")

        for cid, mime_type, mime_subtype, data in used_attachments:
            payloads = cast(list[MIMEPart], msg.get_payload())
            payloads[1].add_related(data, mime_type, mime_subtype, cid=cid)

    if payload.attachments:
        for attachment in payload.attachments:
            mime_maintype, mime_subtype = attachment.mime_type.split("/")
            msg.add_attachment(
                attachment.data, maintype=mime_maintype, subtype=mime_subtype, filename=attachment.filename
            )

    with smtplib.SMTP(config["SMTP_HOST"], config["SMTP_PORT"]) as server:
        server.ehlo()
        if not config["DEV"]:
            server.starttls()
            # stmplib docs recommend calling ehlo() before and after starttls()
            server.ehlo()
            server.login(config["SMTP_USERNAME"], config["SMTP_PASSWORD"])
        server.sendmail(payload.sender_email, payload.recipient, msg.as_string())

    return Email(
        id=message_id,
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=updated_html,
        list_unsubscribe_header=payload.list_unsubscribe_header,
        source_data=payload.source_data,
    )
