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
 * submit UI (search button + hint) when the fallback is in use, because
 * Nominatim must not be queried as-you-type.
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

// `auto` (default): Pelias, falling back to Nominatim on an outage.
// `pelias` / `nominatim`: force one provider, no fallback. The forced modes are
// the operational escape hatch for degradation that isn't a clean error —
// Geocode.earth answering 200 with slow or useless results.
type ProviderSetting = "auto" | GeocodeProvider;

function providerSetting(): ProviderSetting {
  const configured = process.env.NEXT_PUBLIC_GEOCODE_PROVIDER;
  return configured === "pelias" || configured === "nominatim" ? configured : "auto";
}

/**
 * Has Geocode.earth already failed over during this page session?
 *
 * Module-scoped rather than per-hook, so client-side navigation (search results
 * and back, opening another widget) does not reset it. Without this, every newly
 * mounted widget would start as a typeahead, spend one as-you-type request
 * discovering the outage again, and flip its UI under the user — which also means
 * querying Nominatim from a keystroke rather than a submit.
 *
 * Cleared by a full page load, which is the intended recovery path.
 */
let hasFailedOver = false;

/** Test-only: forget the session-scoped failover state. */
export function resetFailoverState() {
  hasFailedOver = false;
}

// Should this search skip Geocode.earth entirely and go straight to the legacy
// provider? True when it is forced, or when we already know it is unavailable.
function shouldUseFallbackDirectly(allowFallback: boolean): boolean {
  if (!allowFallback) {
    return false;
  }
  return providerSetting() === "nominatim" || hasFailedOver;
}

/**
 * The provider a widget should start on. A surface that cannot accept fallback
 * results always starts — and stays — on Pelias, so its UI never switches to the
 * legacy submit mode.
 */
export function initialProvider(allowFallback: boolean): GeocodeProvider {
  return shouldUseFallbackDirectly(allowFallback) ? "nominatim" : "pelias";
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
  // BCP-47 UI locale (e.g. "pt-BR"); narrowed per provider.
  language?: string;
  preferCity?: boolean;
  // LOC-3: soft ranking bias toward the user's approximate location. Pelias only
  // (Nominatim's viewbox is a different, harder mechanism we don't replicate for
  // the deprecated fallback path). Omitted entirely when unknown.
  focus?: FocusPoint;
  signal?: AbortSignal;
}

export interface GeocodeSearchResult {
  results: GeocodeResult[];
  provider: GeocodeProvider;
  // Raw provider payload for `GeolocationSearchInfo` telemetry.
  peliasFeatures?: unknown[];
  nominatimPlaces?: unknown[];
  // The Pelias failure that caused the fallback, when one happened.
  fallbackCause?: PeliasError;
}

async function viaNominatim(
  text: string,
  options: GeocodeSearchOptions,
  fallbackCause?: PeliasError,
): Promise<GeocodeSearchResult> {
  if (fallbackCause) {
    hasFailedOver = true;
  }
  const { results, places } = await nominatim.search(text, {
    language: options.language,
    signal: options.signal,
  });
  return { results, provider: "nominatim", nominatimPlaces: places, fallbackCause };
}

/**
 * Run a forward search against the active provider, falling back to Nominatim if
 * Geocode.earth is unavailable and the caller allows it.
 *
 * A deliberate cancellation (a newer keystroke aborting `options.signal`) is
 * never treated as an outage and never triggers a fallback request.
 */
export async function geocodeSearch(text: string, options: GeocodeSearchOptions): Promise<GeocodeSearchResult> {
  const { allowFallback } = options;
  const setting = providerSetting();

  if (shouldUseFallbackDirectly(allowFallback)) {
    return viaNominatim(text, options);
  }

  try {
    const { results, features } = await autocomplete(text, {
      language: options.language ? toPeliasLanguage(options.language) : undefined,
      preferCity: options.preferCity,
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
    return viaNominatim(text, options, error as PeliasError);
  }
}
