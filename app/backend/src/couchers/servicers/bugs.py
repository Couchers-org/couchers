import grpc
from couchers.config import config
from pb import bugs_pb2, bugs_pb2_grpc

import requests


class Bugs(bugs_pb2_grpc.BugsServicer):
    def _version(self):
        return config["VERSION"]

    def Version(self, request, context):
        return bugs_pb2.VersionInfo(version=self._version())

    def ReportBug(self, request, context):
        if not config["BUG_TOOL_ENABLED"]:
            context.abort(grpc.StatusCode.UNAVAILABLE, "Bug tool disabled")

        repo = config["BUG_TOOL_GITHUB_REPO"]
        auth = (config["BUG_TOOL_GITHUB_USERNAME"], config["BUG_TOOL_GITHUB_TOKEN"])

        issue_title = request.subject
        issue_body = (
            f"Subject: {request.subject}\n"
            f"Description:\n"
            f"{request.description}\n"
            f"\n"
            f"Steps:\n"
            f"{request.steps}\n"
            f"\n"
            f"Results:\n"
            f"{request.results}\n"
            f"\n"
            f"Backend version: {self._version()}\n"
            f"Frontend version: {request.frontend_version}\n"
            f"User Agent: {request.user_agent}\n"
            f"Page: {request.page}\n"
            f"User ID: {request.user_id}"
        )
        issue_labels = ["bug tool"]

        json_body = {
            "title": issue_title,
            "body": issue_body,
            "labels": issue_labels
        }

        r = requests.post(f"https://api.github.com/repos/{repo}/issues", auth=auth, json=json_body)
        if not r.status_code == 201:
            context.abort(grpc.StatusCode.INTERNAL, "Request failed")

        report_identifier = f'#{r.json()["number"]}'

        return bugs_pb2.ReportBugRes(report_identifier=report_identifier)
