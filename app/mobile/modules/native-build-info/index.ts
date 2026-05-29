import { requireNativeModule } from "expo-modules-core";

// The embedded bundle's identity, read from Info.plist / AndroidManifest where
// withNativeBuildInfo.js stamped it at prebuild. Fixed across OTAs — this is how
// the app knows which store binary it's running on even after an OTA applies.
type NativeBuildInfoModule = {
  embeddedDisplayVersion: string;
  embeddedDebugVersion: string;
};

const NativeBuildInfo =
  requireNativeModule<NativeBuildInfoModule>("NativeBuildInfo");

export const embeddedDisplayVersion: string =
  NativeBuildInfo.embeddedDisplayVersion || "unknown";
export const embeddedDebugVersion: string =
  NativeBuildInfo.embeddedDebugVersion || "unknown";
