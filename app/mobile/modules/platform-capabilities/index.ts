import { requireNativeModule } from "expo-modules-core";

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
