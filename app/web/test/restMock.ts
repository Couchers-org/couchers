import { ResponseComposition, rest, RestContext } from "msw";
import { setupServer } from "msw/node";

process.env = {
  ...process.env,
  NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL: "https://geocode.test",
  NEXT_PUBLIC_GEOCODE_EARTH_KEY: "test-key",
  NEXT_PUBLIC_NOMINATIM_URL: "https://nominatim.test/",
};

// By default every geoservice request fails, so a test only gets geocoding results
// by explicitly mocking them (see the mock* helpers below).
const unmockedResponse = (_req: unknown, res: ResponseComposition, ctx: RestContext) =>
  res(ctx.status(500), ctx.text("Geoservice request not mocked in this test"));

const server = setupServer(
  rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, unmockedResponse),
  rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/reverse`, unmockedResponse),
  rest.get(`${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`, unmockedResponse),
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

// The Pelias feature returned by `mockPeliasTestCity`.
export const TEST_CITY_LABEL = "test city, test county, test country";
export const TEST_CITY_FEATURE = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [1.0, 2.0] },
  bbox: [1, 1, 1, 1],
  properties: {
    gid: "whosonfirst:locality:1",
    layer: "locality",
    label: TEST_CITY_LABEL,
    name: "test city",
    locality: "test city",
    country: "test country",
  },
};

// Makes Pelias autocomplete return a single result, labelled TEST_CITY_LABEL.
export const mockPeliasTestCity = (onRequest?: RequestInspector) =>
  mockPeliasAutocomplete([TEST_CITY_FEATURE], onRequest);

// The Nominatim result returned by `mockNominatimFallbackCity`.
export const FALLBACK_CITY_LABEL = "fallback city, fallback state, fallback country";
export const FALLBACK_CITY_RESULT = {
  place_id: 1,
  display_name: FALLBACK_CITY_LABEL,
  lat: "4.0",
  lon: "3.0",
  boundingbox: ["1", "2", "3", "4"],
  importance: 0.5,
  address: {
    city: "fallback city",
    state: "fallback state",
    country: "fallback country",
  },
};

// Makes Nominatim search return a single result, labelled FALLBACK_CITY_LABEL.
export const mockNominatimFallbackCity = (onRequest?: RequestInspector) =>
  mockNominatimSearch([FALLBACK_CITY_RESULT], onRequest);

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

// Stubs navigator.geolocation to either succeed (Paris) or fail with the given error code.
export const mockPosition = (granted: boolean, code = 1) => {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (onSuccess: PositionCallback, onError: PositionErrorCallback) =>
        granted
          ? onSuccess({
              coords: { latitude: 48.8566, longitude: 2.3522 },
            } as GeolocationPosition)
          : onError({ code, message: "nope" } as GeolocationPositionError),
    },
  });
};

export { rest, server };
