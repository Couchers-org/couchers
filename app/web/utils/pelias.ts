import { Coordinates } from "features/search/utils/constants";
import { LngLat } from "maplibre-gl";
import type { GeocodeResult } from "utils/hooks";

/**
 * Geocode.earth (Pelias Cloud) forward-autocomplete client + normalization.
 *
 * This runs entirely client-side: the widget calls
 * the provider directly from the browser with a public, HTTP-referrer-restricted
 * API key (no backend proxy). This module replaces the role of
 * `utils/nominatim.ts` for forward search.
 *
 * `autocomplete` performs the network request; `normalize` is a pure mapping from
 * a Pelias GeoJSON feature to our `GeocodeResult` shape and is unit-testable
 * independently of the fetch.
 */

// A Pelias GeoJSON feature as returned by GET /v1/autocomplete.
export interface PeliasFeatureProperties {
  // Stable global id in the form "{source}:{layer}:{id}",
  // e.g. "whosonfirst:locality:101751119".
  gid: string;
  // Clean place-type field, e.g. "locality", "region", "country", "venue".
  layer: string;
  // Full formatted display name, e.g. "Paris, Île-de-France, France".
  label: string;
  // Primary matched name, e.g. "Paris".
  name: string;
  country?: string;
  // ISO 3166-1 alpha-3, e.g. "FRA".
  // Note: Mapping to alpha-2 is deferred to the storage stories (LOC-6/LOC-12); LOC-1 only needs the display label + bbox.
  country_a?: string;
  macroregion?: string;
  region?: string;
  region_a?: string;
  macrocounty?: string;
  county?: string;
  localadmin?: string;
  localadmin_gid?: string;
  locality?: string;
  locality_gid?: string;
  borough?: string;
  neighbourhood?: string;
  continent?: string;
}

export interface PeliasFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    // [longitude, latitude]
    coordinates: [number, number];
  };
  properties: PeliasFeatureProperties;
  // [minLon, minLat, maxLon, maxLat] — present for areas, absent for point
  // results such as a precise address or venue.
  bbox?: [number, number, number, number];
}

export interface PeliasResponse {
  type: "FeatureCollection";
  features: PeliasFeature[];
}

export interface FocusPoint {
  lat: number;
  lon: number;
}

// A clean, typed error the widget can map to the outage state (LOC-18 seam).
// We do NOT swallow it — the hook surfaces it and reports it to Sentry.
export class PeliasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeliasError";
  }
}

// Pelias `layer` values that represent an administrative area rather than a
// specific, searchable place. These are rejected by the homepage widget when
// `disableRegions` is set (equivalent to the old Nominatim `nonRegionKeys`
// logic, where district/locality-and-below counted as specific).
const REGION_LAYERS = new Set([
  "continent",
  "country",
  "dependency",
  "macroregion",
  "region",
]);

// Layers where `name` is the matched entity and must not be replaced by a
// nested hierarchy locality/localadmin (those can be centroid artifacts — e.g.
// GeoNames macrocounty "Arrondissement de Lorient" carrying localadmin
// "Brandérion"). Venues/addresses/streets intentionally keep the locality
// collapse so destination search shows the surrounding city/area.
const MATCHED_NAME_PRIMARY_LAYERS = new Set([
  "continent",
  "country",
  "dependency",
  "macroregion",
  "region",
  "macrocounty",
  "county",
]);

// Soft `preferCity` ranking: promote the first city-oriented hit when a
// neighbourhood (or similar) / macrocounty is ranked above it. Not a filter —
// every provider hit is kept, only order changes.
const PREFER_CITY_LAYERS = new Set(["locality", "localadmin", "venue"]);
const DEPRIORITIZE_WHEN_PREFER_CITY = new Set([
  "neighbourhood",
  "microhood",
  "macrocounty",
]);

// Half-width (in degrees, ~11km) of the synthetic bbox created for point
// results that Pelias does not return a bbox for (addresses, venues).
const POINT_BBOX_MARGIN = 0.1;

const REQUEST_TIMEOUT_MS = 10_000;

const BASE_URL = process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_GEOCODE_EARTH_KEY;

/**
 * Normalize a BCP-47 UI locale tag (e.g. "en-US", "pt-BR", "zh-Hans-CN") to the
 * bare ISO 639-1 primary-language subtag Pelias's `lang` parameter expects
 * (e.g. "en", "pt", "zh"). Returns `undefined` for an empty or malformed tag,
 * in which case `autocomplete` omits `lang` and Pelias falls back to its
 * default (local-language) naming rather than us guessing.
 */
export function toPeliasLanguage(tag: string): string | undefined {
  const primary = tag?.split(/[-_]/)[0].toLowerCase();
  return primary && /^[a-z]{2,3}$/.test(primary) ? primary : undefined;
}

/**
 * Build the simplified, human-readable display name from a Pelias feature.
 *
 * When `preferCity` is set (destination search), collapse venues/addresses to
 * their containing locality/localadmin — Nominatim-era "city around the hit"
 * behaviour. Coarse admin layers always use matched `name` to avoid centroid
 * hierarchy artifacts (e.g. Brandérion on Arrondissement de Lorient).
 *
 * Without `preferCity` (address / event venue), the primary is always the
 * matched `name` so precise places stay precise.
 */
export function simplifyPeliasDisplayName(
  properties: PeliasFeatureProperties,
  preferCity = false,
): string {
  let primary: string | undefined;
  if (MATCHED_NAME_PRIMARY_LAYERS.has(properties.layer)) {
    primary = properties.name;
  } else if (preferCity) {
    primary =
      properties.locality || properties.localadmin || properties.name;
  } else {
    primary = properties.name;
  }
  const region = properties.region || properties.macroregion;

  const parts = [primary, region, properties.country].filter(
    (part): part is string => Boolean(part),
  );

  // Drop consecutive duplicates (e.g. a region feature whose name equals its
  // region field) while preserving order.
  return parts.filter((part, index) => part !== parts[index - 1]).join(", ");
}

/**
 * Soft reorder for city-oriented search UIs (e.g. homepage "Where are you
 * going?"): if a neighbourhood / microhood / macrocounty appears before the
 * first locality, localadmin, or venue, move that preferred hit to the front.
 * Does not drop any results.
 */
export function reorderPreferCity(features: PeliasFeature[]): PeliasFeature[] {
  const preferredIdx = features.findIndex((feature) =>
    PREFER_CITY_LAYERS.has(feature.properties.layer),
  );
  if (preferredIdx <= 0) {
    return features;
  }

  const hasDeprioritizedBefore = features
    .slice(0, preferredIdx)
    .some((feature) =>
      DEPRIORITIZE_WHEN_PREFER_CITY.has(feature.properties.layer),
    );
  if (!hasDeprioritizedBefore) {
    return features;
  }

  const reordered = [...features];
  const [preferred] = reordered.splice(preferredIdx, 1);
  reordered.unshift(preferred);
  return reordered;
}

/**
 * When simplified display collapses a hit to its containing city/area (venue →
 * locality, etc.), return that parent's gid so we can fetch its bbox. Coarse
 * admin hits and locality/localadmin hits themselves return undefined — their
 * own geometry already matches the display string.
 */
export function displayAreaGid(
  properties: PeliasFeatureProperties,
): string | undefined {
  if (MATCHED_NAME_PRIMARY_LAYERS.has(properties.layer)) {
    return undefined;
  }
  if (
    properties.layer === "locality" ||
    properties.layer === "localadmin"
  ) {
    return undefined;
  }
  // Mirrors simplifyPeliasDisplayName's locality || localadmin || name priority.
  if (properties.locality && properties.locality_gid) {
    return properties.locality_gid;
  }
  if (properties.localadmin && properties.localadmin_gid) {
    return properties.localadmin_gid;
  }
  return undefined;
}

/**
 * Convert a Pelias feature's bbox (or point) into our `GeocodeResult.bbox`
 * ordering. `GeocodeResult.bbox` is [maxLon, maxLat, minLon, minLat] — the exact
 * ordering the previous Nominatim mapping produced — so downstream consumers
 * (HeroSearch's remap, the search-state reducers, service/search.ts) keep
 * working unchanged.
 */
function toGeocodeBbox(feature: PeliasFeature): Coordinates {
  if (feature.bbox) {
    const [minLon, minLat, maxLon, maxLat] = feature.bbox;
    return [maxLon, maxLat, minLon, minLat];
  }

  // No bbox (point result) — synthesise a small box around the coordinate.
  const [lon, lat] = feature.geometry.coordinates;
  return [
    lon + POINT_BBOX_MARGIN,
    lat + POINT_BBOX_MARGIN,
    lon - POINT_BBOX_MARGIN,
    lat - POINT_BBOX_MARGIN,
  ];
}

/**
 * Pure mapping: Pelias GeoJSON feature -> our `GeocodeResult`.
 *
 * When `displayArea` is provided (the parent locality/localadmin whose name we
 * show), bbox and coordinates come from that area — matching Nominatim-era
 * destination search, where the label and search box described the same place.
 */
export function normalize(
  feature: PeliasFeature,
  displayArea?: PeliasFeature,
  preferCity = false,
): GeocodeResult {
  const { properties } = feature;
  const geometrySource = displayArea ?? feature;
  const [lon, lat] = geometrySource.geometry.coordinates;

  return {
    id: properties.gid,
    name: properties.label,
    simplifiedName: simplifyPeliasDisplayName(properties, preferCity),
    location: new LngLat(lon, lat),
    bbox: toGeocodeBbox(geometrySource),
    isRegion: REGION_LAYERS.has(properties.layer),
  };
}

/**
 * Drop later hits that share a `simplifiedName` with an earlier one (e.g. several
 * Wall Street venues all collapsing to "New York, …"). Keeps first occurrence so
 * order from `reorderPreferCity` / the provider is preserved — equivalent to the
 * old Nominatim `filterDuplicatePlaces` rule.
 */
export function dedupeBySimplifiedName(
  results: GeocodeResult[],
): GeocodeResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.simplifiedName)) {
      return false;
    }
    seen.add(result.simplifiedName);
    return true;
  });
}

/**
 * Batch-fetch place geometries by gid (`GET /v1/place?ids=...`). Used to resolve
 * the area bbox for hits whose simplified label is a parent locality. Failures
 * are non-fatal — callers fall back to the original feature geometry.
 */
async function fetchPlacesByIds(
  ids: string[],
  signal?: AbortSignal,
): Promise<Map<string, PeliasFeature>> {
  const places = new Map<string, PeliasFeature>();
  if (!BASE_URL || !API_KEY || ids.length === 0) {
    return places;
  }

  const url = new URL("/v1/place", BASE_URL);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("ids", ids.join(","));

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      return places;
    }
    const data = (await response.json()) as PeliasResponse;
    for (const feature of data.features ?? []) {
      places.set(feature.properties.gid, feature);
    }
  } catch {
    // Abort or network blip — leave the map empty so normalize falls back.
  }
  return places;
}

export interface AutocompleteOptions {
  language?: string;
  focus?: FocusPoint;
  // Soft client-side reorder: promote the first city/venue over a leading
  // neighbourhood or macrocounty. Does not pass `layers` to Pelias.
  // Also: collapse labels to locality, resolve parent area bbox/center, and
  // dedupe by simplified name (Nominatim-era destination behaviour).
  preferCity?: boolean;
  signal?: AbortSignal;
}

/**
 * Issue a forward-autocomplete request directly against Geocode.earth and return
 * the normalized results plus the raw features (the latter for telemetry —
 * always in provider order, before any `preferCity` reorder).
 *
 * Throws a `PeliasError` on network failure, non-2xx response, or timeout.
 */
export async function autocomplete(
  text: string,
  options: AutocompleteOptions = {},
): Promise<{ results: GeocodeResult[]; features: PeliasFeature[] }> {
  const { language, focus, preferCity = false, signal } = options;

  if (!BASE_URL || !API_KEY) {
    throw new PeliasError("Geocoding is not configured.");
  }

  const url = new URL("/v1/autocomplete", BASE_URL);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("text", text);
  if (language) {
    url.searchParams.set("lang", language);
  }
  if (focus) {
    url.searchParams.set("focus.point.lat", String(focus.lat));
    url.searchParams.set("focus.point.lon", String(focus.lon));
  }

  // Combine an internal timeout with any externally-supplied abort signal.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromExternal = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", abortFromExternal);
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PeliasError(await response.text());
    }

    const data = (await response.json()) as PeliasResponse;
    const features = data.features ?? [];
    const ordered = preferCity ? reorderPreferCity(features) : features;

    let displayAreas = new Map<string, PeliasFeature>();
    if (preferCity) {
      const areaIds = [
        ...new Set(
          ordered
            .map((feature) => displayAreaGid(feature.properties))
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      displayAreas = await fetchPlacesByIds(areaIds, controller.signal);
    }

    const results = ordered.map((feature) => {
      const areaGid = preferCity
        ? displayAreaGid(feature.properties)
        : undefined;
      return normalize(
        feature,
        areaGid ? displayAreas.get(areaGid) : undefined,
        preferCity,
      );
    });

    return {
      results: preferCity ? dedupeBySimplifiedName(results) : results,
      features,
    };
  } catch (error) {
    // Surface abort/timeout as a typed error, but let the caller distinguish a
    // deliberate cancellation via `signal.aborted`.
    if (error instanceof PeliasError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PeliasError("The location search was cancelled or timed out.");
    }
    throw new PeliasError(
      error instanceof Error ? error.message : "Geocoding request failed.",
    );
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortFromExternal);
    }
  }
}
