// JS-facing view of the native build's capability registry. Wraps the
// platform-capabilities native module with the things it can't know itself —
// today only the fingerprint, read from expo-updates' embedded runtimeVersion.
//
// Why a separate service layer:
//   * `fingerprint` currently comes from expo-updates because runtimeVersion
//     still uses the fingerprint policy (so Updates.runtimeVersion IS the
//     fingerprint of the installed build). When runtimeVersion flips to a static
//     string (e.g. "couchers-1"), expo-updates will stop reporting the
//     fingerprint and we'll stamp it into the native build via a config plugin
//     instead; consumers of this service stay unchanged.
//   * `capabilityPlatformVersion` and `allCapabilities` are hardcoded in the
//     native sources of the module. They only change when someone touches
//     native code, which moves the fingerprint and forces a fresh store build.

import * as Updates from "expo-updates";

import {
  allCapabilities,
  capabilityAvailable,
  capabilityPlatformVersion,
} from "platform-capabilities";

export { allCapabilities, capabilityAvailable, capabilityPlatformVersion };

// The fingerprint of the installed native build. While runtimeVersion uses the
// fingerprint policy this equals Updates.runtimeVersion; after the flip to a
// static runtimeVersion this will read from a native-stamped value.
export const fingerprint: string = Updates.runtimeVersion ?? "unknown";
