// Centralises the two version identities the app reports for debugging:
//
//   * embedded — the bundle baked into the store binary, fixed across OTAs.
//       displayVersion / debugVersion are stamped into Info.plist /
//       AndroidManifest at native build time (plugins/withNativeBuildInfo.js,
//       from CI's DISPLAY_VERSION / DEBUG_VERSION) and read back via the
//       native-build-info module. This is how the app reports which store build
//       it's running on even after an OTA has replaced the running JS.
//
//   * running — the JS bundle currently executing. Replaced when an OTA applies.
//       displayVersion / debugVersion are baked into the bundle's
//       Constants.expoConfig.extra at export time, so each OTA bundle carries
//       its own. debugVersionOTA appends the OTA-specific suffix
//       (-{fingerprint}-{assetId}-{createdAt}) from expo-updates; fingerprint is
//       the runtimeVersion, assetId the update UUID, and createdAt is re-stamped
//       on every publish (tools/), which is what lets us roll forward to an old
//       bundle and still tell two publishes of it apart.
//
// Version shapes:
//   displayVersion:    v1.2.18410                      (matches the website footer)
//   debugVersion:      v1.2.18410.1156180a.20260528Z0533
//   debugVersionOTA:   <debugVersion>-{fingerprint}-{assetId}-{createdAt}

import Constants from "expo-constants";
import * as Updates from "expo-updates";

import {
  embeddedDebugVersion,
  embeddedDisplayVersion,
} from "native-build-info";

const extra = Constants.expoConfig?.extra as
  | { appVariant?: string; displayVersion?: string; debugVersion?: string }
  | undefined;

export const appVariant = extra?.appVariant ?? "unknown";

// --- Embedded (store-binary) bundle identity, fixed across OTAs ---

export { embeddedDisplayVersion, embeddedDebugVersion };

// --- Running (currently-executing) bundle identity ---

export const runningDisplayVersion = extra?.displayVersion ?? "unknown";
export const runningDebugVersion = extra?.debugVersion ?? "unknown";

// Raw expo-updates values describing the running bundle, surfaced for reporting.
export const updateId = Updates.updateId ?? "none";
// Updates.channel is an EAS-Update concept and comes back empty ("") on our
// self-hosted OTA setup — and an empty tag value is rejected by Sentry (<invalid>).
// What actually determines which OTAs a device receives is its embedded build
// identity, so use that as the channel (|| also catches "", unlike ??).
export const updateChannel = Updates.channel || embeddedDebugVersion;
export const runtimeVersion = Updates.runtimeVersion ?? "unknown";
export const isEmbeddedLaunch = Updates.isEmbeddedLaunch;
export const createdAt = Updates.createdAt?.toISOString() ?? "unknown";

export const runningDebugVersionOTA = composeDebugVersionOTA(
  runningDebugVersion,
  runtimeVersion,
  shortenUuid(updateId),
  createdAt,
);

// --- Helpers ---

function shortenUuid(id: string): string {
  if (id === "none" || id === "unknown") return id;
  return id.split("-")[0] ?? id;
}

// "2026-05-27T14:32:10.123Z" -> "20260527Z143210" (always UTC; toISOString is)
function compactTimestamp(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return iso;
  return `${m[1]}${m[2]}${m[3]}Z${m[4]}${m[5]}${m[6]}`;
}

function composeDebugVersionOTA(
  debugVersion: string,
  fingerprint: string,
  assetId: string,
  createdAtIso: string,
): string {
  return `${debugVersion}-${fingerprint}-${assetId}-${compactTimestamp(createdAtIso)}`;
}
