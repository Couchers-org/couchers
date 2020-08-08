import email.utils
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from couchers.config import config
from couchers.crypto import random_hex

smtp_host = config["SMTP_HOST"]
smtp_port = config["SMTP_PORT"]
smtp_username = config["SMTP_USERNAME"]
smtp_password = config["SMTP_PASSWORD"]

def _send_smtp_email(sender_name, sender_email, recipient, subject, plain, html):
    message_id = random_hex()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = email.utils.formataddr((sender_name, sender_email))
    msg["To"] = recipient
    msg["X-Couchers-ID"] = message_id

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.ehlo()
        server.starttls()
        #stmplib docs recommend calling ehlo() before and after starttls()
        server.ehlo()
        server.login(smtp_username, smtp_password)
        server.sendmail(sender_email, recipient, msg.as_string())

    return message_id
