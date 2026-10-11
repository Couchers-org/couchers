import { act, renderHook, waitFor } from "@testing-library/react";
import { logEvent } from "features/analytics";
import { LngLat } from "maplibre-gl";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { rest, server } from "test/restMock";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";
import { resetFailoverState } from "utils/geocode";

import { useGeocodeQuery, useIsMounted, useSafeState } from "./hooks";

jest.mock("features/analytics", () => ({ logEvent: jest.fn() }));
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

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
    resetFailoverState();
  });
  afterAll(() => {
    server.close();
  });

  it("works with expected loading state and result", async () => {
    const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
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
      rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, async (req, res, ctx) => {
        const text = req.url.searchParams.get("text");
        if (text === "first") {
          return res(ctx.json(firstCity));
        }
        // Hold the second response so we can assert results were cleared.
        await secondResponseGate;
        return res(ctx.json(secondCity));
      }),
    );

    const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
    await act(() => result.current.query("first"));
    await waitFor(() => {
      expect(result.current.results?.[0].simplifiedName).toBe("first city, first country");
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
    const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
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
  ])("forwards i18n.language %s to the provider as %s", async (language, expectedLang) => {
    const originalLanguage = i18n.language;
    let requestedLang: string | null = null;
    server.use(
      rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, (req, res, ctx) => {
        requestedLang = req.url.searchParams.get("lang");
        return res(ctx.json({ type: "FeatureCollection", features: [] }));
      }),
    );

    await act(() => i18n.changeLanguage(language));
    const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
    await act(() => result.current.query("test"));

    await waitFor(() => {
      expect(requestedLang).toBe(expectedLang);
    });

    await act(() => i18n.changeLanguage(originalLanguage));
  });

  describe("location bias (LOC-3)", () => {
    const autocompleteUrl = `${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`;
    const getUserMock = service.user.getUser as jest.Mock;

    beforeEach(() => {
      getUserMock.mockImplementation(getUser);
    });

    // `addDefaultUser` logs a user in via localStorage; don't leak that (or the
    // geolocation-granted hint) into the tests that expect a logged-out, unbiased
    // baseline.
    afterEach(() => {
      window.localStorage.clear();
    });

    const mockGranted = (granted: boolean) => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (onSuccess: PositionCallback, onError: PositionErrorCallback) =>
            granted
              ? onSuccess({
                  coords: { latitude: 43.0, longitude: -81.2 },
                } as GeolocationPosition)
              : onError({
                  code: 1,
                  message: "denied",
                } as GeolocationPositionError),
        },
      });
      Object.defineProperty(navigator, "permissions", {
        configurable: true,
        value: {
          query: () =>
            Promise.resolve({
              state: granted ? "granted" : "denied",
            } as PermissionStatus),
        },
      });
    };

    const captureParams = () => {
      const captured: { params?: URLSearchParams } = {};
      server.use(
        rest.get(autocompleteUrl, (req, res, ctx) => {
          captured.params = req.url.searchParams;
          return res(ctx.json({ type: "FeatureCollection", features: [] }));
        }),
      );
      return captured;
    };

    it("biases the request to the user's position when it is available", async () => {
      mockGranted(true);
      const captured = captureParams();

      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, biasToUserLocation: true }), {
        wrapper,
      });
      // Let the permission check and position read settle before querying.
      await act(async () => {});
      await act(() => result.current.query("london"));

      await waitFor(() => {
        expect(captured.params?.get("focus.point.lat")).toBe("43");
        expect(captured.params?.get("focus.point.lon")).toBe("-81.2");
      });
    });

    it("falls back to the profile location when geolocation is refused", async () => {
      mockGranted(false);
      addDefaultUser();
      const captured = captureParams();

      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, biasToUserLocation: true }), {
        wrapper,
      });
      await waitFor(() => expect(getUserMock).toHaveBeenCalled());
      await act(async () => {});
      await act(() => result.current.query("london"));

      await waitFor(() => {
        expect(captured.params?.get("focus.point.lat")).toBe(String(users[0].lat));
        expect(captured.params?.get("focus.point.lon")).toBe(String(users[0].lng));
      });
    });

    it("prefers the browser position over the profile location", async () => {
      mockGranted(true);
      addDefaultUser();
      const captured = captureParams();

      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, biasToUserLocation: true }), {
        wrapper,
      });
      await waitFor(() => expect(getUserMock).toHaveBeenCalled());
      await act(async () => {});
      await act(() => result.current.query("london"));

      await waitFor(() => {
        expect(captured.params?.get("focus.point.lat")).toBe("43");
        expect(captured.params?.get("focus.point.lon")).toBe("-81.2");
      });
    });

    it("queries unbiased when geolocation is refused and the user is logged out", async () => {
      mockGranted(false);
      const captured = captureParams();

      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, biasToUserLocation: true }), {
        wrapper,
      });
      await act(async () => {});
      await act(() => result.current.query("london"));

      await waitFor(() => {
        expect(captured.params).toBeDefined();
      });
      expect(captured.params?.has("focus.point.lat")).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it("queries unbiased when the caller does not ask for bias, even with a profile location", async () => {
      mockGranted(true);
      addDefaultUser();
      const captured = captureParams();

      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
      await act(async () => {});
      await act(() => result.current.query("london"));

      await waitFor(() => {
        expect(captured.params).toBeDefined();
      });
      expect(captured.params?.has("focus.point.lat")).toBe(false);
    });
  });

  it("gives correct error result", async () => {
    // 400 is a bad request, not an outage — it must surface as an error rather
    // than fall back to Nominatim.
    server.use(
      rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, async (_req, res, ctx) => {
        return res(ctx.status(400), ctx.text("Generic error"));
      }),
    );
    const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });
    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
      query: expect.anything(),
      provider: "pelias",
    });

    await act(() => result.current.query("test"));

    await waitFor(() => {
      expect(result.current).toMatchObject({
        isLoading: false,
        error: "Generic error",
        results: undefined,
        query: expect.anything(),
        provider: "pelias",
      });
    });
  });

  describe("Geocode.earth outage fallback", () => {
    const failPelias = (status: number) =>
      server.use(
        rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, async (_req, res, ctx) => {
          return res(ctx.status(status), ctx.text("provider unavailable"));
        }),
      );

    it.each([500, 503, 429, 402])("switches to Nominatim submit mode on a %i without querying it", async (status) => {
      failPelias(status);
      let nominatimRequests = 0;
      server.use(
        rest.get(`${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`, (_req, res, ctx) => {
          nominatimRequests += 1;
          return res(ctx.json([]));
        }),
      );
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });

      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });
      expect(result.current.error).toBeUndefined();
      expect(result.current.results).toBeUndefined();
      expect(nominatimRequests).toBe(0);
    });

    it("queries Nominatim only after switching to submit mode", async () => {
      failPelias(500);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });
      expect(result.current.results).toBeUndefined();

      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });
      expect(result.current.results?.[0].id).toBeUndefined();
      expect(result.current.results).toEqual([
        {
          name: "fallback city, fallback state, fallback country",
          simplifiedName: "fallback city, fallback state, fallback country",
          location: new LngLat(3.0, 4.0),
          bbox: [4, 2, 3, 1],
          isRegion: false,
        },
      ]);
    });

    it("stays on the fallback provider once it has been used", async () => {
      failPelias(500);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });

      // Geocode.earth recovers, but the provider must not flip back mid-session.
      server.resetHandlers();
      await act(() => result.current.query("test again"));

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });
      expect(result.current.provider).toBe("nominatim");
    });

    it("fails closed when the caller does not allow fallback", async () => {
      failPelias(503);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: false }), { wrapper });

      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(result.current.isProviderUnavailable).toBe(true);
      });
      expect(result.current.results).toBeUndefined();
      expect(result.current.provider).toBe("pelias");
      // The raw provider text is not a user-facing message; the consumer
      // translates `isProviderUnavailable` instead.
      expect(result.current.error).toBeUndefined();
    });

    it("reports a bad request as an error even when fallback is disallowed", async () => {
      failPelias(400);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: false }), { wrapper });

      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(result.current.error).toBe("provider unavailable");
      });
      expect(result.current.isProviderUnavailable).toBe(false);
    });

    it("clears the unavailable state when a later query succeeds", async () => {
      failPelias(503);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: false }), { wrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.isProviderUnavailable).toBe(true);
      });

      server.resetHandlers();
      await act(() => result.current.query("test again"));

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });
      expect(result.current.isProviderUnavailable).toBe(false);
    });

    it("surfaces an error when the fallback provider also fails", async () => {
      failPelias(500);
      server.use(
        rest.get(`${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`, async (_req, res, ctx) => {
          return res(ctx.status(500), ctx.text("fallback down"));
        }),
      );
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });

      await act(() => result.current.query("test"));

      await waitFor(() => {
        expect(result.current.error).toBe("fallback down");
      });
      expect(result.current.results).toBeUndefined();
    });
  });

  describe("telemetry", () => {
    beforeEach(() => {
      mockLogEvent.mockClear();
    });

    const failPelias = (status: number) =>
      server.use(
        rest.get(`${process.env.NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`, (_req, res, ctx) =>
          res(ctx.status(status), ctx.text("provider unavailable")),
        ),
      );

    const eventsOf = (tag: string) => mockLogEvent.mock.calls.filter(([eventType]) => eventType === tag);

    it("logs each completed request with its surface, provider and latency", async () => {
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, surface: "hero-search" }), {
        wrapper,
      });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.results).toBeDefined();
      });

      expect(eventsOf("geocode.request")).toEqual([
        [
          "geocode.request",
          expect.objectContaining({
            surface: "hero-search",
            provider: "pelias",
            setting: "auto",
            outcome: "ok",
            result_count: result.current.results!.length,
            query_length: 4,
          }),
          expect.any(Number),
        ],
      ]);
    });

    it("logs the failover and the deferred request on an outage", async () => {
      failPelias(503);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true, surface: "hero-search" }), {
        wrapper,
      });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });

      expect(eventsOf("geocode.failover")).toEqual([
        [
          "geocode.failover",
          expect.objectContaining({
            surface: "hero-search",
            cause_status: 503,
            cause_kind: "http",
            served_by_fallback: false,
          }),
          undefined,
        ],
      ]);
      expect(eventsOf("geocode.request")).toEqual([
        [
          "geocode.request",
          expect.objectContaining({ provider: "nominatim", outcome: "deferred" }),
          expect.any(Number),
        ],
      ]);
    });

    it("logs an outage on a surface that does not allow fallback", async () => {
      failPelias(503);
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: false }), { wrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.isProviderUnavailable).toBe(true);
      });

      expect(eventsOf("geocode.request")).toEqual([
        [
          "geocode.request",
          expect.objectContaining({ allow_fallback: false, outcome: "outage", status: 503, error_kind: "http" }),
          expect.any(Number),
        ],
      ]);
      expect(eventsOf("geocode.failover")).toEqual([]);
    });

    it("logs nothing when the geocode_telemetry_enabled kill switch is off", async () => {
      failPelias(503);
      const { wrapper: disabledWrapper } = getHookWrapperWithClient({
        geocode_telemetry_enabled: { defaultValue: false },
      });
      const { result } = renderHook(() => useGeocodeQuery({ allowFallback: true }), { wrapper: disabledWrapper });

      await act(() => result.current.query("test"));
      await waitFor(() => {
        expect(result.current.provider).toBe("nominatim");
      });

      expect(mockLogEvent).not.toHaveBeenCalled();
    });
  });
});
