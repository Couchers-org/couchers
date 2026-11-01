import type { GeocodeResult } from "utils/hooks";
import * as nominatim from "utils/nominatim";
import type { FocusPoint } from "utils/pelias";
import { autocomplete, PeliasError, toPeliasLanguage } from "utils/pelias";

/**
 * Provider selection for forward geocoding.
 *
 * Geocode.earth (Pelias) is the primary provider. While we evaluate it, the
 * legacy Nominatim path is kept as a fallback so a Geocode.earth outage (5xx,
 * rate limit, exhausted credits, network failure, missing key) degrades search
 * instead of breaking it. The consuming widget switches back to the pre-LOC-1
 * submit UI (search button + hint) when the fallback is in use. Nominatim is
 * never queried as-you-type (OSM usage policy): an outage only flips the
 * session into submit mode, and the next Nominatim request waits for submit.
 *
 * Runtime selection comes from the GrowthBook flag `geocode_provider` (see
 * `useGeocodeQuery`), with `NEXT_PUBLIC_GEOCODE_DEFAULT_PROVIDER` as the
 * last-resort default when GrowthBook has no value.
 *
 * TODO(LOC-eval): delete this module together with `utils/nominatim.ts`,
 * `NEXT_PUBLIC_NOMINATIM_URL` and the widget's fallback branch once the
 * Geocode.earth evaluation concludes.
 *
 * Note: fallback results carry no `id`, since Nominatim cannot produce a Pelias
 * `gid`. A surface that *persists* the gid as our location identity
 * (LOC-6/LOC-12) must therefore fail closed rather than fall back — writing a
 * location with no gid, or an id from another namespace, is not recoverable.
 * Those surfaces pass `allowFallback: false`, which guarantees results only ever
 * come from Pelias, including when a provider has been forced.
 */

export type GeocodeProvider = "pelias" | "nominatim";

// `auto`: Pelias, falling back to Nominatim on an outage.
// `pelias` / `nominatim`: force one provider, no fallback. The forced modes are
// the operational escape hatch for degradation that isn't a clean error —
// Geocode.earth answering 200 with slow or useless results.
export type ProviderSetting = "auto" | GeocodeProvider;

/**
 * Normalize a raw flag/env value to a known provider setting.
 * Unknown or missing values resolve to `nominatim` (safe legacy default).
 */
export function normalizeProviderSetting(raw: unknown): ProviderSetting {
  return raw === "pelias" || raw === "nominatim" || raw === "auto" ? raw : "nominatim";
}

/**
 * Has Geocode.earth already failed over during this page session?
 *
 * Module-scoped rather than per-hook, so client-side navigation (search results
 * and back, opening another widget) does not reset it. Without this, every newly
 * mounted widget would start as a typeahead, spend one as-you-type request
 * discovering the outage again, and flip its UI under the user.
 *
 * Only reused while the setting remains `auto`. Forced `pelias` ignores it so a
 * mid-session GrowthBook flip can recover without a full reload. A full page
 * load also clears it.
 */
let hasFailedOver = false;

/** Test-only: forget the session-scoped failover state. */
export function resetFailoverState() {
  hasFailedOver = false;
}

// Should this search skip Geocode.earth entirely? True when Nominatim is forced,
// or when auto mode already knows Pelias is unavailable.
function shouldSkipPelias(allowFallback: boolean, setting: ProviderSetting): boolean {
  if (!allowFallback) {
    return false;
  }
  return setting === "nominatim" || (setting === "auto" && hasFailedOver);
}

/**
 * The provider a widget should start on. A surface that cannot accept fallback
 * results always starts — and stays — on Pelias, so its UI never switches to the
 * legacy submit mode.
 */
export function initialProvider(allowFallback: boolean, setting: ProviderSetting): GeocodeProvider {
  return shouldSkipPelias(allowFallback, setting) ? "nominatim" : "pelias";
}

/**
 * Does this failure mean "the provider is unavailable" (worth trying the other
 * one) rather than "this request was bad" (which would fail identically)?
 *
 * Outage: no status at all (network failure, timeout, missing configuration),
 * 402/403 (billing / key problem), 408, 429 (rate limited), and any 5xx.
 * Not an outage: other 4xx — a malformed query is our bug, not theirs.
 */
export function isOutageError(error: unknown): boolean {
  if (!(error instanceof PeliasError)) {
    return false;
  }
  const { status } = error;
  if (status === undefined) {
    return true;
  }
  return status >= 500 || [402, 403, 408, 429].includes(status);
}

export interface GeocodeSearchOptions {
  /**
   * May this search be served by the legacy fallback provider? Deliberately
   * required rather than defaulted, so a new call site has to state which kind of
   * surface it is instead of silently inheriting the wrong answer.
   *
   * `false` means Pelias only — no fallback on an outage, and the forced
   * `nominatim` setting is refused too. Use it for anything that persists the
   * resolved location, since fallback results have no Pelias `gid`.
   */
  allowFallback: boolean;
  /**
   * Runtime provider mode from GrowthBook / env default. Required so callers
   * cannot silently re-read configuration from process.env.
   */
  providerSetting: ProviderSetting;
  // BCP-47 UI locale (e.g. "pt-BR"); narrowed per provider.
  language?: string;
  preferCity?: boolean;
  collapseToCity?: boolean; // only affects Pelias
  // LOC-3: soft ranking bias toward the user's approximate location. Pelias only
  // (Nominatim's viewbox is a different, harder mechanism we don't replicate for
  // the deprecated fallback path). Omitted entirely when unknown.
  focus?: FocusPoint;
  signal?: AbortSignal;
  /**
   * Query Nominatim when auto mode has already failed over. Typeahead must leave
   * this false: public Nominatim forbids as-you-type use, so an outage only
   * flips the session into submit mode. Submit-mode widgets pass true.
   */
  useFallbackProvider?: boolean;
}

export interface GeocodeSearchResult {
  results: GeocodeResult[];
  provider: GeocodeProvider;
  // Raw provider payload for `GeolocationSearchInfo` telemetry.
  peliasFeatures?: unknown[];
  nominatimPlaces?: unknown[];
  // The Pelias failure that caused the fallback, when one happened.
  fallbackCause?: PeliasError;
  /**
   * Pelias is down (or already known down) and this request was not allowed to
   * hit Nominatim. The widget should switch to submit mode and wait.
   */
  awaitingSubmit?: boolean;
}

async function viaNominatim(text: string, options: GeocodeSearchOptions): Promise<GeocodeSearchResult> {
  const { results, places } = await nominatim.search(text, {
    language: options.language,
    signal: options.signal,
  });
  return { results, provider: "nominatim", nominatimPlaces: places };
}

function deferNominatim(fallbackCause?: PeliasError): GeocodeSearchResult {
  return { results: [], provider: "nominatim", fallbackCause, awaitingSubmit: true };
}

/**
 * Run a forward search against the active provider, falling back to Nominatim if
 * Geocode.earth is unavailable and the caller allows it.
 *
 * A deliberate cancellation (a newer keystroke aborting `options.signal`) is
 * never treated as an outage and never triggers a fallback request.
 *
 * Discovering an outage never queries Nominatim in the same turn: it records
 * failover and returns `awaitingSubmit` so the widget can switch to submit
 * mode. The next search, with `useFallbackProvider: true`, is the one that
 * may hit Nominatim.
 */
export async function geocodeSearch(text: string, options: GeocodeSearchOptions): Promise<GeocodeSearchResult> {
  const { allowFallback, providerSetting: setting, useFallbackProvider } = options;

  if (shouldSkipPelias(allowFallback, setting)) {
    if (setting === "nominatim" || useFallbackProvider) {
      return viaNominatim(text, options);
    }
    return deferNominatim();
  }

  try {
    const { results, features } = await autocomplete(text, {
      language: options.language ? toPeliasLanguage(options.language) : undefined,
      preferCity: options.preferCity,
      collapseToCity: options.collapseToCity,
      focus: options.focus,
      signal: options.signal,
    });
    return { results, provider: "pelias", peliasFeatures: features };
  } catch (error) {
    // Fail closed: a surface that persists the result would rather show an error
    // than store a location the fallback provider cannot identify.
    if (!allowFallback) {
      throw error;
    }
    if (setting === "pelias" || options.signal?.aborted) {
      throw error;
    }
    if (!isOutageError(error)) {
      throw error;
    }
    hasFailedOver = true;
    if (useFallbackProvider) {
      const result = await viaNominatim(text, options);
      return { ...result, fallbackCause: error as PeliasError };
    }
    return deferNominatim(error as PeliasError);
  }
}
