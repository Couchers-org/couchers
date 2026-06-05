import json
import logging
import time
import uuid
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
from couchers.metrics import (
    observe_native_banned_bundle_hit,
    observe_native_binary_age,
    observe_native_bundle_age,
    observe_native_client_checkin,
    observe_native_ota_manifest_request,
    observe_native_update_decision,
)
from couchers.models import NativeClientUser, User
from couchers.models.logging import EventLog, EventSource, ExperimentExposure, ExposureSource
from couchers.models.ota import OTAPackage, OTAPlatform
from couchers.native_updates import (
    NativeClientInfo,
    Severity,
    UpdateAction,
    UpdateCause,
    client_info_from_request,
    decide_native_update,
)
from couchers.proto import bugs_pb2, bugs_pb2_grpc
from couchers.proto.google.api import httpbody_pb2

logger = logging.getLogger(__name__)

_start_time = time.monotonic()

updateaction2api = {
    UpdateAction.unspecified: bugs_pb2.NATIVE_UPDATE_ACTION_UNSPECIFIED,
    UpdateAction.none: bugs_pb2.NATIVE_UPDATE_ACTION_NONE,
    UpdateAction.ota: bugs_pb2.NATIVE_UPDATE_ACTION_OTA,
    UpdateAction.store: bugs_pb2.NATIVE_UPDATE_ACTION_STORE,
    UpdateAction.reinstall: bugs_pb2.NATIVE_UPDATE_ACTION_REINSTALL,
}

api2updateaction = {
    bugs_pb2.NATIVE_UPDATE_ACTION_UNSPECIFIED: UpdateAction.unspecified,
    bugs_pb2.NATIVE_UPDATE_ACTION_NONE: UpdateAction.none,
    bugs_pb2.NATIVE_UPDATE_ACTION_OTA: UpdateAction.ota,
    bugs_pb2.NATIVE_UPDATE_ACTION_STORE: UpdateAction.store,
    bugs_pb2.NATIVE_UPDATE_ACTION_REINSTALL: UpdateAction.reinstall,
}

updatecause2api = {
    UpdateCause.unspecified: bugs_pb2.NATIVE_UPDATE_CAUSE_UNSPECIFIED,
    UpdateCause.age: bugs_pb2.NATIVE_UPDATE_CAUSE_AGE,
    UpdateCause.banned: bugs_pb2.NATIVE_UPDATE_CAUSE_BANNED,
}

api2updatecause = {
    bugs_pb2.NATIVE_UPDATE_CAUSE_UNSPECIFIED: UpdateCause.unspecified,
    bugs_pb2.NATIVE_UPDATE_CAUSE_AGE: UpdateCause.age,
    bugs_pb2.NATIVE_UPDATE_CAUSE_BANNED: UpdateCause.banned,
}

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


def _is_update_id_banned(session: Session, info: NativeClientInfo) -> bool:
    if not info.update_id or info.platform not in OTAPlatform.__members__:
        return False
    return (
        session.execute(
            select(OTAPackage.id)
            .where(OTAPackage.platform == OTAPlatform[info.platform])
            .where(OTAPackage.manifest_id == info.update_id)
            .where(OTAPackage.banned_at.is_not(None))
            .limit(1)
        ).scalar_one_or_none()
        is not None
    )


def _newest_non_banned_ota_package(session: Session, platform: str, fingerprint: str) -> OTAPackage | None:
    if platform not in OTAPlatform.__members__ or not fingerprint:
        return None
    return session.execute(
        select(OTAPackage)
        .where(OTAPackage.platform == OTAPlatform[platform])
        .where(OTAPackage.fingerprint == fingerprint)
        .where(OTAPackage.banned_at.is_(None))
        .order_by(OTAPackage.manifest_created_at.desc(), OTAPackage.id.desc())
        .limit(1)
    ).scalar_one_or_none()


def _observe_native_check_metrics(
    request: bugs_pb2.CheckNativeStatusReq,
    info: NativeClientInfo,
    decision: Any,
    now: datetime,
    *,
    banned: bool,
) -> None:
    if info.binary_created_at is not None:
        observe_native_binary_age(info.platform, (now - info.binary_created_at).total_seconds())
    if info.bundle_created_at is not None:
        observe_native_bundle_age(info.platform, info.is_ota_launch, (now - info.bundle_created_at).total_seconds())
    observe_native_update_decision(info.platform, decision.action.name, decision.severity.name)
    observe_native_client_checkin(
        platform=info.platform,
        is_ota_launch=info.is_ota_launch,
        embedded_display_version=request.embedded_display_version,
        embedded_runtime_version=info.runtime_version,
        ota_display_version=request.running_display_version if info.is_ota_launch else "",
        ota_update_id=info.update_id or "",
    )
    if banned:
        observe_native_banned_bundle_hit(info.platform)


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
        platform = context.get_header("expo-platform") or ""
        fingerprint = context.get_header("expo-runtime-version") or ""
        eas_client_id = uuid.UUID(context.get_header("eas-client-id") or "")
        if context.get_boolean_value("log_native_ota_requests", False):
            logger.info(
                "OTA GetNativeUpdateManifest: platform=%s fingerprint=%s eas_client_id=%s "
                "content_type=%r headers=%s body=%r",
                platform,
                fingerprint,
                eas_client_id,
                request.content_type,
                dict(context.headers),
                request.data,
            )
        # Expo rejects the manifest without these; Envoy forwards them as HTTP response headers.
        context.set_response_headers([("expo-protocol-version", "1"), ("expo-sfv-version", "0")])

        # Newest non-banned bundle for the build's fingerprint, by manifest createdAt. The device's
        # selection policy only applies it if it's newer than what it's running, so a stale store build
        # self-heals while a newer one keeps its embedded bundle.
        package = _newest_non_banned_ota_package(session, platform, fingerprint)

        if package is None:
            observe_native_ota_manifest_request(platform, "no_match" if not fingerprint else "no_update")
            return httpbody_pb2.HttpBody(
                content_type=f"multipart/mixed; boundary={_OTA_BOUNDARY}",
                data=_ota_multipart_body("directive", {"type": "noUpdateAvailable"}),
            )

        cdn_root = context.get_string_value("native_ota_cdn_root", "https://cdn.couchers.org/native/ota")
        url = _native_ota_manifest_url(cdn_root=cdn_root, version=package.version, platform=platform)
        content_type, body = _fetch_signed_manifest(url)
        observe_native_ota_manifest_request(platform, "served")
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
        info = client_info_from_request(request)
        logger.info(
            "CheckNativeStatus: user_id=%s install_id=%s eas_client_id=%s platform=%s app_version=%s "
            "running_debug_version_ota=%s update_id=%s launch_source=%s debug_json=%s",
            context._user_id,
            request.install_id,
            info.eas_client_id,
            request.platform,
            request.app_version,
            request.running_debug_version_ota,
            request.update_id,
            request.launch_source,
            request.debug_json,
        )
        now = datetime.now(UTC)
        banned = _is_update_id_banned(session, info)
        decision = decide_native_update(context, info, now, banned=banned)

        # An OTA block with no newer bundle to serve would loop the client on the block screen
        # forever, so refuse to serve it: raise (pages via Sentry) and the client, which ignores
        # these errors, stays unblocked. Store blocks aren't checkable — no record of the latest build.
        if decision.action == UpdateAction.ota and decision.severity == Severity.block:
            newest = _newest_non_banned_ota_package(session, info.platform, info.runtime_version)
            newer_available = newest is not None and (
                info.bundle_created_at is None or newest.manifest_created_at > info.bundle_created_at
            )
            if not newer_available:
                raise Exception(
                    "CheckNativeStatus would force an OTA update with no newer bundle to move to "
                    f"(platform={info.platform!r} fingerprint={info.runtime_version!r} "
                    f"cause={decision.cause.name} update_id={info.update_id!r} "
                    f"running_bundle_created_at={info.bundle_created_at} "
                    f"newest_non_banned_created_at={None if newest is None else newest.manifest_created_at})"
                )

        _observe_native_check_metrics(request, info, decision, now, banned=banned)

        if context.is_logged_in():
            session.add(NativeClientUser(eas_client_id=info.eas_client_id, user_id=context.user_id))

        # message and link_text intentionally left empty for the standard cases — the client
        # hardcodes those. The fields are reserved for special-case overrides; nothing in the
        # current decision logic populates them.
        update_info = bugs_pb2.NativeUpdateInfo(
            action=updateaction2api[decision.action],
            required=decision.severity != Severity.none,
            cause=updatecause2api[decision.cause],
        )
        if decision.act_by is not None:
            update_info.act_by.FromDatetime(decision.act_by)
        return bugs_pb2.CheckNativeStatusRes(update_info=update_info)

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
