/**
 * Experimentation framework for feature flags and experiments.
 *
 * Uses GrowthBook under the hood, but abstracts the implementation details.
 *
 * Usage:
 *   import { useGate, useFeatureValue } from "experimentation";
 *
 *   // Feature gates (boolean flags)
 *   const isFeatureEnabled = useGate("my_feature_gate");
 *
 *   // Typed feature values (strings, numbers, JSON, experiment variations)
 *   const buttonColor = useFeatureValue("button_color", "blue");
 */

import {
  JSONValue,
  useFeatureIsOn,
  useFeatureValue as useGrowthBookFeatureValue,
  WidenPrimitives,
} from "@growthbook/growthbook-react";

/**
 * Check if experimentation is enabled.
 * Returns false if the SDK key is not configured.
 */
export function isExperimentationEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY;
}

/**
 * Check if all gates should pass (for development/testing).
 * When enabled, useGate() always returns true.
 */
export function shouldPassAllGates(): boolean {
  return process.env.NEXT_PUBLIC_GROWTHBOOK_PASS_ALL_GATES === "1";
}

/**
 * Check if a feature gate is enabled for the current user.
 *
 * Returns true if NEXT_PUBLIC_GROWTHBOOK_PASS_ALL_GATES is set, false if
 * experimentation is disabled. Otherwise looks the gate up in GrowthBook.
 */
export function useGate(gateName: string): boolean {
  const value = useFeatureIsOn(gateName);

  if (shouldPassAllGates()) {
    return true;
  }
  if (!isExperimentationEnabled()) {
    return false;
  }
  return value;
}

/**
 * Get the value of a feature for the current user.
 *
 * Use this for non-boolean features: strings, numbers, JSON configs, experiment
 * variations - anything other than a simple on/off gate. The default's type
 * determines the return type and is returned verbatim when experimentation is
 * disabled.
 */
export function useFeatureValue<T extends JSONValue>(
  featureName: string,
  defaultValue: T,
): WidenPrimitives<T> {
  const value = useGrowthBookFeatureValue<T>(featureName, defaultValue);

  if (!isExperimentationEnabled()) {
    return defaultValue as WidenPrimitives<T>;
  }
  return value;
}
