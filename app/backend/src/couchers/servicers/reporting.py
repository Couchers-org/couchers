import grpc
import requests

from couchers.config import config
from couchers.db import session_scope
from couchers.models import User, ContentReport
from couchers.sql import couchers_select as select
from proto import reporting_pb2_grpc
from task import send_content_reporting_email


class Reporting(reporting_pb2_grpc.ReportingServicer):
    def ContentReport(self, request, context):
        with session_scope() as session:
            user = session.execute(
                select(User).where(User.id == context.user_id)
            ).scalar_one()
            content_report = ContentReport(
                subject=request.subject,
                content_ref=request.content_ref,
                content_owner_user_id=request.content_owner_user_id,
                description=request.description,
                user_id=context.user_id,
                user_agent=request.user_agent,
                page=request.page
            )

            session.add(ContentReport)

            session.flush()

            send_content_reporting_email(content_report)

            return empty_pb2.Empty()
