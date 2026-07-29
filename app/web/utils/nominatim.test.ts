import { rest, server } from "test/restMock";

import {
  filterDuplicatePlaces,
  NominatimError,
  NominatimPlace,
  normalize,
  search,
  simplifyPlaceDisplayName,
} from "./nominatim";

const SEARCH_URL = `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`;

describe("Nominatim utilities", () => {
  describe("simplifyPlaceDisplayName", () => {
    it("should handle Brisbane, Queensland, Australia correctly", () => {
      const brisbaneQLD: Partial<NominatimPlace> = {
        address: {
          city: "City of Brisbane",
          state: "Queensland",
          country: "Australia",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(brisbaneQLD as NominatimPlace);
      expect(result).toBe("City of Brisbane, Queensland, Australia");
    });

    it("should handle Brisbane, California, USA correctly", () => {
      const brisbaneCA: Partial<NominatimPlace> = {
        address: {
          city: "Brisbane",
          state: "California",
          state_district: "San Mateo County",
          country: "United States",
          postcode: "94005",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(brisbaneCA as NominatimPlace);
      expect(result).toBe("Brisbane, California, United States");
    });

    it("should handle places with town instead of city", () => {
      const townPlace: Partial<NominatimPlace> = {
        address: {
          town: "Smalltown",
          state: "Vermont",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(townPlace as NominatimPlace);
      expect(result).toBe("Smalltown, Vermont, United States");
    });

    it("should handle places with village instead of city", () => {
      const villagePlace: Partial<NominatimPlace> = {
        address: {
          village: "Little Village",
          state: "Rural State",
          country: "Somewhere",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(villagePlace as NominatimPlace);
      expect(result).toBe("Little Village, Rural State, Somewhere");
    });

    it("should handle places where city and state are the same", () => {
      const sameNamePlace: Partial<NominatimPlace> = {
        address: {
          city: "Oklahoma City",
          state: "Oklahoma",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(sameNamePlace as NominatimPlace);
      expect(result).toBe("Oklahoma City, Oklahoma, United States");
    });

    it("should handle places with no primary locality", () => {
      const regionOnly: Partial<NominatimPlace> = {
        address: {
          state: "Montana",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(regionOnly as NominatimPlace);
      expect(result).toBe("Montana, United States");
    });

    it("should handle places with missing country", () => {
      const noCountry: Partial<NominatimPlace> = {
        address: {
          city: "Somecity",
          country: "",
          state: "Somestate",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(noCountry as NominatimPlace);
      expect(result).toBe("Somecity, Somestate");
    });

    it("should handle international places with province instead of state", () => {
      const provincePlaces: Partial<NominatimPlace> = {
        address: {
          city: "Toronto",
          province: "Ontario",
          country: "Canada",
          state: "",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(provincePlaces as NominatimPlace);
      expect(result).toBe("Toronto, Ontario, Canada");
    });

    it("should handle city-states or single-word locations", () => {
      const cityState: Partial<NominatimPlace> = {
        address: {
          city: "Singapore",
          country: "Singapore",
          state: "",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(cityState as NominatimPlace);
      expect(result).toBe("Singapore, Singapore");
    });

    it("should only include relevant fields and exclude postcodes, districts, etc.", () => {
      const fullAddress: Partial<NominatimPlace> = {
        address: {
          city: "New York",
          state: "New York",
          country: "United States",
          postcode: "10001",
          state_district: "New York County",
          country_code: "US",
          neighbourhood: "Manhattan",
          suburb: "Midtown",
          road: "5th Avenue",
          house_number: "123",
        },
      };

      const result = simplifyPlaceDisplayName(fullAddress as NominatimPlace);
      // Should only include city, state, country - not postcode, districts, roads, etc.
      expect(result).toBe("New York, New York, United States");
    });

    it("should handle state-level searches (California)", () => {
      const californiaState: Partial<NominatimPlace> = {
        address: {
          state: "California",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(
        californiaState as NominatimPlace,
      );
      expect(result).toBe("California, United States");
    });

    it("should handle country-level searches (Germany)", () => {
      const germany: Partial<NominatimPlace> = {
        address: {
          country: "Germany",
          state: "",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(germany as NominatimPlace);
      expect(result).toBe("Germany");
    });

    it("should handle province-level searches (Ontario, Canada)", () => {
      const ontario: Partial<NominatimPlace> = {
        address: {
          province: "Ontario",
          country: "Canada",
          state: "",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(ontario as NominatimPlace);
      expect(result).toBe("Ontario, Canada");
    });

    it("should handle state searches that share city names (New York state)", () => {
      const newYorkState: Partial<NominatimPlace> = {
        address: {
          state: "New York",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const result = simplifyPlaceDisplayName(newYorkState as NominatimPlace);
      expect(result).toBe("New York, United States");
    });
  });

  describe("filterDuplicatePlaces", () => {
    it("should filter duplicate places and keep highest importance", () => {
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

    it("should preserve Brisbane locations in different countries", () => {
      const brisbanes: Partial<NominatimPlace>[] = [
        {
          place_id: 1,
          importance: 0.8,
          address: {
            city: "Brisbane",
            state: "Queensland",
            country: "Australia",
            state_district: "",
            postcode: "",
            country_code: "",
          },
        },
        {
          place_id: 2,
          importance: 0.3,
          address: {
            city: "Brisbane",
            state: "California",
            country: "United States",
            state_district: "",
            postcode: "",
            country_code: "",
          },
        },
      ];

      const actual = filterDuplicatePlaces(brisbanes as NominatimPlace[]);

      expect(actual).toHaveLength(2);
      expect(actual.some((p) => p.place_id === 1)).toBe(true); // Brisbane, Australia
      expect(actual.some((p) => p.place_id === 2)).toBe(true); // Brisbane, USA
    });

    it("should handle places with missing primary locality gracefully", () => {
      const regionOnly: Partial<NominatimPlace> = {
        place_id: 1,
        importance: 0.5,
        address: {
          state: "Montana",
          country: "United States",
          state_district: "",
          postcode: "",
          country_code: "",
        },
      };

      const actual = filterDuplicatePlaces([regionOnly] as NominatimPlace[]);
      expect(actual).toHaveLength(1);
      expect(actual[0].place_id).toBe(1);
    });
  });

  describe("normalize", () => {
    it("rotates the bounding box into GeocodeResult ordering and coerces numbers", () => {
      const place = {
        display_name: "Berlin, Germany",
        lat: "52.5",
        lon: "13.4",
        // Nominatim order: [minLat, maxLat, minLon, maxLat]
        boundingbox: ["52.3", "52.7", "13.0", "13.8"],
        address: { city: "Berlin", country: "Germany" },
      } as unknown as NominatimPlace;

      const result = normalize(place);

      expect(result.bbox).toEqual([13.8, 52.7, 13.0, 52.3]);
      expect(result.location.lng).toBe(13.4);
      expect(result.location.lat).toBe(52.5);
      expect(result.name).toBe("Berlin, Germany");
      expect(result.simplifiedName).toBe("Berlin, Germany");
      expect(result.isRegion).toBe(false);
    });

    it("never sets an id, since Nominatim cannot supply a Pelias gid", () => {
      const place = {
        display_name: "Berlin, Germany",
        lat: "52.5",
        lon: "13.4",
        boundingbox: ["52.3", "52.7", "13.0", "13.8"],
        address: { city: "Berlin", country: "Germany" },
      } as unknown as NominatimPlace;

      expect(normalize(place).id).toBeUndefined();
    });

    it("marks a place with no locality-level key as a region", () => {
      const place = {
        display_name: "Bavaria, Germany",
        lat: "48.7",
        lon: "11.5",
        boundingbox: ["47.2", "50.6", "8.9", "13.9"],
        address: { state: "Bavaria", country: "Germany" },
      } as unknown as NominatimPlace;

      expect(normalize(place).isRegion).toBe(true);
    });
  });

  describe("search", () => {
    beforeAll(() => {
      server.listen();
    });
    afterEach(() => {
      server.resetHandlers();
    });
    afterAll(() => {
      server.close();
    });

    it("requests the query and locale, and returns deduplicated results", async () => {
      let requestUrl: URL | undefined;
      server.use(
        rest.get(SEARCH_URL, (req, res, ctx) => {
          requestUrl = new URL(req.url.toString());
          return res(
            ctx.json([
              {
                place_id: 1,
                display_name: "Berlin, Berlin, Germany",
                lat: "52.5",
                lon: "13.4",
                boundingbox: ["52.3", "52.7", "13.0", "13.8"],
                importance: 0.9,
                address: {
                  city: "Berlin",
                  state: "Berlin",
                  country: "Germany",
                },
              },
              {
                place_id: 2,
                display_name: "Berlin (city), Berlin, Germany",
                lat: "52.6",
                lon: "13.5",
                boundingbox: ["52.3", "52.7", "13.0", "13.8"],
                importance: 0.4,
                address: {
                  city: "Berlin",
                  state: "Berlin",
                  country: "Germany",
                },
              },
            ]),
          );
        }),
      );

      const { results, places } = await search("berlin", { language: "de-DE" });

      expect(requestUrl?.searchParams.get("q")).toBe("berlin");
      expect(requestUrl?.searchParams.get("accept-language")).toBe("de-DE");
      expect(requestUrl?.searchParams.get("addressdetails")).toBe("1");
      expect(places).toHaveLength(2);
      // Both collapse to the same display name; the more important one wins.
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Berlin, Berlin, Germany");
    });

    it("omits accept-language when no locale is given", async () => {
      let requestUrl: URL | undefined;
      server.use(
        rest.get(SEARCH_URL, (req, res, ctx) => {
          requestUrl = new URL(req.url.toString());
          return res(ctx.json([]));
        }),
      );

      await search("berlin");

      expect(requestUrl?.searchParams.has("accept-language")).toBe(false);
    });

    it("throws a NominatimError on a non-2xx response", async () => {
      server.use(
        rest.get(SEARCH_URL, (_req, res, ctx) => {
          return res(ctx.status(429), ctx.text("rate limited"));
        }),
      );

      await expect(search("berlin")).rejects.toThrow(NominatimError);
      await expect(search("berlin")).rejects.toThrow("rate limited");
    });
  });
});
