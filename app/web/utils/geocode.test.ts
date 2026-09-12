import { rest, server } from "test/restMock";

import type { ProviderSetting } from "./geocode";

const AUTOCOMPLETE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`;
const NOMINATIM_SEARCH_URL = `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`;

const loadGeocode = async () => {
  jest.resetModules();
  // PeliasError comes from the same fresh module graph, so `instanceof` inside
  // geocode.ts matches the errors these tests construct.
  const [geocode, pelias] = await Promise.all([import("./geocode"), import("./pelias")]);
  return { ...geocode, PeliasError: pelias.PeliasError };
};

const failPelias = (status: number, body = "unavailable") =>
  server.use(
    rest.get(AUTOCOMPLETE_URL, async (_req, res, ctx) => {
      return res(ctx.status(status), ctx.text(body));
    }),
  );

const searchOpts = (providerSetting: ProviderSetting = "auto", allowFallback = true) => ({
  allowFallback,
  providerSetting,
});

describe("geocodeSearch", () => {
  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  describe("normalizeProviderSetting", () => {
    it("keeps known values", async () => {
      const { normalizeProviderSetting } = await loadGeocode();
      expect(normalizeProviderSetting("auto")).toBe("auto");
      expect(normalizeProviderSetting("pelias")).toBe("pelias");
      expect(normalizeProviderSetting("nominatim")).toBe("nominatim");
    });

    it("defaults unknown or missing values to nominatim", async () => {
      const { normalizeProviderSetting } = await loadGeocode();
      expect(normalizeProviderSetting(undefined)).toBe("nominatim");
      expect(normalizeProviderSetting("bogus")).toBe("nominatim");
    });
  });

  describe("isOutageError", () => {
    it.each([undefined, 500, 502, 503, 402, 403, 408, 429])("treats status %s as an outage", async (status) => {
      const { isOutageError, PeliasError } = await loadGeocode();
      expect(isOutageError(new PeliasError("nope", status))).toBe(true);
    });

    it.each([400, 404, 422])("treats status %i as a bad request", async (status) => {
      const { isOutageError, PeliasError } = await loadGeocode();
      expect(isOutageError(new PeliasError("nope", status))).toBe(false);
    });

    it("ignores errors from other sources", async () => {
      const { isOutageError } = await loadGeocode();
      expect(isOutageError(new Error("nope"))).toBe(false);
    });
  });

  describe("with the default (auto) setting", () => {
    it("uses Geocode.earth when it is available", async () => {
      const { geocodeSearch } = await loadGeocode();

      const { provider, results, peliasFeatures } = await geocodeSearch("test", searchOpts());

      expect(provider).toBe("pelias");
      expect(results[0].id).toBe("whosonfirst:locality:1");
      expect(peliasFeatures).toHaveLength(1);
    });

    it("falls back to Nominatim on an outage and reports the cause", async () => {
      failPelias(503, "gateway down");
      const { geocodeSearch } = await loadGeocode();

      const { provider, results, fallbackCause } = await geocodeSearch("test", searchOpts());

      expect(provider).toBe("nominatim");
      expect(results[0].simplifiedName).toBe("fallback city, fallback state, fallback country");
      expect(fallbackCause?.message).toBe("gateway down");
    });

    it("rethrows a bad request instead of falling back", async () => {
      failPelias(400, "bad query");
      const { geocodeSearch } = await loadGeocode();

      await expect(geocodeSearch("test", searchOpts())).rejects.toThrow("bad query");
    });

    it("does not fall back when the caller aborted the request", async () => {
      const controller = new AbortController();
      server.use(
        rest.get(AUTOCOMPLETE_URL, async (_req, res, ctx) => {
          controller.abort();
          return res(ctx.status(503));
        }),
      );
      let fallbackRequests = 0;
      server.use(
        rest.get(NOMINATIM_SEARCH_URL, (_req, res, ctx) => {
          fallbackRequests += 1;
          return res(ctx.json([]));
        }),
      );
      const { geocodeSearch } = await loadGeocode();

      await expect(
        geocodeSearch("test", {
          ...searchOpts(),
          signal: controller.signal,
        }),
      ).rejects.toThrow();
      expect(fallbackRequests).toBe(0);
    });

    it("falls back when Geocode.earth is not configured", async () => {
      const key = process.env.NEXT_PUBLIC_GEOCODE_EARTH_KEY;
      process.env.NEXT_PUBLIC_GEOCODE_EARTH_KEY = "";
      const { geocodeSearch } = await loadGeocode();

      const { provider } = await geocodeSearch("test", searchOpts());

      expect(provider).toBe("nominatim");
      process.env.NEXT_PUBLIC_GEOCODE_EARTH_KEY = key;
    });
  });

  describe("when the caller does not allow fallback", () => {
    const countFallbackRequests = () => {
      const counter = { count: 0 };
      server.use(
        rest.get(NOMINATIM_SEARCH_URL, (_req, res, ctx) => {
          counter.count += 1;
          return res(ctx.json([]));
        }),
      );
      return counter;
    };

    it("throws on an outage instead of falling back", async () => {
      failPelias(503, "gateway down");
      const fallback = countFallbackRequests();
      const { geocodeSearch } = await loadGeocode();

      await expect(geocodeSearch("test", searchOpts("auto", false))).rejects.toThrow("gateway down");
      expect(fallback.count).toBe(0);
    });

    it("refuses the forced nominatim setting rather than serving id-less results", async () => {
      failPelias(503, "gateway down");
      const fallback = countFallbackRequests();
      const { geocodeSearch, initialProvider } = await loadGeocode();

      expect(initialProvider(false, "nominatim")).toBe("pelias");
      await expect(geocodeSearch("test", searchOpts("nominatim", false))).rejects.toThrow("gateway down");
      expect(fallback.count).toBe(0);
    });

    it("still serves Geocode.earth results normally", async () => {
      const { geocodeSearch } = await loadGeocode();

      const { provider, results } = await geocodeSearch("test", searchOpts("auto", false));

      expect(provider).toBe("pelias");
      expect(results[0].id).toBe("whosonfirst:locality:1");
    });
  });

  describe("when a provider is forced", () => {
    it("starts on Nominatim and never calls Geocode.earth", async () => {
      let peliasRequests = 0;
      server.use(
        rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => {
          peliasRequests += 1;
          return res(ctx.json({ type: "FeatureCollection", features: [] }));
        }),
      );
      const { geocodeSearch, initialProvider } = await loadGeocode();

      expect(initialProvider(true, "nominatim")).toBe("nominatim");
      const { provider } = await geocodeSearch("test", searchOpts("nominatim"));

      expect(provider).toBe("nominatim");
      expect(peliasRequests).toBe(0);
    });

    it("does not fall back when pinned to Geocode.earth", async () => {
      failPelias(503, "gateway down");
      let fallbackRequests = 0;
      server.use(
        rest.get(NOMINATIM_SEARCH_URL, (_req, res, ctx) => {
          fallbackRequests += 1;
          return res(ctx.json([]));
        }),
      );
      const { geocodeSearch, initialProvider } = await loadGeocode();

      expect(initialProvider(true, "pelias")).toBe("pelias");
      await expect(geocodeSearch("test", searchOpts("pelias"))).rejects.toThrow("gateway down");
      expect(fallbackRequests).toBe(0);
    });

    it("treats an unrecognised setting as nominatim", async () => {
      let peliasRequests = 0;
      server.use(
        rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => {
          peliasRequests += 1;
          return res(ctx.json({ type: "FeatureCollection", features: [] }));
        }),
      );
      const { geocodeSearch, initialProvider, normalizeProviderSetting } = await loadGeocode();
      const setting = normalizeProviderSetting("bogus");

      expect(setting).toBe("nominatim");
      expect(initialProvider(true, setting)).toBe("nominatim");
      const { provider } = await geocodeSearch("test", searchOpts(setting));

      expect(provider).toBe("nominatim");
      expect(peliasRequests).toBe(0);
    });
  });
});
