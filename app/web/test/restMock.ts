import { rest } from "msw";
import { setupServer } from "msw/node";

process.env = {
  ...process.env,
  NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL: "https://geocode.test",
  NEXT_PUBLIC_GEOCODE_EARTH_KEY: "test-key",
};

// Default Geocode.earth (Pelias) autocomplete response used across geocoding tests.
const server = setupServer(
  rest.get(
    `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`,
    (req, res, ctx) => {
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
    },
  ),
);
export { rest, server };
