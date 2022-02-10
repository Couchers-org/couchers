import { filterDuplicatePlaces, NominatimPlace } from "./nominatim";

test("filterDuplicatePlaces function", () => {
  const places: Partial<NominatimPlace>[] = [
    {
      place_id: 1,
      importance: 0.1,
      address: {
        city: "Toronto",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 2,
      importance: 0.9,
      address: {
        city: "Toronto",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 3,
      importance: 0.1,
      address: {
        city: "Ottawa",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 4,
      importance: 0.1,
      address: {
        city: "Ottawa",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 5,
      importance: 0.2,
      address: {
        city: "Toronto",
        state_district: "",
        state: "Ohio",
        postcode: "",
        country: "United States",
        country_code: "",
      },
    },
  ];
  const expected: Partial<NominatimPlace>[] = [
    {
      place_id: 2,
      importance: 0.9,
      address: {
        city: "Toronto",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 3,
      importance: 0.1,
      address: {
        city: "Ottawa",
        state_district: "",
        state: "Ontario",
        postcode: "",
        country: "Canada",
        country_code: "",
      },
    },
    {
      place_id: 5,
      importance: 0.2,
      address: {
        city: "Toronto",
        state_district: "",
        state: "Ohio",
        postcode: "",
        country: "United States",
        country_code: "",
      },
    },
  ];
  const actual = filterDuplicatePlaces(places as NominatimPlace[]);

  expect(actual).toEqual(expected);
});
