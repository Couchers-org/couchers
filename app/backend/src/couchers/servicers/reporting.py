import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.models import ContentReport, User
from couchers.proto import reporting_pb2, reporting_pb2_grpc
from couchers.sql import username_or_id
from couchers.tasks import send_content_report_email


class Reporting(reporting_pb2_grpc.ReportingServicer):
    def Report(self, request: reporting_pb2.ReportReq, context: CouchersContext, session: Session) -> empty_pb2.Empty:
        # note no filtering on visibility
        author_user = session.execute(select(User).where(username_or_id(request.author_user))).scalar_one_or_none()

        if not author_user:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        content_report = ContentReport(
            reporting_user_id=context.user_id,
            reason=request.reason,
            description=request.description,
            content_ref=request.content_ref,
            author_user_id=author_user.id,
            user_agent=request.user_agent,
            page=request.page,
        )

        session.add(content_report)
        session.flush()

        send_content_report_email(session, content_report)

        return empty_pb2.Empty()
