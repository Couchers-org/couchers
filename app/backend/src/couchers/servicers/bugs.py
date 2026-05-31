import json
import logging
import time
from datetime import UTC, datetime
from functools import lru_cache
from typing import Any, cast

import grpc
import requests
from google.protobuf import empty_pb2, struct_pb2
from sqlalchemy import insert, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.constants import STABLE_THRESHOLD_SECONDS
from couchers.context import CouchersContext
from couchers.descriptor_pool import get_descriptors_pb
from couchers.models import User
from couchers.models.logging import EventLog, EventSource, ExperimentExposure, ExposureSource
from couchers.models.ota import OTAPackage, OTAPlatform
from couchers.proto import bugs_pb2, bugs_pb2_grpc
from couchers.proto.google.api import httpbody_pb2

logger = logging.getLogger(__name__)

_start_time = time.monotonic()

_OTA_BOUNDARY = "COUCHERS_OTA_BOUNDARY"


def _ota_multipart_body(field_name: str, content: dict[str, Any]) -> bytes:
    # Expo Updates protocol v1 multipart/mixed framing. field_name is "manifest" for
    # an update or "directive" for a noUpdateAvailable/rollBackToEmbedded directive.
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


def _native_ota_manifest_url(*, cdn_root: str, version: str, platform: str) -> str:
    return f"{cdn_root}/{version}/{platform}/manifest"


@lru_cache(maxsize=64)
def _fetch_signed_manifest(url: str) -> tuple[str, bytes]:
    # The publish job signs each manifest and uploads it under its immutable version, so the
    # bytes never change once published: fetch once, cache forever, and serve them (signature
    # and all) untouched so the on-device signature check sees exactly what was signed.
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.headers["content-type"], response.content


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
            f"**User**: {user_details} / `{(context._sofa or '')[:12]}`"
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

    def GetNativeUpdateManifest(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        if context.get_boolean_value("log_native_ota_requests", False):
            logger.info(
                "OTA GetNativeUpdateManifest: content_type=%r headers=%s body=%r",
                request.content_type,
                dict(context.headers),
                request.data,
            )
        # Expo rejects the manifest without these; Envoy forwards them as HTTP response headers.
        context.set_response_headers([("expo-protocol-version", "1"), ("expo-sfv-version", "0")])

        platform = cast(str, context.headers.get("expo-platform", ""))
        fingerprint = cast(str, context.headers.get("expo-runtime-version", ""))

        # Newest non-banned bundle for the build's fingerprint, by manifest createdAt. The device's
        # selection policy only applies it if it's newer than what it's running, so a stale store build
        # self-heals while a newer one keeps its embedded bundle.
        package = None
        if platform in OTAPlatform.__members__ and fingerprint:
            package = session.execute(
                select(OTAPackage)
                .where(OTAPackage.platform == OTAPlatform[platform])
                .where(OTAPackage.fingerprint == fingerprint)
                .where(OTAPackage.banned.is_(False))
                .order_by(OTAPackage.manifest_created_at.desc(), OTAPackage.id.desc())
                .limit(1)
            ).scalar_one_or_none()

        if package is None:
            return httpbody_pb2.HttpBody(
                content_type=f"multipart/mixed; boundary={_OTA_BOUNDARY}",
                data=_ota_multipart_body("directive", {"type": "noUpdateAvailable"}),
            )

        cdn_root = context.get_string_value("native_ota_cdn_root", "https://cdn.couchers.org/native/ota")
        url = _native_ota_manifest_url(cdn_root=cdn_root, version=package.version, platform=platform)
        content_type, body = _fetch_signed_manifest(url)
        return httpbody_pb2.HttpBody(content_type=content_type, data=body)

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

    def CheckNativeStatus(
        self, request: bugs_pb2.CheckNativeStatusReq, context: CouchersContext, session: Session
    ) -> bugs_pb2.CheckNativeStatusRes:
        # Stub: log the ping for now. TODO: persist it and decide whether to force-update.
        logger.info("CheckNativeStatus: user_id=%s debug=%s", context._user_id, request.debug_json)

        return bugs_pb2.CheckNativeStatusRes(
            update_info=bugs_pb2.NativeUpdateInfo(
                action=bugs_pb2.NATIVE_UPDATE_ACTION_NONE,
                required=False,
            )
        )

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

    def LogExperimentExposure(
        self, request: bugs_pb2.LogExperimentExposureReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        # need a logged-in user to attribute the exposure to
        if context.is_logged_in():
            data = {
                "experiment_name": request.experiment_name,
                "variation_key": request.variation_key,
                "variation_name": request.variation_name,
                "hash_attribute": request.hash_attribute,
                "hash_value": request.hash_value,
                "bucket": request.bucket if request.HasField("bucket") else None,
                "in_experiment": request.in_experiment,
                "hash_used": request.hash_used if request.HasField("hash_used") else None,
                "sticky_bucket_used": (request.sticky_bucket_used if request.HasField("sticky_bucket_used") else None),
                "feature_id": request.feature_id,
            }
            session.execute(
                pg_insert(ExperimentExposure)
                .values(
                    user_id=context.user_id,
                    experiment_key=request.experiment_key,
                    variation_id=request.variation_id,
                    source=ExposureSource.client,
                    data=data,
                )
                .on_conflict_do_nothing(constraint="uq_experiment_exposures_user_exp_var")
            )
        return empty_pb2.Empty()
