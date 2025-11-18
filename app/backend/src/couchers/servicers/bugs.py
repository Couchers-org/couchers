import grpc
import requests
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.descriptor_pool import get_descriptors_pb
from couchers.models import User
from couchers.proto import bugs_pb2, bugs_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.sql import couchers_select as select


class Bugs(bugs_pb2_grpc.BugsServicer):
    def _version(self):
        return config["VERSION"]

    def Version(self, request, context, session):
        return bugs_pb2.VersionInfo(version=self._version())

    def ReportBug(self, request, context, session):
        if not config["BUG_TOOL_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "bug_tool_disabled")

        repo = config["BUG_TOOL_GITHUB_REPO"]
        auth = (config["BUG_TOOL_GITHUB_USERNAME"], config["BUG_TOOL_GITHUB_TOKEN"])

        if context.is_logged_in():
            username = session.execute(select(User.username).where(User.id == context.user_id)).scalar_one()
            user_details = f"[@{username}]({urls.user_link(username=username)}) ({context.user_id})"
        else:
            user_details = "<not logged in>"

        issue_title = request.subject
        issue_body = (
            f"Subject: {request.subject}\n"
            f"Description:\n"
            f"{request.description}\n"
            f"\n"
            f"Results:\n"
            f"{request.results}\n"
            f"\n"
            f"Backend version: {self._version()}\n"
            f"Frontend version: {request.frontend_version}\n"
            f"User Agent: {request.user_agent}\n"
            f"Screen resolution: {request.screen_resolution.width}x{request.screen_resolution.height}\n"
            f"Page: {request.page}\n"
            f"User: {user_details}"
        )
        issue_labels = ["bug tool", "bug: triage needed"]

        json_body = {"title": issue_title, "body": issue_body, "labels": issue_labels}

        r = requests.post(f"https://api.github.com/repos/{repo}/issues", auth=auth, json=json_body)
        if not r.status_code == 201:
            context.abort_with_error_code(grpc.StatusCode.INTERNAL, "bug_tool_request_failed")

        issue_number = r.json()["number"]

        return bugs_pb2.ReportBugRes(
            bug_id=f"#{issue_number}", bug_url=f"https://github.com/{repo}/issues/{issue_number}"
        )

    def Status(self, request, context, session):
        coucher_count = session.execute(select(func.count()).select_from(User).where(User.is_visible)).scalar_one()

        return bugs_pb2.StatusRes(
            nonce=request.nonce,
            version=self._version(),
            coucher_count=coucher_count,
        )

    def GetDescriptors(self, request, context, session):
        return httpbody_pb2.HttpBody(
            content_type="application/octet-stream",
            data=get_descriptors_pb(),
        )

    def GeolocationSearchInfo(self, request, context, session):
        return empty_pb2.Empty()

    def GeolocationClickInfo(self, request, context, session):
        return empty_pb2.Empty()
