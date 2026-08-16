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
export { rest, server };
