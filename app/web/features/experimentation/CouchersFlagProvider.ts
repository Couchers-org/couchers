import {
  JsonValue,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons,
} from "@openfeature/web-sdk";
import { shouldPassAllGates } from "experimentation";
import { evaluateFlag } from "service/experiments";

/**
 * OpenFeature provider backed by per-flag remote evaluation.
 *
 * Each flag is evaluated server-side on demand, the first time a component reads it: the resolve
 * returns the in-code default and kicks off the evaluation, then re-renders with the real value
 * once it arrives. Because the backend only evaluates flags the client actually reads, exposure
 * logging stays accurate (one exposure per flag the user genuinely encounters), and targeting rules
 * never reach the client.
 */
export class CouchersFlagProvider implements Provider {
  readonly metadata = { name: "couchers-remote-evaluation" } as const;
  readonly runsOn = "client" as const;
  readonly events = new OpenFeatureEventEmitter();

  // A key present in `cache` (even with an undefined value) means "already evaluated this session".
  private cache = new Map<string, unknown>();
  private inflight = new Set<string>();

  async onContextChange(): Promise<void> {
    // The user changed (login/logout): drop everything so flags re-evaluate lazily for the new
    // user as components read them again.
    this.cache.clear();
    this.inflight.clear();
    this.events.emit(ProviderEvents.ConfigurationChanged);
  }

  private fetch(flagKey: string): void {
    if (this.cache.has(flagKey) || this.inflight.has(flagKey)) {
      return;
    }
    this.inflight.add(flagKey);
    evaluateFlag(flagKey)
      .then((value) => {
        this.cache.set(flagKey, value);
        this.inflight.delete(flagKey);
        this.events.emit(ProviderEvents.ConfigurationChanged);
      })
      .catch(() => {
        // Leave it uncached so a later render can retry; don't emit, to avoid a retry storm.
        this.inflight.delete(flagKey);
      });
  }

  private resolve<T>(
    flagKey: string,
    defaultValue: T,
    expectedType: "boolean" | "string" | "number",
  ): ResolutionDetails<T> {
    if (!this.cache.has(flagKey)) {
      this.fetch(flagKey);
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }
    const value = this.cache.get(flagKey);
    if (typeof value !== expectedType) {
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }
    return {
      value: value as T,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
  ): ResolutionDetails<boolean> {
    if (shouldPassAllGates()) {
      return { value: true, reason: StandardResolutionReasons.STATIC };
    }
    return this.resolve(flagKey, defaultValue, "boolean");
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
  ): ResolutionDetails<string> {
    return this.resolve(flagKey, defaultValue, "string");
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
  ): ResolutionDetails<number> {
    return this.resolve(flagKey, defaultValue, "number");
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
  ): ResolutionDetails<T> {
    if (!this.cache.has(flagKey)) {
      this.fetch(flagKey);
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }
    const value = this.cache.get(flagKey);
    if (typeof value !== "object" || value === null) {
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }
    return {
      value: value as T,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
  }
}
