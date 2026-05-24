import json
import time
from datetime import UTC, datetime
from typing import Any, cast

import grpc
import requests
from google.protobuf import empty_pb2, struct_pb2
from sqlalchemy import insert, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.constants import STABLE_THRESHOLD_SECONDS
from couchers.context import CouchersContext
from couchers.descriptor_pool import get_descriptors_pb
from couchers.models import User
from couchers.models.logging import EventLog, EventSource
from couchers.proto import bugs_pb2, bugs_pb2_grpc
from couchers.proto.google.api import httpbody_pb2

_start_time = time.monotonic()

# --- Hardcoded OTA manifest scaffolding (cut 1: validate protocol + transport) ---
# These point at a real staging bundle staged with ota-stage.mjs and uploaded to
# the CDN. They are filled in after that export; until then the client accepts the
# manifest framing but the bundle download 404s (which still proves the endpoint).
# Per-user selection, signing, and the release registry come later.
_OTA_BASE_URL = "https://couchers-dev-assets.s3.amazonaws.com/ota/prod-test"

# Per-platform hardcoded update. `id` must differ from the build's embedded update
# id or the client no-ops; `runtimeVersion` is echoed from the request so the
# fingerprint always matches during validation.
_OTA_BUNDLES: dict[str, dict[str, Any]] = {
    "ios": {
        "id": "00000000-0000-0000-0000-000000000000",
        "launch_asset": {"key": "PLACEHOLDER", "url": f"{_OTA_BASE_URL}/ios/bundle.hbc"},
        "assets": [],
    },
    "android": {
        "id": "00000000-0000-0000-0000-000000000000",
        "launch_asset": {"key": "PLACEHOLDER", "url": f"{_OTA_BASE_URL}/android/bundle.hbc"},
        "assets": [],
    },
}

# Boundary baked into both the body and the content-type, matching ota-stage.mjs.
_OTA_BOUNDARY = "COUCHERS_OTA_BOUNDARY"


def _ota_multipart_body(field_name: str, content: dict[str, Any]) -> bytes:
    # Protocol-v1 multipart/mixed: the `manifest` (or `directive`) part + an
    # `extensions` part, with the exact CRLF framing the dev client verified
    # on-device (ota-serve.mjs). field_name is "manifest" for an update or
    # "directive" for a noUpdateAvailable/rollBackToEmbedded directive.
    def part(name: str, body: str, content_type: str) -> str:
        return (
            f"--{_OTA_BOUNDARY}\r\n"
            f'content-disposition: form-data; name="{name}"\r\n'
            f"content-type: {content_type}\r\n\r\n"
            f"{body}\r\n"
        )

    body = (
        part(field_name, json.dumps(content), "application/json; charset=utf-8")
        + part("extensions", json.dumps({"assetRequestHeaders": {}}), "application/json")
        + f"--{_OTA_BOUNDARY}--\r\n"
    )
    return body.encode("utf-8")


class Bugs(bugs_pb2_grpc.BugsServicer):
    def _version(self) -> str:
        return cast(str, config["VERSION"])

    def Version(self, request: empty_pb2.Empty, context: CouchersContext, session: Session) -> bugs_pb2.VersionInfo:
        return bugs_pb2.VersionInfo(version=self._version())

    def ReportBug(
        self, request: bugs_pb2.ReportBugReq, context: CouchersContext, session: Session
    ) -> bugs_pb2.ReportBugRes:
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
            f"# {request.subject}\n"
            f"## Description\n"
            f"{request.description}\n"
            f"\n"
            f"## Results\n"
            f"{request.results}\n"
            f"\n"
            f"## Diagnostics\n"
            f"**Backend version**: `{self._version()}`\n"
            f"**Frontend version**: `{request.frontend_version}`\n"
            f"**User Agent**: `{request.user_agent}`\n"
            f"**Locale**: `{context.localization.locale}`\n"
            f"**Screen resolution**: {request.screen_resolution.width}x{request.screen_resolution.height}\n"
            f"**Page**: {request.page}\n"
            f"**User**: {user_details}"
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

    def Status(self, request: bugs_pb2.StatusReq, context: CouchersContext, session: Session) -> bugs_pb2.StatusRes:
        coucher_count = session.execute(select(func.count()).select_from(User).where(User.is_visible)).scalar_one()

        return bugs_pb2.StatusRes(
            nonce=request.nonce,
            version=self._version(),
            coucher_count=coucher_count,
            stable=time.monotonic() - _start_time >= STABLE_THRESHOLD_SECONDS,
        )

    def GetDescriptors(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        return httpbody_pb2.HttpBody(
            content_type="application/octet-stream",
            data=get_descriptors_pb(),
        )

    def GetMobileUpdateManifest(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        def header(name: str) -> str:
            value = context.headers.get(name, "")
            return value.decode() if isinstance(value, bytes) else value

        # The Expo Updates client requires these response headers or it rejects the
        # manifest before fetching. Envoy forwards initial metadata as HTTP response
        # headers (same path as set-cookie).
        context.set_response_headers([("expo-protocol-version", "1"), ("expo-sfv-version", "0")])

        platform = header("expo-platform") or "ios"
        runtime_version = header("expo-runtime-version")

        bundle = _OTA_BUNDLES.get(platform)
        if bundle is None or runtime_version == "":
            # Unknown platform or no fingerprint: tell the client to keep its bundle.
            directive = {"type": "noUpdateAvailable"}
            return httpbody_pb2.HttpBody(
                content_type=f"multipart/mixed; boundary={_OTA_BOUNDARY}",
                data=_ota_multipart_body("directive", directive),
            )

        manifest = {
            "id": bundle["id"],
            "createdAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "runtimeVersion": runtime_version,
            "launchAsset": {
                "key": bundle["launch_asset"]["key"],
                "contentType": "application/javascript",
                "url": bundle["launch_asset"]["url"],
            },
            "assets": bundle["assets"],
            "metadata": {},
            "extra": {"expoClient": {}},
        }

        return httpbody_pb2.HttpBody(
            content_type=f"multipart/mixed; boundary={_OTA_BOUNDARY}",
            data=_ota_multipart_body("manifest", manifest),
        )

    def ReportDiagnostics(
        self, request: bugs_pb2.ReportDiagnosticsReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if len(request.infos) > 100:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "too_many_diagnostic_infos")

        events = []
        for info in request.infos:
            try:
                properties = json.loads(info.properties_json)
            except json.JSONDecodeError, ValueError:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_diagnostics_json")

            occurred = info.occurred.ToDatetime(tzinfo=UTC) if info.HasField("occurred") else datetime.now(UTC)

            events.append(
                {
                    "event_type": info.tag,
                    "user_id": context._user_id,
                    "sofa": context._sofa,
                    "version": request.frontend_version,
                    "properties": properties,
                    "value": info.value,
                    "source": EventSource.frontend,
                    "occurred": occurred,
                }
            )

        if events:
            session.execute(insert(EventLog), events)

        return empty_pb2.Empty()

    def GeolocationSearchInfo(
        self, request: bugs_pb2.GeolocationSearchInfoReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        return empty_pb2.Empty()

    def GeolocationClickInfo(
        self, request: bugs_pb2.GeolocationClickInfoReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        return empty_pb2.Empty()

    def EvaluateFeatureFlag(
        self, request: bugs_pb2.EvaluateFeatureFlagReq, context: CouchersContext, session: Session
    ) -> bugs_pb2.EvaluateFeatureFlagRes:
        # None default: an unconfigured flag comes back as None and the value field is left unset, so
        # the frontend applies its own in-code default. get_object_value is the generic typed
        # accessor; like every value method it fires exposure/usage logging as a side effect, here
        # for exactly the one flag the client is reading.
        value: Any = context.get_object_value(request.flag_key, None)
        res = bugs_pb2.EvaluateFeatureFlagRes()
        if value is not None:
            # google.protobuf.Value has no direct constructor from a Python value; round-trip
            # through a Struct, which knows how to encode bool/number/str/list/dict.
            holder = struct_pb2.Struct()
            holder["value"] = value
            res.value.CopyFrom(holder.fields["value"])
        return res
