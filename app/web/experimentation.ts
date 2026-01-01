/**
 * Experimentation framework for feature flags and experiments.
 *
 * Uses Statsig under the hood, but abstracts the implementation details.
 *
 * Usage:
 *   import { useGate, useExperiment, useDynamicConfig, useLogEvent } from "experimentation";
 *
 *   // Feature gates (boolean flags)
 *   const isFeatureEnabled = useGate("my_feature_gate");
 *
 *   // Experiments (A/B tests with config values)
 *   const experimentValue = useExperiment("my_experiment", "variant", "control");
 *
 *   // Dynamic configs (remote configuration)
 *   const configValue = useDynamicConfig("my_config", "setting", "default");
 *
 *   // Event logging
 *   const logEvent = useLogEvent();
 *   logEvent("button_clicked", { button_name: "signup" });
 */

import {
  useDynamicConfig as useStatsigDynamicConfig,
  useExperiment as useStatsigExperiment,
  useFeatureGate as useStatsigGate,
  useStatsigClient,
} from "@statsig/react-bindings";
import { useCallback } from "react";

/**
 * Check if experimentation is enabled.
 * Returns false if the SDK key is not configured.
 */
export function isExperimentationEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
}

/**
 * Check if all gates should pass (for development/testing).
 * When enabled, useGate() always returns true.
 */
export function shouldPassAllGates(): boolean {
  return process.env.NEXT_PUBLIC_STATSIG_PASS_ALL_GATES === "1";
}

/**
 * Check if a feature gate is enabled for the current user.
 *
 * @param gateName - The name of the feature gate
 * @returns true if the gate is enabled, false otherwise (including when experimentation is disabled).
 *          Returns true if NEXT_PUBLIC_STATSIG_PASS_ALL_GATES is enabled.
 *
 * @example
 * const showNewFeature = useGate("new_feature_gate");
 * if (showNewFeature) {
 *   return <NewFeature />;
 * }
 */
export function useGate(gateName: string): boolean {
  const { value } = useStatsigGate(gateName);

  // Pass all gates for development/testing
  if (shouldPassAllGates()) {
    return true;
  }

  if (!isExperimentationEnabled()) {
    return false;
  }

  return value;
}

/**
 * Get a value from an experiment for the current user.
 *
 * @param experimentName - The name of the experiment
 * @param parameterName - The parameter to retrieve from the experiment config
 * @param defaultValue - Default value if experiment is not found or experimentation is disabled
 * @returns The experiment parameter value or the default
 *
 * @example
 * const buttonColor = useExperiment("button_color_test", "color", "blue");
 * return <Button color={buttonColor}>Click me</Button>;
 */
export function useExperiment<T>(
  experimentName: string,
  parameterName: string,
  defaultValue: T,
): T {
  const { value } = useStatsigExperiment(experimentName);

  if (!isExperimentationEnabled()) {
    return defaultValue;
  }

  const paramValue = value[parameterName];
  if (paramValue === undefined) {
    return defaultValue;
  }

  return paramValue as T;
}

/**
 * Get the full experiment config object for the current user.
 *
 * @param experimentName - The name of the experiment
 * @returns The full experiment config object, or empty object if disabled
 *
 * @example
 * const config = useExperimentConfig("onboarding_flow");
 * const steps = config.steps ?? defaultSteps;
 */
export function useExperimentConfig(
  experimentName: string,
): Record<string, unknown> {
  const { value } = useStatsigExperiment(experimentName);

  if (!isExperimentationEnabled()) {
    return {};
  }

  return value;
}

/**
 * Get a value from a dynamic config for the current user.
 *
 * @param configName - The name of the dynamic config
 * @param parameterName - The parameter to retrieve from the config
 * @param defaultValue - Default value if config is not found or experimentation is disabled
 * @returns The config parameter value or the default
 *
 * @example
 * const maxItems = useDynamicConfig("app_settings", "max_items", 10);
 */
export function useDynamicConfig<T>(
  configName: string,
  parameterName: string,
  defaultValue: T,
): T {
  const { value } = useStatsigDynamicConfig(configName);

  if (!isExperimentationEnabled()) {
    return defaultValue;
  }

  const paramValue = value[parameterName];
  if (paramValue === undefined) {
    return defaultValue;
  }

  return paramValue as T;
}

/**
 * Get the full dynamic config object for the current user.
 *
 * @param configName - The name of the dynamic config
 * @returns The full config object, or empty object if disabled
 *
 * @example
 * const settings = useDynamicConfigValues("feature_settings");
 */
export function useDynamicConfigValues(
  configName: string,
): Record<string, unknown> {
  const { value } = useStatsigDynamicConfig(configName);

  if (!isExperimentationEnabled()) {
    return {};
  }

  return value;
}

/**
 * Get a function to log custom events for analytics.
 *
 * @returns A function to log events, or a no-op if experimentation is disabled
 *
 * @example
 * const logEvent = useLogEvent();
 *
 * const handleClick = () => {
 *   logEvent("button_clicked", "signup_button", { page: "home" });
 *   // ... handle click
 * };
 */
export function useLogEvent(): (
  eventName: string,
  value?: string | number,
  metadata?: Record<string, string>,
) => void {
  const { client } = useStatsigClient();

  return useCallback(
    (
      eventName: string,
      value?: string | number,
      metadata?: Record<string, string>,
    ) => {
      if (!isExperimentationEnabled()) {
        return;
      }
      client.logEvent(eventName, value, metadata);
    },
    [client],
  );
}
