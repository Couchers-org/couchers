export interface NominatimPlace {
  address: {
    [city: string]: string;
    state_district: string;
    state: string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: Array<string>;
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
  const addressFields = [
    "neighbourhood",
    "suburb",
    "city",
    "country",
    "town",
    "village",
  ];

  const addressParts: Array<string> = [];

  for (const field of addressFields) {
    if (field in place.address) {
      addressParts.push(place.address[field]);
    }
  }
  return addressParts.join(", ");
};
