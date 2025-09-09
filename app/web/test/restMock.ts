import { rest } from "msw";
import { setupServer } from "msw/node";

Config.nominatimUrl = "http://nominatim.test/";

const server = setupServer(
  rest.get(`${Config.nominatimUrl}search`, (_req, res, ctx) => {
    return res(
      ctx.json([
        {
          address: { city: "test city", country: "test country" },
          lon: 1.0,
          lat: 2.0,
          display_name: "test city, test county, test country",
          boundingbox: [1, 1, 1, 1],
        },
      ]),
    );
  }),
);
export { rest, server };
