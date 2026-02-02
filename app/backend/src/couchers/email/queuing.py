from sqlalchemy.orm.session import Session

from couchers.config import config
from couchers.email.content import EmailContent
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import send_email
from couchers.metrics import emails_counter
from couchers.proto.internal import jobs_pb2


def _queue_email(
    session: Session,
    sender_name: str,
    sender_email: str,
    recipient: str,
    content: EmailContent,
    source_data: str | None,
) -> None:
    """This indirection is to enable mocking."""

    list_unsubscribe_header = None
    if content.list_unsubscribe_url:
        list_unsubscribe_header = f"<{content.list_unsubscribe_url}>"

    payload = jobs_pb2.SendEmailPayload(
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=content.subject,
        plain=content.body_plaintext,
        html=content.body_html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )
    queue_job(
        session,
        job=send_email,
        payload=payload,
        priority=5,
    )

    emails_counter.inc()


def queue_email(
    session: Session,
    recipient: str,
    content: EmailContent,
    sender_name: str = config["NOTIFICATION_EMAIL_SENDER"],
    sender_email: str = config["NOTIFICATION_EMAIL_ADDRESS"],
    source_data: str | None = None,
) -> None:
    _queue_email(
        session=session,
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        content=content,
        source_data=source_data,
    )
