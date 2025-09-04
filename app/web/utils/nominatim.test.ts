import {
  NominatimPlace,
  filterDuplicatePlaces,
  simplifyPlaceDisplayName,
} from "./nominatim";

describe("Nominatim utilities", () => {
  describe("simplifyPlaceDisplayName", () => {
    it("should handle Brisbane, Queensland, Australia correctly", () => {
      const brisbaneQLD: Partial<NominatimPlace> = {
        address: {
          city: "City of Brisbane",
          state: "Queensland",
          country: "Australia",
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "San Mateo County",
          country: "United States",
          postcode: "94005",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "New York County",
          countryCode: "US",
          neighbourhood: "Manhattan",
          suburb: "Midtown",
          road: "5th Avenue",
          houseNumber: "123",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          stateDistrict: "",
          postcode: "",
          countryCode: "",
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
          placeId: 1,
          importance: 0.1,
          address: {
            city: "Toronto",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 2,
          importance: 0.9,
          address: {
            city: "Toronto",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 3,
          importance: 0.1,
          address: {
            city: "Ottawa",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 4,
          importance: 0.1,
          address: {
            city: "Ottawa",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 5,
          importance: 0.2,
          address: {
            city: "Toronto",
            stateDistrict: "",
            state: "Ohio",
            postcode: "",
            country: "United States",
            countryCode: "",
          },
        },
      ];
      const expected: Partial<NominatimPlace>[] = [
        {
          placeId: 2,
          importance: 0.9,
          address: {
            city: "Toronto",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 3,
          importance: 0.1,
          address: {
            city: "Ottawa",
            stateDistrict: "",
            state: "Ontario",
            postcode: "",
            country: "Canada",
            countryCode: "",
          },
        },
        {
          placeId: 5,
          importance: 0.2,
          address: {
            city: "Toronto",
            stateDistrict: "",
            state: "Ohio",
            postcode: "",
            country: "United States",
            countryCode: "",
          },
        },
      ];
      const actual = filterDuplicatePlaces(places as NominatimPlace[]);

      expect(actual).toEqual(expected);
    });

    it("should preserve Brisbane locations in different countries", () => {
      const brisbanes: Partial<NominatimPlace>[] = [
        {
          placeId: 1,
          importance: 0.8,
          address: {
            city: "Brisbane",
            state: "Queensland",
            country: "Australia",
            stateDistrict: "",
            postcode: "",
            countryCode: "",
          },
        },
        {
          placeId: 2,
          importance: 0.3,
          address: {
            city: "Brisbane",
            state: "California",
            country: "United States",
            stateDistrict: "",
            postcode: "",
            countryCode: "",
          },
        },
      ];

      const actual = filterDuplicatePlaces(brisbanes as NominatimPlace[]);

      expect(actual).toHaveLength(2);
      expect(actual.some((p) => p.placeId === 1)).toBe(true); // Brisbane, Australia
      expect(actual.some((p) => p.placeId === 2)).toBe(true); // Brisbane, USA
    });

    it("should handle places with missing primary locality gracefully", () => {
      const regionOnly: Partial<NominatimPlace> = {
        placeId: 1,
        importance: 0.5,
        address: {
          state: "Montana",
          country: "United States",
          stateDistrict: "",
          postcode: "",
          countryCode: "",
        },
      };

      const actual = filterDuplicatePlaces([regionOnly] as NominatimPlace[]);
      expect(actual).toHaveLength(1);
      expect(actual[0].placeId).toBe(1);
    });
  });
});
