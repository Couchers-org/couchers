import {
  useFeatureIsOn,
  useFeatureValue as useGrowthBookFeatureValue,
} from "@growthbook/growthbook-react";

// Flags are evaluated locally by the GrowthBook SDK (see features/experimentation/FeatureFlagProvider).
// Always pass an in-code default; it's returned when the flag isn't configured or not yet loaded.

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function shouldPassAllGates(): boolean {
  return process.env.EXPO_PUBLIC_EXPERIMENTATION_PASS_ALL_GATES === "1";
}

export function useGate(gateName: string): boolean {
  const isOn = useFeatureIsOn(gateName);
  return shouldPassAllGates() || isOn;
}

export function useFeatureValue<T extends JsonValue>(
  featureName: string,
  defaultValue: T,
): T {
  return useGrowthBookFeatureValue<T>(featureName, defaultValue) as T;
}
