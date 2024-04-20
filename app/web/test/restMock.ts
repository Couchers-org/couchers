import { rest } from "msw";
import { setupServer } from "msw/node";

process.env = {
  ...process.env,
  NEXT_PUBLIC_NOMINATIM_URL: "http://nominatim.test/",
};

const server = setupServer(
  rest.get(
    `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
    (req, res, ctx) => {
      return res(
        ctx.json([
          {
            address: { city: "test city", country: "test country" },
            lon: 1.0,
            lat: 2.0,
            display_name: "test city, test county, test country",
            boundingbox: [1, 1, 1, 1],
          },
        ])
      );
    }
  )
);
export { rest, server };
