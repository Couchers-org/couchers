import { Coordinates } from "features/search/utils/constants";

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
  const adminRegion = place.address.state || place.address.province || place.address.state_district;

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
