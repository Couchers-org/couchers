import { requireNativeModule } from "expo-modules-core";

// The capability registry baked into the native build, read at startup via a
// native module constants block. Both values are HARDCODED in the iOS Swift and
// Android Kotlin sources of this module, so they only change when someone
// touches native code — which moves the fingerprint and forces a fresh store
// build, which is exactly when a new capability becomes available.
//
// platformVersion is monotonically increasing — bump it on any native change
// (callers can require ">= N" for coarse compatibility). capabilities is the
// fine-grained registry — JS gates each callsite on a named entry, so old
// builds can receive newer JS bundles via OTA and gracefully skip the missing
// feature instead of crashing.
//
// IMPORTANT: bumping platformVersion or adding a capability name MUST happen in
// the same change that adds the underlying native code. Adding the capability
// name without the native code lies to the JS side; landing native code
// without bumping the registry leaves JS unable to discover the new feature.
type PlatformCapabilitiesModule = {
  capabilityPlatformVersion: number;
  capabilities: string[];
};

const PlatformCapabilities = requireNativeModule<PlatformCapabilitiesModule>(
  "PlatformCapabilities",
);

export const capabilityPlatformVersion: number =
  PlatformCapabilities.capabilityPlatformVersion ?? 0;

export const allCapabilities: readonly string[] = Object.freeze(
  PlatformCapabilities.capabilities ?? [],
);

const capabilitySet: ReadonlySet<string> = new Set(allCapabilities);

export function capabilityAvailable(name: string): boolean {
  return capabilitySet.has(name);
}
