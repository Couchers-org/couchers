import { Duration } from "google-protobuf/google/protobuf/duration_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import { CheckNativeStatusReq } from "@/proto/bugs_pb";
import client from "@/service/client";

export interface NativeStatusPayload {
  // Identity
  installId: string;
  stickyId?: string;
  idfv?: string;
  androidId?: string;
  deviceName?: string;
  platform: string;
  osVersion: string;
  locale: string;
  userState: string;

  // Build identity
  appVariant: string;
  appVersion: string;
  nativeBuild: string;
  embeddedDisplayVersion: string;
  embeddedDebugVersion: string;
  runningDisplayVersion: string;
  runningDebugVersion: string;
  runningDebugVersionOta: string;
  runtimeVersion: string;
  updateId: string;
  isEmbeddedLaunch: boolean;
  launchSource: string;
  embeddedCreatedAt?: string;
  createdAt?: string;

  // Push + timing
  pushPermission: string;
  pushToken?: string;
  timeSinceLastOpenSeconds?: number;
  occurred: string;

  // Free-form blob for nested data that doesn't fit a flat field (e.g. the full push
  // permission response object).
  debugJson?: string;
}

// "2026-05-01T00:00:00Z" → google.protobuf.Timestamp, or null if the string is unusable.
function isoToTimestamp(iso: string | undefined): Timestamp | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const ts = new Timestamp();
  ts.setSeconds(Math.floor(ms / 1000));
  ts.setNanos((ms % 1000) * 1_000_000);
  return ts;
}

function secondsToDuration(seconds: number | undefined): Duration | null {
  if (seconds === undefined || !Number.isFinite(seconds)) return null;
  const d = new Duration();
  d.setSeconds(Math.floor(seconds));
  d.setNanos(Math.round((seconds - Math.floor(seconds)) * 1_000_000_000));
  return d;
}

// Reports a diagnostics snapshot to the backend and returns its update decision.
export async function checkNativeStatus(payload: NativeStatusPayload) {
  const req = new CheckNativeStatusReq();

  req.setInstallId(payload.installId);
  if (payload.stickyId) req.setStickyId(payload.stickyId);
  if (payload.idfv) req.setIdfv(payload.idfv);
  if (payload.androidId) req.setAndroidId(payload.androidId);
  if (payload.deviceName) req.setDeviceName(payload.deviceName);
  req.setPlatform(payload.platform);
  req.setOsVersion(payload.osVersion);
  req.setLocale(payload.locale);
  req.setUserState(payload.userState);

  req.setAppVariant(payload.appVariant);
  req.setAppVersion(payload.appVersion);
  req.setNativeBuild(payload.nativeBuild);
  req.setEmbeddedDisplayVersion(payload.embeddedDisplayVersion);
  req.setEmbeddedDebugVersion(payload.embeddedDebugVersion);
  req.setRunningDisplayVersion(payload.runningDisplayVersion);
  req.setRunningDebugVersion(payload.runningDebugVersion);
  req.setRunningDebugVersionOta(payload.runningDebugVersionOta);
  req.setRuntimeVersion(payload.runtimeVersion);
  req.setUpdateId(payload.updateId);
  req.setIsEmbeddedLaunch(payload.isEmbeddedLaunch);
  req.setLaunchSource(payload.launchSource);
  const embeddedCreatedAt = isoToTimestamp(payload.embeddedCreatedAt);
  if (embeddedCreatedAt) req.setEmbeddedCreatedAt(embeddedCreatedAt);
  const createdAt = isoToTimestamp(payload.createdAt);
  if (createdAt) req.setCreatedAt(createdAt);

  req.setPushPermission(payload.pushPermission);
  if (payload.pushToken) req.setPushToken(payload.pushToken);
  const timeSinceLastOpen = secondsToDuration(payload.timeSinceLastOpenSeconds);
  if (timeSinceLastOpen) req.setTimeSinceLastOpen(timeSinceLastOpen);
  const occurred = isoToTimestamp(payload.occurred);
  if (occurred) req.setOccurred(occurred);

  if (payload.debugJson) req.setDebugJson(payload.debugJson);

  const res = await client.bugs.checkNativeStatus(req);
  return res.toObject();
}
