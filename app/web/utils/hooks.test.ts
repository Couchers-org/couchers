import { act, renderHook, waitFor } from "@testing-library/react";
import { LngLat } from "maplibre-gl";
import { rest, server } from "test/restMock";

import { useGeocodeQuery, useIsMounted, useSafeState } from "./hooks";

describe("useIsMounted hook", () => {
  it("is true when mounted and false when not", () => {
    const { result, rerender, unmount } = renderHook(() => useIsMounted());
    expect(result.current.current).toBe(true);
    rerender();
    expect(result.current.current).toBe(true);
    unmount();
    expect(result.current.current).toBe(false);
  });
});

describe("useSafeState hook", () => {
  it("sets state when mounted only", () => {
    const { result, unmount } = renderHook(() =>
      useSafeState(useIsMounted(), 1),
    );
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
    unmount();
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(2);
  });
});

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
      rest.get(
        `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(ctx.status(500), ctx.text("Generic error"));
        },
      ),
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

  it("applies metropolitan France bbox override for country-level FR", async () => {
    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                address: { country: "France", country_code: "fr" },
                addresstype: "country",
                boundingbox: [
                  "172.3057152",
                  "51.3055721",
                  "-178.3873749",
                  "-50.2187169",
                ],
                category: "boundary",
                display_name: "France",
                importance: 0.9694907334242433,
                lat: "46.6033540",
                licence:
                  "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
                lon: "1.8883335",
                osm_type: "relation",
                osm_id: 2202162,
                place_id: 280382580,
                place_rank: 4,
                type: "administrative",
                name: "France",
              },
            ]),
          );
        },
      ),
    );

    const { result } = renderHook(() => useGeocodeQuery());
    await act(() => result.current.query("France"));
    await waitFor(() => {
      expect(result.current.results?.[0].name).toContain("France");
      expect(result.current.results?.[0].bbox).toEqual([
        -5.142, 41.333, 9.559, 51.092,
      ]);
    });
  });

  it("applies contiguous US bbox override for country-level US", async () => {
    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                address: { country: "United States", country_code: "us" },
                addresstype: "country",
                boundingbox: [
                  "180.0000000",
                  "71.5889534",
                  "-180.0000000",
                  "-14.7608358",
                ],
                category: "boundary",
                display_name: "United States",
                importance: 1,
                lat: "39.7837304",
                licence:
                  "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
                lon: "-100.4458820",
                osm_type: "relation",
                osm_id: 148838,
                place_id: 46583304,
                place_rank: 4,
                type: "administrative",
                name: "United States",
              },
            ]),
          );
        },
      ),
    );

    const { result } = renderHook(() => useGeocodeQuery());
    await act(() => result.current.query("United States"));
    await waitFor(() => {
      expect(result.current.results?.[0].name).toContain("United States");
      expect(result.current.results?.[0].bbox).toEqual([
        -125.0, 24.396308, -66.93457, 49.384358,
      ]);
    });
  });
});
