import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { getFeatureFlagAttributes } from "service/experiments";

import { getTargetingAttributes, useTargetingAttributes } from "./targetingAttributes";

jest.mock("service/experiments", () => ({ getFeatureFlagAttributes: jest.fn() }));

const getFeatureFlagAttributesMock = getFeatureFlagAttributes as jest.MockedFunction<typeof getFeatureFlagAttributes>;

const VOLUNTEER_ATTRIBUTES = { id: "1", logged_in: true, is_volunteer: true };

beforeEach(() => {
  localStorage.clear();
  getFeatureFlagAttributesMock.mockReset();
});

describe("getTargetingAttributes", () => {
  it("uses attributes computed for this user", () => {
    expect(getTargetingAttributes(1, VOLUNTEER_ATTRIBUTES)).toEqual(VOLUNTEER_ATTRIBUTES);
    expect(getTargetingAttributes(null, { logged_in: false })).toEqual({ logged_in: false });
  });

  it("falls back to just the id without attributes for this user", () => {
    expect(getTargetingAttributes(1, undefined)).toEqual({ id: "1" });
    expect(getTargetingAttributes(2, VOLUNTEER_ATTRIBUTES)).toEqual({ id: "2" });
    expect(getTargetingAttributes(1, { logged_in: false })).toEqual({ id: "1" });
    expect(getTargetingAttributes(null, VOLUNTEER_ATTRIBUTES)).toEqual({});
  });
});

describe("useTargetingAttributes", () => {
  it("fetches and caches the attributes", async () => {
    getFeatureFlagAttributesMock.mockResolvedValue(JSON.stringify(VOLUNTEER_ATTRIBUTES));
    const { result } = renderHook(() => useTargetingAttributes(1));

    expect(result.current).toEqual({ attributes: { id: "1" }, ready: false, refresh: expect.any(Function) });
    await waitFor(() =>
      expect(result.current).toEqual({ attributes: VOLUNTEER_ATTRIBUTES, ready: true, refresh: expect.any(Function) }),
    );
    expect(JSON.parse(localStorage.getItem("featureFlagAttributes")!)).toEqual(VOLUNTEER_ATTRIBUTES);
  });

  it("is ready immediately from the cache", () => {
    localStorage.setItem("featureFlagAttributes", JSON.stringify(VOLUNTEER_ATTRIBUTES));
    getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTargetingAttributes(1));

    expect(result.current).toEqual({ attributes: VOLUNTEER_ATTRIBUTES, ready: true, refresh: expect.any(Function) });
  });

  it("ignores cached attributes for another user", () => {
    localStorage.setItem("featureFlagAttributes", JSON.stringify(VOLUNTEER_ATTRIBUTES));
    getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTargetingAttributes(2));

    expect(result.current).toEqual({ attributes: { id: "2" }, ready: false, refresh: expect.any(Function) });
  });

  it("becomes ready with fallback attributes when the backend is down", async () => {
    getFeatureFlagAttributesMock.mockRejectedValue(new Error("unavailable"));
    const { result } = renderHook(() => useTargetingAttributes(1));

    await waitFor(() =>
      expect(result.current).toEqual({ attributes: { id: "1" }, ready: true, refresh: expect.any(Function) }),
    );
  });

  it("stops waiting for a slow backend after a timeout", () => {
    jest.useFakeTimers();
    try {
      getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useTargetingAttributes(1));
      expect(result.current.ready).toBe(false);

      act(() => jest.advanceTimersByTime(1500));
      expect(result.current).toEqual({ attributes: { id: "1" }, ready: true, refresh: expect.any(Function) });
    } finally {
      jest.useRealTimers();
    }
  });

  it("refetches the attributes on refresh", async () => {
    getFeatureFlagAttributesMock.mockResolvedValueOnce(JSON.stringify(VOLUNTEER_ATTRIBUTES));
    const { result } = renderHook(() => useTargetingAttributes(1));
    await waitFor(() => expect(result.current.attributes).toEqual(VOLUNTEER_ATTRIBUTES));

    const betaAttributes = { ...VOLUNTEER_ATTRIBUTES, is_beta: true };
    getFeatureFlagAttributesMock.mockResolvedValueOnce(JSON.stringify(betaAttributes));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.attributes).toEqual(betaAttributes));
    expect(result.current.ready).toBe(true);
  });

  it("waits again when the user changes", async () => {
    getFeatureFlagAttributesMock.mockResolvedValueOnce(JSON.stringify({ logged_in: false }));
    const { result, rerender } = renderHook(({ userId }) => useTargetingAttributes(userId), {
      initialProps: { userId: null as number | null },
    });
    await waitFor(() =>
      expect(result.current).toEqual({ attributes: { logged_in: false }, ready: true, refresh: expect.any(Function) }),
    );

    getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
    rerender({ userId: 1 });
    expect(result.current).toEqual({ attributes: { id: "1" }, ready: false, refresh: expect.any(Function) });
  });
});
