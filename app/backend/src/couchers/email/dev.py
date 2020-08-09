from couchers.config import config
from couchers.crypto import random_hex
from couchers.models import Email

def print_dev_email(sender_name, sender_email, recipient, subject, plain, html):
    message_id = random_hex()

    print("Dev email:")
    print(plain)

    return Email(
        id=message_id,
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
    )
