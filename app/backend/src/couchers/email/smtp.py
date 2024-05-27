import smtplib
from email.headerregistry import Address
from email.message import EmailMessage

from couchers.config import config
from couchers.crypto import EMAIL_SOURCE_DATA_KEY_NAME, random_hex, simple_hash_signature
from couchers.models import Email


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
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(config["SMTP_HOST"], config["SMTP_PORT"]) as server:
        server.ehlo()
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
