import { rest } from "msw";
import { setupServer } from "msw/node";

process.env = {
  ...process.env,
  NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL: "https://geocode.test",
  NEXT_PUBLIC_GEOCODE_EARTH_KEY: "test-key",
  NEXT_PUBLIC_NOMINATIM_URL: "https://nominatim.test/",
};

// Default Geocode.earth (Pelias) autocomplete response used across geocoding tests.
const server = setupServer(
  rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, (req, res, ctx) => {
    return res(
      ctx.json({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [1.0, 2.0] },
            bbox: [1, 1, 1, 1],
            properties: {
              gid: "whosonfirst:locality:1",
              layer: "locality",
              label: "test city, test county, test country",
              name: "test city",
              locality: "test city",
              country: "test country",
            },
          },
        ],
      }),
    );
  }),
  // Legacy Nominatim fallback, only reached when Geocode.earth is unavailable.
  rest.get(`${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`, (_req, res, ctx) => {
    return res(
      ctx.json([
        {
          place_id: 1,
          display_name: "fallback city, fallback state, fallback country",
          lat: "4.0",
          lon: "3.0",
          boundingbox: ["1", "2", "3", "4"],
          importance: 0.5,
          address: {
            city: "fallback city",
            state: "fallback state",
            country: "fallback country",
          },
        },
      ]),
    );
  }),
);

export const AUTOCOMPLETE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`;
export const REVERSE_URL = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/reverse`;
export const NOMINATIM_SEARCH_URL = `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`;

type RequestInspector = (params: URLSearchParams) => void;

const featureCollection = (features: unknown[]) => ({ type: "FeatureCollection", features });

// One-line overrides of the geoservice endpoints. `onRequest` receives the query
// params of each request, for asserting on what was sent.
export const mockPeliasAutocomplete = (features: unknown[] = [], onRequest?: RequestInspector) =>
  server.use(
    rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
      onRequest?.(req.url.searchParams);
      return res(ctx.json(featureCollection(features)));
    }),
  );

export const mockPeliasReverse = (features: unknown[] = [], onRequest?: RequestInspector) =>
  server.use(
    rest.get(REVERSE_URL, (req, res, ctx) => {
      onRequest?.(req.url.searchParams);
      return res(ctx.json(featureCollection(features)));
    }),
  );

export const mockPeliasFailure = (status: number, body = "unavailable", url = AUTOCOMPLETE_URL) =>
  server.use(rest.get(url, (_req, res, ctx) => res(ctx.status(status), ctx.text(body))));

export const mockNominatimSearch = (results: unknown[] = [], onRequest?: RequestInspector) =>
  server.use(
    rest.get(NOMINATIM_SEARCH_URL, (req, res, ctx) => {
      onRequest?.(req.url.searchParams);
      return res(ctx.json(results));
    }),
  );

export const mockNominatimFailure = (status: number, body = "unavailable") =>
  mockPeliasFailure(status, body, NOMINATIM_SEARCH_URL);

export { rest, server };
