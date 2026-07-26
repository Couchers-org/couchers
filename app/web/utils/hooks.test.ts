import { act, renderHook, waitFor } from "@testing-library/react";
import { LngLat } from "maplibre-gl";
import i18n from "test/i18n";
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
    const { result, unmount } = renderHook(() => useSafeState(useIsMounted(), 1));
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
      clear: expect.anything(),
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

  it("clears previous results when a new query starts", async () => {
    const firstCity = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1.0, 2.0] },
          bbox: [1, 1, 1, 1],
          properties: {
            gid: "whosonfirst:locality:1",
            layer: "locality",
            label: "first city, first country",
            name: "first city",
            locality: "first city",
            country: "first country",
          },
        },
      ],
    };
    const secondCity = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [3.0, 4.0] },
          bbox: [3, 3, 3, 3],
          properties: {
            gid: "whosonfirst:locality:2",
            layer: "locality",
            label: "second city, second country",
            name: "second city",
            locality: "second city",
            country: "second country",
          },
        },
      ],
    };

    let resolveSecond: ((value: unknown) => void) | undefined;
    const secondResponseGate = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`,
        async (req, res, ctx) => {
          const text = req.url.searchParams.get("text");
          if (text === "first") {
            return res(ctx.json(firstCity));
          }
          // Hold the second response so we can assert results were cleared.
          await secondResponseGate;
          return res(ctx.json(secondCity));
        },
      ),
    );

    const { result } = renderHook(() => useGeocodeQuery());
    await act(() => result.current.query("first"));
    await waitFor(() => {
      expect(result.current.results?.[0].simplifiedName).toBe(
        "first city, first country",
      );
    });

    let secondQueryPromise: Promise<void>;
    act(() => {
      secondQueryPromise = result.current.query("second");
    });

    // Stale first-query hits must be gone before the second response lands.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
      expect(result.current.results).toBeUndefined();
    });

    await act(async () => {
      resolveSecond?.(undefined);
      await secondQueryPromise;
    });

    await waitFor(() => {
      expect(result.current.results).toEqual([
        expect.objectContaining({
          simplifiedName: "second city, second country",
        }),
      ]);
    });
  });

  it("clear() drops results and cancels in-flight work", async () => {
    const { result } = renderHook(() => useGeocodeQuery());
    await act(() => result.current.query("test"));
    await waitFor(() => {
      expect(result.current.results).toBeDefined();
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
    });
  });

  it.each([
    ["fr", "fr"],
    ["en-US", "en"],
    ["pt-BR", "pt"],
  ])(
    "forwards i18n.language %s to the provider as %s",
    async (language, expectedLang) => {
      const originalLanguage = i18n.language;
      let requestedLang: string | null = null;
      server.use(
        rest.get(
          `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`,
          (req, res, ctx) => {
            requestedLang = req.url.searchParams.get("lang");
            return res(
              ctx.json({ type: "FeatureCollection", features: [] }),
            );
          },
        ),
      );

      await act(() => i18n.changeLanguage(language));
      const { result } = renderHook(() => useGeocodeQuery());
      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(requestedLang).toBe(expectedLang);
      });

      await act(() => i18n.changeLanguage(originalLanguage));
    },
  );

  it("gives correct error result", async () => {
    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`,
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
});
