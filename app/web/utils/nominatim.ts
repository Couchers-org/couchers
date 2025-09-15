import { camelCase } from "change-case/keys";
import { LngLat } from "maplibre-gl";
import z from "zod";

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

const CASE_CHANGE_RECURSION_DEPTH = 100;

const nominatimPlaceSchema = z.object(
  /* eslint-disable @typescript-eslint/naming-convention */
  {
    address: z.object(
      ADDRESS_KEYS.reduce(
        (prev, key) => {
          prev[key] = z.string().optional();
          return prev;
        },
        {} as Record<(typeof ADDRESS_KEYS)[number], z.ZodOptional<z.ZodString>>,
      ),
    ),

    bounding_box: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    category: z.string().optional(),
    display_name: z.string(),
    icon: z.string().optional(),
    lat: z.string(),
    lon: z.string(),
    importance: z.number().optional(),
    place_id: z.number().optional(),
    /* eslint-enable @typescript-eslint/naming-convention */
  },
);

type NominatimPlaceInternal = z.infer<typeof nominatimPlaceSchema>;

export type NominatimPlace = RecursiveSnakeToCamelCase<NominatimPlaceInternal>;

const nominatimResponseSchema = z
  .array(nominatimPlaceSchema)
  .transform(
    (input) =>
      camelCase(input, CASE_CHANGE_RECURSION_DEPTH) as NominatimPlace[],
  );

export const nominatimQuery = async (value: string) => {
  const url = `${Config.nominatimUrl}search?format=jsonv2&q=${encodeURIComponent(
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

  const nominatimResults = nominatimResponseSchema.parse(await response.json());

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
