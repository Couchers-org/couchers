import grpc
import requests

from couchers.config import config
from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from proto import reporting_pb2_grpc
from task import send_content_reporting_email


class Reporting(reporting_pb2_grpc.ReportingServicer):
    def _version(self):
        return config["VERSION"]

    def Version(self, request, context):
        return reporting_pb2_grpc.VersionInfo(version=self._version())

    def Report(self, request, context):
        if context.user_id:
            with session_scope() as session:
                username = session.execute(select(User.username).where(User.id == context.user_id)).scalar_one()
                user_details = f"{username} ({context.user_id})"
        else:
            user_details = "<not logged in>"

        send_content_reporting_email()

        return reporting_pb2_grpc.ReportBugRes(
            report_id=f"#{issue_number}", report_url=f"https://github.com/{repo}/issues/{issue_number}"
        )
