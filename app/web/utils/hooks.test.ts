import { act, renderHook, waitFor } from "@testing-library/react";
import { LngLat } from "maplibre-gl";
import { rest, server } from "test/restMock";

import { useGeocodeQuery } from "./hooks";

describe("useGeocodeQuery hook", () => {
  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("works with expected loading state and result", async () => {
    const { result } = renderHook(() => useGeocodeQuery());
    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });
    await act(() => result.current.query("test"));
    await waitFor(() => {
      expect(result.current).toMatchObject({
        isLoading: false,
        error: undefined,
        results: [
          {
            name: "test city, test county, test country",
            location: expect.any(LngLat),
            simplifiedName: "test city, test country",
          },
        ],
        query: expect.anything(),
      });
    });
  });

  it("gives correct error result", async () => {
    server.use(
      rest.get(`${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`, async (_req, res, ctx) => {
        return res(ctx.status(500), ctx.text("Generic error"));
      }),
    );
    const { result } = renderHook(() => useGeocodeQuery());
    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });

    await act(() => result.current.query("test"));

    await waitFor(() => {
      expect(result.current).toMatchObject({
        isLoading: false,
        error: "Generic error",
        results: undefined,
        query: expect.anything(),
      });
    });
  });
});
