// import { NominatimPlace } from "./types";
import { Static, TOptional, TString, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { camelCase, snakeCase } from "change-case/keys";
import { LngLat } from "maplibre-gl";

import { RecursiveSnakeToCamelCase } from "@/utils/types";

const NON_REGION_KEYS = [
  "municipality",
  "city",
  "town",
  "village",
  "city_district",
  "district",
  "borough",
  "suburb",
  "subdivision",
] as const;

const PRIMARY_LOCALITY_KEYS = [
  "city",
  "town",
  "village",
  "municipality",
  "hamlet",
] as const;

const ADMINISTRATIVE_REGION_KEYS = [
  "state",
  "province",
  "state_district",
] as const;

const ADDRESS_KEYS = [
  ...PRIMARY_LOCALITY_KEYS,
  ...ADMINISTRATIVE_REGION_KEYS,
  "postcode",
  "country",
  "country_code",
  "neighbourhood",
  "suburb",
  "road",
  "house_number",
] as const;

const NOMINATIM_URL = process.env.NEXT_PUBLIC_NOMINATIM_URL ?? "";

const CASE_CHANGE_RECURSION_DEPTH = 100;

const nominatimPlaceSchema = Type.Object(
  /* eslint-disable @typescript-eslint/naming-convention */
  {
    address: Type.Object(
      ADDRESS_KEYS.reduce(
        (prev, key) => {
          prev[key] = Type.Optional(Type.String());
          return prev;
        },
        {} as Record<(typeof ADDRESS_KEYS)[number], TOptional<TString>>,
      ),
    ),

    bounding_box: Type.Tuple([
      Type.Number(),
      Type.Number(),
      Type.Number(),
      Type.Number(),
    ]),
    category: Type.Optional(Type.String()),
    display_name: Type.String(),
    icon: Type.Optional(Type.String()),
    lat: Type.String(),
    lon: Type.String(),
    importance: Type.Optional(Type.Number()),
    place_id: Type.Optional(Type.Number()),
    /* eslint-enable @typescript-eslint/naming-convention */
  },
);

type NominatimPlaceInternal = Static<typeof nominatimPlaceSchema>;

export type NominatimPlace = RecursiveSnakeToCamelCase<NominatimPlaceInternal>;

const nominatimResponseSchema = Type.Array(nominatimPlaceSchema);

const nominatimResponseTransform = Type.Transform(nominatimResponseSchema)
  .Decode((val) =>
    val.map(
      (key) => camelCase(key, CASE_CHANGE_RECURSION_DEPTH) as NominatimPlace,
    ),
  )
  .Encode((val) =>
    val.map(
      (key) =>
        snakeCase(key, CASE_CHANGE_RECURSION_DEPTH) as NominatimPlaceInternal,
    ),
  );

export const nominatimQuery = async (value: string) => {
  const url = `${NOMINATIM_URL}search?format=jsonv2&q=${encodeURIComponent(
    value,
  )}&addressdetails=1`;
  const fetchOptions = {
    headers: {
      accept: "application/json",
    },
    method: "GET",
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) throw Error(await response.text());

  const nominatimResults = Value.Decode(
    nominatimResponseTransform,
    Value.Parse(nominatimResponseSchema, await response.json()),
  );

  if (nominatimResults.length === 0) {
    return [];
  }

  const filteredResults = filterDuplicatePlaces(nominatimResults);
  const formattedResults = filteredResults.map((result) => {
    const firstElem = result.boundingBox.shift() as number;
    const lastElem = result.boundingBox.pop() as number;
    result.boundingBox.push(firstElem);
    result.boundingBox.unshift(lastElem);

    return {
      location: new LngLat(Number(result["lon"]), Number(result["lat"])),
      name: result.displayName,
      simplifiedName: simplifyPlaceDisplayName(result),
      isRegion: !NON_REGION_KEYS.some((k) => k in result.address),
      bbox: result.boundingBox,
    };
  });

  return formattedResults;
};

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
    place.address.stateDistrict;

  if (adminRegion) {
    addressParts.push(adminRegion);
  }

  // Country
  if (place.address.country) {
    addressParts.push(place.address.country);
  }

  return addressParts.join(", ");
};

export const filterDuplicatePlaces = (
  places: NominatimPlace[] = [],
): NominatimPlace[] => {
  const deduplicatedPlaces = places.reduce<Map<string, NominatimPlace>>(
    (previousRecord, currentPlace) => {
      const importance = currentPlace.importance ?? 0;
      const displayName = simplifyPlaceDisplayName(currentPlace);
      const previousImportance =
        previousRecord.get(displayName)?.importance ?? 0;

      if (previousImportance < importance) {
        previousRecord.set(displayName, currentPlace);
      }

      return previousRecord;
    },
    new Map(),
  );

  return Array.from(deduplicatedPlaces.values());
};
