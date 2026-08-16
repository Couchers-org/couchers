import { LngLat } from "maplibre-gl";
import { rest, server } from "test/restMock";

import {
  autocomplete,
  dedupeBySimplifiedName,
  displayAreaGid,
  homonymousRegionKeys,
  normalize,
  PeliasError,
  PeliasFeature,
  reorderPreferCity,
  reverse,
  simplifyPeliasDisplayName,
  toPeliasLanguage,
} from "./pelias";

const AUTOCOMPLETE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`;
const PLACE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/place`;
const REVERSE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/reverse`;

const feature = (
  overrides: {
    geometry?: PeliasFeature["geometry"];
    bbox?: PeliasFeature["bbox"];
    properties?: Partial<PeliasFeature["properties"]>;
  } = {},
): PeliasFeature => ({
  type: "Feature",
  geometry: overrides.geometry ?? {
    type: "Point",
    coordinates: [2.3522, 48.8566],
  },
  bbox: "bbox" in overrides ? overrides.bbox : [2.224, 48.815, 2.47, 48.902],
  properties: {
    gid: "whosonfirst:locality:101751119",
    layer: "locality",
    label: "Paris, Île-de-France, France",
    name: "Paris",
    locality: "Paris",
    region: "Île-de-France",
    country: "France",
    ...overrides.properties,
  },
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("simplifyPeliasDisplayName", () => {
  it("builds locality, region, country", () => {
    expect(simplifyPeliasDisplayName(feature().properties)).toBe("Paris, Île-de-France, France");
  });

  it("falls back to the matched name when there is no locality", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "venue",
            name: "Stonehenge",
            locality: undefined,
            localadmin: undefined,
            region: "England",
            country: "United Kingdom",
          },
        }).properties,
      ),
    ).toBe("Stonehenge, England, United Kingdom");
  });

  it("uses matched name for macrocounty even when hierarchy has a nested locality", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "macrocounty",
            name: "Arrondissement de Lorient",
            locality: "Brandérion",
            localadmin: "Brandérion",
            macrocounty: "Lorient",
            region: "Morbihan",
            country: "France",
          },
        }).properties,
      ),
    ).toBe("Arrondissement de Lorient, Morbihan, France");
  });

  it("collapses venues to their containing locality when preferCity is set", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "venue",
            name: "Wall Street",
            locality: "New York",
            region: "New York",
            country: "United States",
          },
        }).properties,
        true,
      ),
    ).toBe("New York, United States");
  });

  it("names the containing city for a precise hit, not the département", () => {
    // Pelias maps the French département onto `region` and the région onto
    // `macroregion`, so without the locality this read "Rue Foch, Hérault, France".
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "street",
            name: "Rue Foch",
            locality: "Montpellier",
            localadmin: "Montpellier",
            county: "Montpellier",
            region: "Hérault",
            macroregion: "Occitanie",
            country: "France",
          },
        }).properties,
      ),
    ).toBe("Rue Foch, Montpellier, France");
  });

  it("keeps the region for a city hit, which is not inside another city", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "locality",
            name: "Montpellier",
            locality: "Montpellier",
            region: "Hérault",
            macroregion: "Occitanie",
            country: "France",
          },
        }).properties,
      ),
    ).toBe("Montpellier, Hérault, France");
  });

  it("keeps the matched venue name when preferCity is off", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "venue",
            name: "Wall Street",
            locality: "New York",
            region: "New York",
            country: "United States",
          },
        }).properties,
      ),
    ).toBe("Wall Street, New York, United States");
  });

  it("drops duplicate adjacent parts (region feature named after its region)", () => {
    expect(
      simplifyPeliasDisplayName(
        feature({
          properties: {
            layer: "region",
            name: "Île-de-France",
            locality: undefined,
            region: "Île-de-France",
            country: "France",
          },
        }).properties,
      ),
    ).toBe("Île-de-France, France");
  });

  it("uses region_a for a city when a same-named region is in the set", () => {
    const city = feature({
      properties: {
        gid: "whosonfirst:locality:85977539",
        layer: "locality",
        name: "New York",
        locality: "New York",
        region: "New York",
        region_a: "NY",
        country: "United States",
      },
    }).properties;
    const regions = new Set(["New York\0United States"]);

    expect(simplifyPeliasDisplayName(city, false, regions)).toBe("New York, NY, United States");
    // Isolated city hit: no sibling state, leave the collapsed label alone
    // (Paris/Madrid/Murcia).
    expect(simplifyPeliasDisplayName(city)).toBe("New York, United States");
  });

  it("does not abbreviate the region hit itself", () => {
    const state = feature({
      properties: {
        gid: "whosonfirst:region:85688543",
        layer: "region",
        name: "New York",
        locality: undefined,
        region: "New York",
        region_a: "NY",
        country: "United States",
      },
    }).properties;
    const regions = new Set(["New York\0United States"]);

    expect(simplifyPeliasDisplayName(state, false, regions)).toBe("New York, United States");
  });

  it("does not use region_a when the sibling region is a different country", () => {
    const madrid = feature({
      properties: {
        layer: "locality",
        name: "Madrid",
        locality: "Madrid",
        region: "Madrid",
        region_a: "MD",
        country: "Spain",
      },
    }).properties;

    expect(simplifyPeliasDisplayName(madrid, false, new Set(["Madrid\0United States"]))).toBe("Madrid, Spain");
  });

  it("leaves Paris unchanged even when region_a is present", () => {
    const paris = feature({
      properties: {
        layer: "locality",
        name: "Paris",
        locality: "Paris",
        region: "Paris",
        region_a: "VP",
        country: "France",
      },
    }).properties;

    expect(simplifyPeliasDisplayName(paris, false, new Set())).toBe("Paris, France");
  });
});

describe("homonymousRegionKeys", () => {
  it("collects region name+country pairs", () => {
    expect(
      homonymousRegionKeys([
        feature({
          properties: {
            layer: "locality",
            name: "New York",
            country: "United States",
          },
        }),
        feature({
          properties: {
            layer: "region",
            name: "New York",
            country: "United States",
          },
        }),
        feature({
          properties: {
            layer: "region",
            name: "Quebec",
            country: "Canada",
          },
        }),
      ]),
    ).toEqual(new Set(["New York\0United States", "Quebec\0Canada"]));
  });
});

describe("reorderPreferCity", () => {
  it("promotes the first locality over a leading macrocounty", () => {
    const macrocounty = feature({
      properties: {
        gid: "geonames:macrocounty:1",
        layer: "macrocounty",
        name: "Arrondissement de Lorient",
        locality: "Brandérion",
      },
    });
    const locality = feature({
      properties: {
        gid: "whosonfirst:locality:2",
        layer: "locality",
        name: "Lorient",
        locality: "Lorient",
      },
    });

    const reordered = reorderPreferCity([macrocounty, locality]);
    expect(reordered.map((f) => f.properties.gid)).toEqual(["whosonfirst:locality:2", "geonames:macrocounty:1"]);
  });

  it("promotes the first venue over a leading neighbourhood", () => {
    const neighbourhood = feature({
      properties: {
        gid: "whosonfirst:neighbourhood:1",
        layer: "neighbourhood",
        name: "Wall Street",
        locality: "Huntsville",
      },
    });
    const venue = feature({
      properties: {
        gid: "openstreetmap:venue:2",
        layer: "venue",
        name: "Wall Street",
        locality: "New York",
      },
    });

    const reordered = reorderPreferCity([neighbourhood, venue]);
    expect(reordered.map((f) => f.properties.gid)).toEqual(["openstreetmap:venue:2", "whosonfirst:neighbourhood:1"]);
  });

  it("leaves order unchanged when the preferred hit is already first", () => {
    const locality = feature({
      properties: { gid: "a", layer: "locality", name: "Paris" },
    });
    const neighbourhood = feature({
      properties: { gid: "b", layer: "neighbourhood", name: "Le Marais" },
    });

    expect(reorderPreferCity([locality, neighbourhood])).toEqual([locality, neighbourhood]);
  });

  it("leaves order unchanged when nothing preferred follows a neighbourhood", () => {
    const neighbourhood = feature({
      properties: { gid: "a", layer: "neighbourhood", name: "Wall Street" },
    });
    const other = feature({
      properties: { gid: "b", layer: "county", name: "Somewhere" },
    });

    expect(reorderPreferCity([neighbourhood, other])).toEqual([neighbourhood, other]);
  });
});

describe("displayAreaGid", () => {
  it("returns the locality_gid for venues that collapse to a city label", () => {
    expect(
      displayAreaGid(
        feature({
          properties: {
            layer: "venue",
            name: "Wall Street",
            locality: "New York",
            locality_gid: "whosonfirst:locality:85977539",
          },
        }).properties,
      ),
    ).toBe("whosonfirst:locality:85977539");
  });

  it("returns undefined for locality/localadmin and coarse admin hits", () => {
    expect(displayAreaGid(feature().properties)).toBeUndefined();
    expect(
      displayAreaGid(
        feature({
          properties: {
            layer: "macrocounty",
            name: "Arrondissement de Lorient",
            locality_gid: "whosonfirst:locality:1",
          },
        }).properties,
      ),
    ).toBeUndefined();
  });
});

describe("dedupeBySimplifiedName", () => {
  it("keeps the first hit when several collapse to the same city label", () => {
    const first = normalize(
      feature({
        properties: {
          gid: "openstreetmap:venue:1",
          layer: "venue",
          name: "Wall Street",
          locality: "New York",
          region: "New York",
          country: "United States",
        },
      }),
      undefined,
      true,
    );
    const duplicate = normalize(
      feature({
        properties: {
          gid: "openstreetmap:venue:2",
          layer: "venue",
          name: "Wall Street",
          locality: "New York",
          region: "New York",
          country: "United States",
        },
      }),
      undefined,
      true,
    );
    const other = normalize(
      feature({
        properties: {
          gid: "whosonfirst:neighbourhood:3",
          layer: "neighbourhood",
          name: "Wall Street",
          locality: "Huntsville",
          region: "Alabama",
          country: "United States",
        },
      }),
      undefined,
      true,
    );

    expect(dedupeBySimplifiedName([first, duplicate, other])).toEqual([first, other]);
  });
});

describe("toPeliasLanguage", () => {
  it.each([
    ["en", "en"],
    ["fr", "fr"],
    ["en-US", "en"],
    ["pt-BR", "pt"],
    ["zh-Hans-CN", "zh"],
    ["en_US", "en"],
    ["FR", "fr"],
  ])("normalizes %s to %s", (tag, expected) => {
    expect(toPeliasLanguage(tag)).toBe(expected);
  });

  it.each([[""], ["123"], ["e"], ["toolongtag"]])("returns undefined for a malformed tag %s", (tag) => {
    expect(toPeliasLanguage(tag)).toBeUndefined();
  });
});

describe("normalize", () => {
  it("maps a city feature to a GeocodeResult", () => {
    const result = normalize(feature());
    expect(result).toEqual({
      id: "whosonfirst:locality:101751119",
      name: "Paris, Île-de-France, France",
      simplifiedName: "Paris, Île-de-France, France",
      location: new LngLat(2.3522, 48.8566),
      // [maxLon, maxLat, minLon, minLat] — preserves the previous ordering.
      bbox: [2.47, 48.902, 2.224, 48.815],
      isRegion: false,
    });
  });

  it("classifies region/country layers as regions", () => {
    expect(normalize(feature({ properties: { layer: "region" } })).isRegion).toBe(true);
    expect(normalize(feature({ properties: { layer: "country" } })).isRegion).toBe(true);
  });

  it("classifies locality/venue/address layers as non-regions", () => {
    expect(normalize(feature({ properties: { layer: "locality" } })).isRegion).toBe(false);
    expect(normalize(feature({ properties: { layer: "venue" } })).isRegion).toBe(false);
    expect(normalize(feature({ properties: { layer: "address" } })).isRegion).toBe(false);
  });

  it("synthesizes a bbox for point results (precise address / venue) with no bbox", () => {
    const result = normalize(
      feature({
        geometry: { type: "Point", coordinates: [-0.1276, 51.5074] },
        bbox: undefined,
        properties: { layer: "address", name: "10 Downing Street" },
      }),
    );
    // [maxLon, maxLat, minLon, minLat] around the point (±0.1).
    expect(result.bbox[0]).toBeCloseTo(-0.0276);
    expect(result.bbox[1]).toBeCloseTo(51.6074);
    expect(result.bbox[2]).toBeCloseTo(-0.2276);
    expect(result.bbox[3]).toBeCloseTo(51.4074);
  });

  it("handles a sparse-hierarchy point (e.g. GPS in the desert)", () => {
    const result = normalize(
      feature({
        geometry: { type: "Point", coordinates: [2.5, 23.4] },
        bbox: undefined,
        properties: {
          layer: "locality",
          label: "Somewhere, Algeria",
          name: "Somewhere",
          locality: undefined,
          region: undefined,
          country: "Algeria",
        },
      }),
    );
    expect(result.simplifiedName).toBe("Somewhere, Algeria");
    expect(result.location).toEqual(new LngLat(2.5, 23.4));
  });

  it("uses the display-area feature for bbox and center when provided", () => {
    const venue = feature({
      geometry: { type: "Point", coordinates: [-74.008, 40.706] },
      bbox: undefined,
      properties: {
        gid: "openstreetmap:venue:1",
        layer: "venue",
        name: "Wall Street",
        locality: "New York",
        locality_gid: "whosonfirst:locality:85977539",
        region: "New York",
        country: "United States",
      },
    });
    const city = feature({
      geometry: { type: "Point", coordinates: [-74.0, 40.7] },
      bbox: [-74.26, 40.5, -73.7, 40.92],
      properties: {
        gid: "whosonfirst:locality:85977539",
        layer: "locality",
        name: "New York",
        locality: "New York",
      },
    });

    const result = normalize(venue, city, true);
    expect(result.simplifiedName).toBe("New York, United States");
    expect(result.location).toEqual(new LngLat(-74.0, 40.7));
    expect(result.bbox).toEqual([-73.7, 40.92, -74.26, 40.5]);
  });
});

describe("autocomplete", () => {
  it("returns normalized results and forwards the language", async () => {
    let requestedLang: string | null = null;
    let requestedText: string | null = null;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
        requestedLang = req.url.searchParams.get("lang");
        requestedText = req.url.searchParams.get("text");
        return res(ctx.json({ type: "FeatureCollection", features: [feature()] }));
      }),
    );

    const { results } = await autocomplete("paris", { language: "fr" });

    expect(requestedText).toBe("paris");
    expect(requestedLang).toBe("fr");
    expect(results).toHaveLength(1);
    expect(results[0].simplifiedName).toBe("Paris, Île-de-France, France");
  });

  it("sends focus.point coordinates when a bias point is given", async () => {
    let params: URLSearchParams | undefined;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
        params = req.url.searchParams;
        return res(ctx.json({ type: "FeatureCollection", features: [feature()] }));
      }),
    );

    await autocomplete("london", { focus: { lat: 43.0, lon: -81.2 } });

    expect(params?.get("focus.point.lat")).toBe("43");
    expect(params?.get("focus.point.lon")).toBe("-81.2");
    // Bias only — a hard boundary filter would drop distant results entirely.
    expect([...params!.keys()].filter((key) => key.startsWith("boundary."))).toEqual([]);
  });

  it("omits focus.point entirely when no bias point is known", async () => {
    let params: URLSearchParams | undefined;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
        params = req.url.searchParams;
        return res(ctx.json({ type: "FeatureCollection", features: [feature()] }));
      }),
    );

    await autocomplete("london");

    // Not "" and not 0 — 0,0 is a real point in the Gulf of Guinea.
    expect(params?.has("focus.point.lat")).toBe(false);
    expect(params?.has("focus.point.lon")).toBe(false);
  });

  it("preserves the provider's ranking order, so bias is not undone", async () => {
    const londonOntario = feature({
      properties: {
        gid: "whosonfirst:locality:101735809",
        layer: "locality",
        name: "London",
        locality: "London",
        region: "Ontario",
        country: "Canada",
      },
    });
    const londonUk = feature({
      properties: {
        gid: "whosonfirst:locality:101750367",
        layer: "locality",
        name: "London",
        locality: "London",
        region: "England",
        country: "United Kingdom",
      },
    });
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [londonOntario, londonUk],
          }),
        ),
      ),
    );

    const { results } = await autocomplete("london", {
      focus: { lat: 43.0, lon: -81.2 },
      preferCity: true,
    });

    expect(results.map((result) => result.simplifiedName)).toEqual([
      "London, Ontario, Canada",
      "London, England, United Kingdom",
    ]);
  });

  it("soft-reorders city hits when preferCity is set", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                properties: {
                  gid: "geonames:macrocounty:1",
                  layer: "macrocounty",
                  name: "Arrondissement de Lorient",
                  locality: "Brandérion",
                  localadmin: "Brandérion",
                  region: "Morbihan",
                  country: "France",
                },
              }),
              feature({
                properties: {
                  gid: "whosonfirst:locality:2",
                  layer: "locality",
                  name: "Lorient",
                  locality: "Lorient",
                  region: "Morbihan",
                  country: "France",
                },
              }),
            ],
          }),
        ),
      ),
    );

    const { results, features } = await autocomplete("Lorient", {
      preferCity: true,
    });

    // Displayed results are reordered; raw features keep provider order.
    expect(results[0].id).toBe("whosonfirst:locality:2");
    expect(results[0].simplifiedName).toBe("Lorient, Morbihan, France");
    expect(features[0].properties.gid).toBe("geonames:macrocounty:1");
  });

  it("resolves parent locality bbox when preferCity collapses a venue label", async () => {
    let requestedPlaceIds: string | null = null;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                geometry: { type: "Point", coordinates: [-74.008, 40.706] },
                bbox: undefined,
                properties: {
                  gid: "openstreetmap:venue:1",
                  layer: "venue",
                  label: "Wall Street, New York, NY, USA",
                  name: "Wall Street",
                  locality: "New York",
                  locality_gid: "whosonfirst:locality:85977539",
                  region: "New York",
                  country: "United States",
                },
              }),
            ],
          }),
        ),
      ),
      rest.get(PLACE_URL, (req, res, ctx) => {
        requestedPlaceIds = req.url.searchParams.get("ids");
        return res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                geometry: { type: "Point", coordinates: [-74.0, 40.7] },
                bbox: [-74.26, 40.5, -73.7, 40.92],
                properties: {
                  gid: "whosonfirst:locality:85977539",
                  layer: "locality",
                  name: "New York",
                  locality: "New York",
                },
              }),
            ],
          }),
        );
      }),
    );

    const { results } = await autocomplete("Wall Street", { preferCity: true });

    expect(requestedPlaceIds).toBe("whosonfirst:locality:85977539");
    expect(results[0].simplifiedName).toBe("New York, United States");
    expect(results[0].location).toEqual(new LngLat(-74.0, 40.7));
    expect(results[0].bbox).toEqual([-73.7, 40.92, -74.26, 40.5]);
  });

  it("keeps venue point geometry when preferCity is off", async () => {
    let placeCalled = false;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                geometry: { type: "Point", coordinates: [-74.008, 40.706] },
                bbox: undefined,
                properties: {
                  gid: "openstreetmap:venue:1",
                  layer: "venue",
                  name: "Wall Street",
                  locality: "New York",
                  locality_gid: "whosonfirst:locality:85977539",
                  region: "New York",
                  country: "United States",
                },
              }),
              feature({
                geometry: { type: "Point", coordinates: [-74.009, 40.707] },
                bbox: undefined,
                properties: {
                  gid: "openstreetmap:venue:2",
                  layer: "venue",
                  name: "Wall Street",
                  locality: "New York",
                  locality_gid: "whosonfirst:locality:85977539",
                  region: "New York",
                  country: "United States",
                },
              }),
            ],
          }),
        ),
      ),
      rest.get(PLACE_URL, (_req, res, ctx) => {
        placeCalled = true;
        return res(ctx.json({ type: "FeatureCollection", features: [] }));
      }),
    );

    const { results } = await autocomplete("Wall Street");

    expect(placeCalled).toBe(false);
    // Precise mode: matched name, no city collapse; still dedupe identical labels.
    expect(results).toHaveLength(1);
    expect(results[0].simplifiedName).toBe("Wall Street, New York, United States");
    expect(results[0].location).toEqual(new LngLat(-74.008, 40.706));
    expect(results[0].bbox[0]).toBeCloseTo(-73.908);
  });

  it("dedupes identical Paris labels from two sources in precise mode", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                properties: {
                  gid: "geonames:locality:6455259",
                  layer: "locality",
                  label: "Paris, France",
                  name: "Paris",
                  locality: "Paris",
                  region: "Paris",
                  country: "France",
                },
              }),
              feature({
                properties: {
                  gid: "whosonfirst:locality:101751119",
                  layer: "locality",
                  label: "Paris, France",
                  name: "Paris",
                  locality: "Paris",
                  region: "Paris",
                  country: "France",
                },
              }),
            ],
          }),
        ),
      ),
    );

    const { results, features } = await autocomplete("Paris");

    expect(results.map((r) => r.simplifiedName)).toEqual(["Paris, France"]);
    expect(results[0].id).toBe("geonames:locality:6455259");
    expect(features).toHaveLength(2);
  });

  it("omits later hits that share a simplified display name", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                properties: {
                  gid: "openstreetmap:venue:1",
                  layer: "venue",
                  name: "Wall Street",
                  locality: "New York",
                  locality_gid: "whosonfirst:locality:85977539",
                  region: "New York",
                  country: "United States",
                },
              }),
              feature({
                properties: {
                  gid: "openstreetmap:venue:2",
                  layer: "venue",
                  name: "Wall Street",
                  locality: "New York",
                  locality_gid: "whosonfirst:locality:85977539",
                  region: "New York",
                  country: "United States",
                },
              }),
              feature({
                properties: {
                  gid: "whosonfirst:neighbourhood:3",
                  layer: "neighbourhood",
                  name: "Wall Street",
                  locality: "Huntsville",
                  region: "Alabama",
                  country: "United States",
                },
              }),
            ],
          }),
        ),
      ),
      rest.get(PLACE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                bbox: [-74.26, 40.5, -73.7, 40.92],
                properties: {
                  gid: "whosonfirst:locality:85977539",
                  layer: "locality",
                  name: "New York",
                  locality: "New York",
                },
              }),
            ],
          }),
        ),
      ),
    );

    const { results, features } = await autocomplete("Wall Street", {
      preferCity: true,
    });

    expect(results.map((r) => r.simplifiedName)).toEqual([
      "New York, United States",
      "Huntsville, Alabama, United States",
    ]);
    // Raw provider payload is unchanged for telemetry.
    expect(features).toHaveLength(3);
  });

  it("keeps city and state when they would otherwise share a label", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                properties: {
                  gid: "whosonfirst:locality:85977539",
                  layer: "locality",
                  label: "New York, NY, USA",
                  name: "New York",
                  locality: "New York",
                  region: "New York",
                  region_a: "NY",
                  country: "United States",
                },
              }),
              feature({
                properties: {
                  gid: "whosonfirst:region:85688543",
                  layer: "region",
                  label: "New York, USA",
                  name: "New York",
                  locality: undefined,
                  region: "New York",
                  region_a: "NY",
                  country: "United States",
                },
              }),
            ],
          }),
        ),
      ),
    );

    const { results } = await autocomplete("New York", { preferCity: true });

    expect(results.map((r) => r.simplifiedName)).toEqual(["New York, NY, United States", "New York, United States"]);
    expect(results[1].isRegion).toBe(true);
  });

  it("does not abbreviate Madrid when the set has no Madrid region", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) =>
        res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              feature({
                properties: {
                  gid: "whosonfirst:locality:madrid",
                  layer: "locality",
                  label: "Madrid, Spain",
                  name: "Madrid",
                  locality: "Madrid",
                  region: "Madrid",
                  region_a: "MD",
                  country: "Spain",
                },
              }),
              feature({
                properties: {
                  gid: "whosonfirst:county:madrid",
                  layer: "county",
                  label: "Provincia de Madrid, Spain",
                  name: "Provincia de Madrid",
                  locality: undefined,
                  region: "Madrid",
                  region_a: "MD",
                  country: "Spain",
                },
              }),
            ],
          }),
        ),
      ),
    );

    const { results } = await autocomplete("Madrid");

    expect(results.map((r) => r.simplifiedName)).toEqual(["Madrid, Spain", "Provincia de Madrid, Madrid, Spain"]);
  });

  it("throws a typed PeliasError on a non-ok response", async () => {
    server.use(rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => res(ctx.status(500), ctx.text("boom"))));

    await expect(autocomplete("paris")).rejects.toBeInstanceOf(PeliasError);
  });
});

describe("reverse", () => {
  const reverseHandler = (features: PeliasFeature[]) => {
    const captured: { params?: URLSearchParams } = {};
    server.use(
      rest.get(REVERSE_URL, (req, res, ctx) => {
        captured.params = req.url.searchParams;
        return res(ctx.json({ type: "FeatureCollection", features }));
      }),
    );
    return captured;
  };

  it("sends the point and language, and normalizes the response", async () => {
    const captured = reverseHandler([
      feature({
        properties: {
          gid: "openstreetmap:address:1",
          layer: "address",
          label: "8 Place De L'Hotel De Ville, Paris, France",
          name: "8 Place De L'Hotel De Ville",
          locality: "Paris",
          region: "Île-de-France",
          country: "France",
        },
      }),
    ]);

    const { results } = await reverse(48.8566, 2.3522, { language: "fr" });

    expect(captured.params?.get("point.lat")).toBe("48.8566");
    expect(captured.params?.get("point.lon")).toBe("2.3522");
    expect(captured.params?.get("lang")).toBe("fr");
    // Fine mode: no layers restriction, so addresses and venues can come back.
    expect(captured.params?.has("layers")).toBe(false);
    expect(results[0].simplifiedName).toBe("8 Place De L'Hotel De Ville, Paris, France");
    expect(results[0].id).toBe("openstreetmap:address:1");
  });

  it("collapses an address to its city, with the city's geometry, when preferCity is set", async () => {
    // The city-level fields (destination search) never want the street back —
    // and the street number is not returned anyway.
    reverseHandler([
      feature({
        bbox: undefined,
        geometry: { type: "Point", coordinates: [2.3512, 48.8565] },
        properties: {
          gid: "openstreetmap:address:1",
          layer: "address",
          label: "8 Place De L'Hotel De Ville, Paris, France",
          name: "8 Place De L'Hotel De Ville",
          locality: "Paris",
          locality_gid: "whosonfirst:locality:101751119",
          region: "Île-de-France",
          country: "France",
        },
      }),
    ]);
    let requestedPlaceIds: string | null = null;
    server.use(
      rest.get(PLACE_URL, (req, res, ctx) => {
        requestedPlaceIds = req.url.searchParams.get("ids");
        return res(ctx.json({ type: "FeatureCollection", features: [feature()] }));
      }),
    );

    const { results } = await reverse(48.8565, 2.3512, { preferCity: true });

    expect(requestedPlaceIds).toBe("whosonfirst:locality:101751119");
    expect(results[0].simplifiedName).toBe("Paris, Île-de-France, France");
    expect(results[0].location).toEqual(new LngLat(2.3522, 48.8566));
    expect(results[0].bbox).toEqual([2.47, 48.902, 2.224, 48.815]);
  });

  it("keeps the street when preferCity is off", async () => {
    let placeCalled = false;
    reverseHandler([
      feature({
        bbox: undefined,
        geometry: { type: "Point", coordinates: [2.3512, 48.8565] },
        properties: {
          gid: "openstreetmap:address:1",
          layer: "address",
          label: "8 Place De L'Hotel De Ville, Paris, France",
          name: "8 Place De L'Hotel De Ville",
          locality: "Paris",
          locality_gid: "whosonfirst:locality:101751119",
          region: "Île-de-France",
          country: "France",
        },
      }),
    ]);
    server.use(
      rest.get(PLACE_URL, (_req, res, ctx) => {
        placeCalled = true;
        return res(ctx.json({ type: "FeatureCollection", features: [] }));
      }),
    );

    const { results } = await reverse(48.8565, 2.3512);

    expect(placeCalled).toBe(false);
    expect(results[0].simplifiedName).toBe("8 Place De L'Hotel De Ville, Paris, France");
    expect(results[0].location).toEqual(new LngLat(2.3512, 48.8565));
  });

  it("returns the provider's coarse fallback for a sparse coordinate", async () => {
    // What api.geocode.earth actually answers in the middle of the Sahara.
    reverseHandler([
      feature({
        bbox: undefined,
        geometry: { type: "Point", coordinates: [25.6628, 23.4162] },
        properties: {
          gid: "whosonfirst:county:1108739523",
          layer: "county",
          label: "El-Wahat El-Dakhlah, WJ, Egypt",
          name: "El-Wahat El-Dakhlah",
          locality: undefined,
          region: "WJ",
          country: "Egypt",
        },
      }),
    ]);

    const { results } = await reverse(23.4162, 25.6628);

    expect(results).toHaveLength(1);
    expect(results[0].simplifiedName).toBe("El-Wahat El-Dakhlah, WJ, Egypt");
  });

  it("returns an ocean feature at sea rather than nothing", async () => {
    reverseHandler([
      feature({
        bbox: undefined,
        geometry: { type: "Point", coordinates: [-30.0, 0.0] },
        properties: {
          gid: "whosonfirst:ocean:1",
          layer: "ocean",
          label: "South Atlantic Ocean",
          name: "South Atlantic Ocean",
          locality: undefined,
          region: undefined,
          country: undefined,
        },
      }),
    ]);

    const { results } = await reverse(0, -30);

    expect(results[0].simplifiedName).toBe("South Atlantic Ocean");
  });

  it("treats an empty response as a normal empty result, not an error", async () => {
    reverseHandler([]);

    await expect(reverse(0, 0)).resolves.toEqual({
      results: [],
      features: [],
    });
  });

  it("throws a typed PeliasError on a non-ok response", async () => {
    server.use(rest.get(REVERSE_URL, (_req, res, ctx) => res(ctx.status(503), ctx.text("down"))));

    await expect(reverse(48.8566, 2.3522)).rejects.toBeInstanceOf(PeliasError);
  });
});
