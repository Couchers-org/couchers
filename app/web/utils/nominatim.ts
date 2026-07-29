import { Coordinates } from "features/search/utils/constants";
import { LngLat } from "maplibre-gl";
import type { GeocodeResult } from "utils/hooks";

/**
 * Legacy Nominatim (OpenStreetMap) forward-search client.
 *
 * DEPRECATED — kept only as the outage fallback for Geocode.earth during the
 * evaluation period (see `utils/geocode.ts`). Delete this module, its tests, and
 * `NEXT_PUBLIC_NOMINATIM_URL` once the evaluation concludes.
 *
 * Note this hits the *public* OSM instance from the user's own browser, so the
 * 1 req/s usage-policy limit applies per end user. It is only ever driven by an
 * explicit submit (search button / Enter), never as-you-type, because OSM's
 * usage policy forbids client-side autocomplete.
 */

// Locations having one of these keys are considered non-regions.
// https://nominatim.org/release-docs/latest/api/Output/#addressdetails
const nonRegionKeys = [
  "municipality",
  "city",
  "town",
  "village",
  "city_district",
  "district",
  "borough",
  "suburb",
  "subdivision",
];

const NOMINATIM_URL = process.env.NEXT_PUBLIC_NOMINATIM_URL;

// Mirrors `PeliasError`: a typed error the hook can surface and report.
export class NominatimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NominatimError";
  }
}

export interface NominatimPlace {
  address: {
    [city: string]: string;
    state_district: string;
    state: string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: Coordinates;
  category: string;
  display_name: string;
  icon: string;
  importance: number;
  lat: string;
  licence: string;
  lon: string;
  osm_type: string;
  osm_id: string;
  place_id: number;
  place_rank: number;
  type: string;
}

export const simplifyPlaceDisplayName = (place: NominatimPlace) => {
  const addressParts: Array<string> = [];

  // Primary locality (city/town level)
  const primaryLocality =
    place.address.city ||
    place.address.town ||
    place.address.village ||
    place.address.municipality ||
    place.address.hamlet;

  if (primaryLocality) {
    addressParts.push(primaryLocality);
  }

  // Administrative region (state/province level)
  const adminRegion =
    place.address.state ||
    place.address.province ||
    place.address.state_district;

  if (adminRegion) {
    addressParts.push(adminRegion);
  }

  // Country
  if (place.address.country) {
    addressParts.push(place.address.country);
  }

  return addressParts.join(", ");
};

export const filterDuplicatePlaces = (places: NominatimPlace[] = []) => {
  const deduplicatedPlaces = places.reduce(
    (previousRecord, currentPlace) => {
      const importance = currentPlace.importance ?? 0;
      const displayName = simplifyPlaceDisplayName(currentPlace);

      return previousRecord[displayName]?.importance >= importance
        ? previousRecord
        : { ...previousRecord, [displayName]: currentPlace };
    },
    {} as Record<string, NominatimPlace>,
  );

  return Object.values(deduplicatedPlaces);
};

/**
 * Pure mapping: Nominatim place -> our `GeocodeResult`.
 *
 * Nominatim returns `boundingbox` as [minLat, maxLat, minLon, maxLon]; rotate it
 * into the [maxLon, maxLat, minLon, minLat] ordering `GeocodeResult.bbox` uses.
 *
 * `id` is deliberately left unset: it is reserved for the Pelias `gid` used as
 * our stored location identity (LOC-6/LOC-12), and an OSM `place_id` does not
 * belong in that namespace.
 */
export const normalize = (place: NominatimPlace): GeocodeResult => {
  const [minLat, maxLat, minLon, maxLon] = place.boundingbox;

  return {
    location: new LngLat(Number(place.lon), Number(place.lat)),
    name: place.display_name,
    simplifiedName: simplifyPlaceDisplayName(place),
    isRegion: !nonRegionKeys.some((key) => key in place.address),
    // jsonv2 returns these as strings; coerce so consumers get real numbers
    // (Pelias results always do).
    bbox: [maxLon, maxLat, minLon, minLat].map(Number) as Coordinates,
  };
};

export interface SearchOptions {
  // BCP-47 UI locale, passed straight through as Nominatim's `accept-language`.
  language?: string;
  signal?: AbortSignal;
}

/**
 * Forward-search against Nominatim (`GET /search`), returning normalized results
 * plus the raw places.
 *
 * Throws a `NominatimError` on network failure or a non-2xx response.
 */
export async function search(
  value: string,
  options: SearchOptions = {},
): Promise<{ results: GeocodeResult[]; places: NominatimPlace[] }> {
  const { language, signal } = options;

  if (!NOMINATIM_URL) {
    throw new NominatimError("Fallback geocoding is not configured.");
  }

  const url = new URL("search", NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", value);
  url.searchParams.set("addressdetails", "1");
  if (language) {
    url.searchParams.set("accept-language", language);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new NominatimError(
      error instanceof Error ? error.message : "Geocoding request failed.",
    );
  }

  if (!response.ok) {
    throw new NominatimError(await response.text());
  }

  const places: NominatimPlace[] = await response.json();

  return {
    results: filterDuplicatePlaces(places).map(normalize),
    places,
  };
}
