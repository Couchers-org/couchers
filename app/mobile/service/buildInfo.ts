// Centralises the two version identities the app reports for debugging:
//
//   * native — the store-distributed binary, fixed across OTAs. Sources:
//       displayVersion, gitHash, builtAt from Info.plist / AndroidManifest
//         (stamped at native build time by plugins/withNativeBuildInfo.js from
//          CI's DISPLAY_VERSION / NATIVE_GIT_HASH / NATIVE_BUILT_AT env vars,
//          or "dev"/local fallbacks);
//       embeddedUpdateId from expo-updates (UUID of the JS bundle baked into
//         the store binary at native build time).
//
//   * ota — the JS bundle currently running. Replaced when an OTA applies.
//       displayVersion, gitHash from Constants.expoConfig.extra (baked into
//         the JS bundle at bundle time, so OTA bundles carry their own values);
//       updateId, createdAt from expo-updates (set by tools/'s publish lambda
//         at restamp time — see _restamp_manifest_part in tools/lambdas).
//
// Both identities follow the same debug-version shape:
//   {displayVersion}-{gitHash}-{bundleIdShort}-{mintTimestampCompact}

import Constants from "expo-constants";
import * as Updates from "expo-updates";

import {
  nativeBuiltAt,
  nativeDisplayVersion,
  nativeGitHash,
} from "native-build-info";

const extra = Constants.expoConfig?.extra as
  | { gitHash?: string; appVariant?: string; otaDisplayVersion?: string }
  | undefined;

export const appVariant = extra?.appVariant ?? "unknown";

// --- Native (embedded store-binary) identity ---

export { nativeBuiltAt, nativeDisplayVersion, nativeGitHash };

// First 8 chars of the embedded bundle's UUID. Fixed across OTAs.
const embeddedUpdateId =
  (Updates as unknown as { embeddedUpdateId?: string }).embeddedUpdateId ??
  (Updates.isEmbeddedLaunch ? Updates.updateId : null) ??
  "none";
const embeddedUpdateIdShort = shortenUuid(embeddedUpdateId);

export const nativeDebugVersion = composeDebugVersion(
  nativeDisplayVersion,
  nativeGitHash,
  embeddedUpdateIdShort,
  nativeBuiltAt,
);

// --- OTA (currently-running bundle) identity ---

export const otaDisplayVersion = extra?.otaDisplayVersion ?? "unknown";
export const otaGitHash = extra?.gitHash ?? "unknown";

export const updateId = Updates.updateId ?? "none";
export const updateChannel = Updates.channel ?? "none";
export const runtimeVersion = Updates.runtimeVersion ?? "unknown";
export const isEmbeddedLaunch = Updates.isEmbeddedLaunch;
export const otaCreatedAt = Updates.createdAt?.toISOString() ?? "unknown";

export const otaDebugVersion = composeDebugVersion(
  otaDisplayVersion,
  otaGitHash,
  shortenUuid(updateId),
  otaCreatedAt,
);

// --- Helpers ---

function shortenUuid(id: string): string {
  if (id === "none" || id === "unknown") return id;
  return id.split("-")[0] ?? id;
}

// "2026-05-27T14:32:10.123Z" -> "20260527T143210Z"
function compactTimestamp(iso: string): string {
  if (iso === "unknown" || iso === "dev") return iso;
  return iso.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

function composeDebugVersion(
  displayVersion: string,
  gitHash: string,
  bundleIdShort: string,
  mintTimestamp: string,
): string {
  const hash = gitHash && gitHash !== "unknown" ? gitHash : "dev";
  return `${displayVersion}-${hash}-${bundleIdShort}-${compactTimestamp(mintTimestamp)}`;
}
