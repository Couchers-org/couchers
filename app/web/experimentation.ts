/**
 * Experimentation framework for feature flags and experiments.
 *
 * Flags are evaluated server-side (remote evaluation) and exposed through OpenFeature. Always pass
 * an in-code default; it's returned when the flag isn't configured server-side.
 *
 * Usage:
 *   import { useGate, useFeatureValue } from "experimentation";
 *
 *   // Feature gates (boolean flags), default off
 *   const isFeatureEnabled = useGate("my_feature_gate");
 *
 *   // Typed feature values (strings, numbers, JSON, experiment variations)
 *   const buttonColor = useFeatureValue("button_color", "blue");
 */

import { useBooleanFlagValue, useFlag } from "@openfeature/react-sdk";
import { ConstrainedFlagKey, JsonValue } from "@openfeature/web-sdk";

/**
 * Whether all gates should pass (for development/testing). Applied to boolean resolutions by the
 * remote-evaluation provider, mirroring the backend's boolean-only pass-all-gates behavior.
 */
export function shouldPassAllGates(): boolean {
  return process.env.NEXT_PUBLIC_EXPERIMENTATION_PASS_ALL_GATES === "1";
}

/**
 * Whether a feature gate is enabled for the current user. Gates default to off.
 */
export function useGate(gateName: string): boolean {
  return useBooleanFlagValue(gateName, false);
}

/**
 * Get the value of a feature for the current user.
 *
 * Use this for non-boolean features: strings, numbers, JSON configs, experiment variations. The
 * default's type determines the return type and is returned when the flag isn't configured.
 */
export function useFeatureValue<T extends JsonValue>(
  featureName: string,
  defaultValue: T,
): T {
  // useFlag picks the resolver from the default's runtime type. ConstrainedFlagKey<T> resolves to
  // string for every concrete T, but TS can't prove that for an abstract T, hence the cast.
  return useFlag(featureName as ConstrainedFlagKey<T>, defaultValue).value as T;
}
