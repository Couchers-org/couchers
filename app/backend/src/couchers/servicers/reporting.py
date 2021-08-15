from couchers.db import session_scope
from couchers.models import ContentReport
from couchers.tasks import send_content_report_email
from proto import reporting_pb2_grpc


class Reporting(reporting_pb2_grpc.ReportingServicer):
    def ContentReport(self, request, context):
        with session_scope() as session:
            content_report = ContentReport(
                subject=request.subject,
                content_ref=request.content_ref,
                content_owner_user_id=request.content_owner_user_id,
                description=request.description,
                user_id=context.user_id,
                user_agent=request.user_agent,
                page=request.page,
            )

            session.add(ContentReport)

            session.flush()

            send_content_report_email(content_report)

            return empty_pb2.Empty()
