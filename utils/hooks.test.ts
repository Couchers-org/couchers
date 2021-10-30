import { act, renderHook } from "@testing-library/react-hooks";
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
      useSafeState(useIsMounted(), 1)
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
    const { result, waitFor } = renderHook(() => useGeocodeQuery());
    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });
    await act(() => result.current.query("test"));
    expect(result.all[1]).toMatchObject({
      isLoading: true,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });
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
        `${process.env.REACT_APP_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(ctx.status(500), ctx.text("Generic error"));
        }
      )
    );
    const { result, waitFor } = renderHook(() => useGeocodeQuery());
    expect(result.current).toMatchObject({
      isLoading: false,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });
    await act(() => result.current.query("test"));
    expect(result.all[1]).toMatchObject({
      isLoading: true,
      error: undefined,
      results: undefined,
      query: expect.anything(),
    });
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
