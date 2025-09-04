// import { NominatimPlace } from "./types";
import { Static, TOptional, TString, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { LngLat } from "maplibre-gl";

import sentry from "@/platform/sentry";
import {
  recursiveCamelToSnakeCase,
  recursiveSnakeToCamelCase,
} from "@/utils/string";
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

const nominatimPlaceSchema = Type.Object({
  address: Type.Object(
    ADDRESS_KEYS.reduce(
      (prev, key) => {
        prev[key] = Type.Optional(Type.String());
        return prev;
      },
      {} as Record<(typeof ADDRESS_KEYS)[number], TOptional<TString>>,
    ),
  ),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bounding_box: Type.Tuple([
    Type.Number(),
    Type.Number(),
    Type.Number(),
    Type.Number(),
  ]),
  category: Type.Optional(Type.String()),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  display_name: Type.String(),
  icon: Type.Optional(Type.String()),
  lat: Type.String(),
  lon: Type.String(),
  importance: Type.Optional(Type.Number()),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  place_id: Type.Optional(Type.Number()),
});

type NominatimPlaceInternal = Static<typeof nominatimPlaceSchema>;

// RecursiveCamelToSnakeCase<NominatimPlace>;

export type NominatimPlace = RecursiveSnakeToCamelCase<NominatimPlaceInternal>;

// const nominatimPlaceTransform = Type.Transform(nominatimPlaceSchema)
//   .Decode((val) => recursiveSnakeToCamelCase(val))
//   .Encode((val) => recursiveCamelToSnakeCase(val));

const nominatimResponseSchema = Type.Array(nominatimPlaceSchema);

const nominatimResponseTransform = Type.Transform(nominatimResponseSchema)
  .Decode((val) => val.map(recursiveSnakeToCamelCase))
  .Encode((val) => val.map(recursiveCamelToSnakeCase));

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
  try {
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
  } catch (e) {
    sentry.captureException(e, {
      tags: {
        hook: "useGeocodeQuery",
      },
    });
    // TODO(FB) Error handling
  }
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

      // return previousImportance >= importance
      //   ? previousRecord
      //   : { ...previousRecord, [displayName]: currentPlace };
    },
    new Map(),
  );

  return Array.from(deduplicatedPlaces.values());
};
