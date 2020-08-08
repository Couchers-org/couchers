import smtplib
import email.utils
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

smtp_host = "email-smtp.us-east-1.amazonaws.com"
smtp_port = 587
smtp_username = "XXX"
smtp_password = "XXX"

def _send_smtp_email(sender_name, sender_email, recipient, subject, plain, html, message_id):
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
