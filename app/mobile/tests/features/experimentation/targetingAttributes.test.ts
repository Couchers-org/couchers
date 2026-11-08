import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";

import {
  getTargetingAttributes,
  useTargetingAttributes,
} from "@/features/experimentation/targetingAttributes";
import { getFeatureFlagAttributes } from "@/service/experiments";

jest.mock("@/service/experiments", () => ({
  getFeatureFlagAttributes: jest.fn(),
}));

const getFeatureFlagAttributesMock =
  getFeatureFlagAttributes as jest.MockedFunction<
    typeof getFeatureFlagAttributes
  >;

const VOLUNTEER_ATTRIBUTES = { id: "1", logged_in: true, is_volunteer: true };

// Lets pending promises (fetch, AsyncStorage) resolve under the global fake timers
async function flush() {
  await act(async () => {});
}

beforeEach(async () => {
  await AsyncStorage.clear();
  getFeatureFlagAttributesMock.mockReset();
});

describe("getTargetingAttributes", () => {
  it("uses attributes computed for this user", () => {
    expect(getTargetingAttributes(1, VOLUNTEER_ATTRIBUTES)).toEqual(
      VOLUNTEER_ATTRIBUTES,
    );
    expect(getTargetingAttributes(null, { logged_in: false })).toEqual({
      logged_in: false,
    });
  });

  it("falls back to just the id without attributes for this user", () => {
    expect(getTargetingAttributes(1, undefined)).toEqual({ id: "1" });
    expect(getTargetingAttributes(2, VOLUNTEER_ATTRIBUTES)).toEqual({
      id: "2",
    });
    expect(getTargetingAttributes(null, VOLUNTEER_ATTRIBUTES)).toEqual({});
  });
});

describe("useTargetingAttributes", () => {
  it("fetches and caches the attributes", async () => {
    getFeatureFlagAttributesMock.mockResolvedValue(
      JSON.stringify(VOLUNTEER_ATTRIBUTES),
    );
    const { result } = renderHook(() => useTargetingAttributes(1, true));
    expect(result.current.ready).toBe(false);

    await flush();
    expect(result.current).toEqual({
      attributes: VOLUNTEER_ATTRIBUTES,
      ready: true,
    });
    expect(
      JSON.parse((await AsyncStorage.getItem("featureFlagAttributes"))!),
    ).toEqual(VOLUNTEER_ATTRIBUTES);
  });

  it("does not fetch until enabled", async () => {
    renderHook(() => useTargetingAttributes(null, false));
    await flush();
    expect(getFeatureFlagAttributesMock).not.toHaveBeenCalled();
  });

  it("is ready from the cache without waiting for the backend", async () => {
    await AsyncStorage.setItem(
      "featureFlagAttributes",
      JSON.stringify(VOLUNTEER_ATTRIBUTES),
    );
    getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTargetingAttributes(1, true));

    await flush();
    expect(result.current).toEqual({
      attributes: VOLUNTEER_ATTRIBUTES,
      ready: true,
    });
  });

  it("becomes ready with fallback attributes when the backend is down", async () => {
    getFeatureFlagAttributesMock.mockRejectedValue(new Error("unavailable"));
    const { result } = renderHook(() => useTargetingAttributes(1, true));

    await flush();
    expect(result.current).toEqual({ attributes: { id: "1" }, ready: true });
  });

  it("stops waiting for a slow backend after a timeout", async () => {
    getFeatureFlagAttributesMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTargetingAttributes(1, true));
    await flush();
    expect(result.current.ready).toBe(false);

    act(() => jest.advanceTimersByTime(1500));
    expect(result.current).toEqual({ attributes: { id: "1" }, ready: true });
  });
});
