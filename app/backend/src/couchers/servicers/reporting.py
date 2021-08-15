import grpc
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import Report, User
from couchers.sql import couchers_select as select
from couchers.tasks import send_report_email
from proto import reporting_pb2_grpc


class Reporting(reporting_pb2_grpc.ReportingServicer):
    def Report(self, request, context):
        with session_scope() as session:
            # note no filtering on visibility
            author_user = session.execute(select(User).where_username_or_id(request.author_user)).scalar_one_or_none()

            if not author_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            report = Report(
                reporting_user_id=context.user_id,
                reason=request.reason,
                description=request.description,
                content_ref=request.content_ref,
                author_user=author_user,
                user_agent=request.user_agent,
                page=request.page,
            )

            session.add(report)
            session.flush()

            send_report_email(report)

            return empty_pb2.Empty()
