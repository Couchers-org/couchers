import * as Updates from "expo-updates";

import {
  allCapabilities,
  capabilityAvailable,
  capabilityPlatformVersion,
} from "platform-capabilities";

export { allCapabilities, capabilityAvailable, capabilityPlatformVersion };

// While runtimeVersion uses the fingerprint policy this equals
// Updates.runtimeVersion; after the flip to a static runtimeVersion this will
// read from a native-stamped value.
export const fingerprint: string = Updates.runtimeVersion ?? "unknown";
