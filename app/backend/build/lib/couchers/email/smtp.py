import smtplib
from email.headerregistry import Address
from email.message import EmailMessage
from email.utils import make_msgid
from pathlib import Path

from couchers.config import config
from couchers.crypto import EMAIL_SOURCE_DATA_KEY_NAME, random_hex, simple_hash_signature
from couchers.models import Email

template_base = Path(Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2")


def make_cid(sender_email):
    cid = make_msgid(domain=Address(addr_spec=sender_email).domain)
    without_tag = cid[1:-1]
    return cid, without_tag


def send_smtp_email(sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header, source_data):
    """
    Sends out the email through SMTP, settings from config.

    Returns a models.Email object that can be straight away added to the database.
    """
    message_id = random_hex()
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = Address(sender_name, addr_spec=sender_email)
    msg["To"] = Address(addr_spec=recipient)
    msg["X-Couchers-ID"] = message_id

    if list_unsubscribe_header:
        msg["List-Unsubscribe"] = list_unsubscribe_header

    if source_data:
        msg["X-Couchers-Source-Data"] = source_data
        msg["X-Couchers-Source-Sig"] = simple_hash_signature(source_data, EMAIL_SOURCE_DATA_KEY_NAME)

    msg.set_content(plain)

    if html:
        # for any png files in attachment_imgs/, goes through and replaces instances of the filename with attachment
        used_attachments = []
        for attachment in (template_base / "attachment_imgs").glob("*.png"):
            attachment_html_path = str(attachment.relative_to(template_base))
            if attachment_html_path not in html:
                continue
            # it's used in this template, so attach and replace it
            data = attachment.read_bytes()
            cid, wcid = make_cid(sender_email)
            html = html.replace(attachment_html_path, f"cid:{wcid}")
            used_attachments.append((cid, "image", "png", data))

        msg.add_alternative(html, subtype="html")

        for cid, mime_type, mime_subtype, data in used_attachments:
            msg.get_payload()[1].add_related(data, mime_type, mime_subtype, cid=cid)

    with smtplib.SMTP(config["SMTP_HOST"], config["SMTP_PORT"]) as server:
        server.ehlo()
        if not config["DEV"]:
            server.starttls()
            # stmplib docs recommend calling ehlo() before and after starttls()
            server.ehlo()
            server.login(config["SMTP_USERNAME"], config["SMTP_PASSWORD"])
        server.sendmail(sender_email, recipient, msg.as_string())

    return Email(
        id=message_id,
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )
