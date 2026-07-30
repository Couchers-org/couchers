import { renderHook, waitFor } from "@testing-library/react";

import useLocationBias, { markGeolocationGranted } from "./useLocationBias";

const getCurrentPosition = jest.fn();
const permissionsQuery = jest.fn();

const position = {
  coords: { latitude: 43.0, longitude: -81.2 },
} as GeolocationPosition;

function mockGeolocation({
  permissionState,
  permissionsSupported = true,
}: {
  permissionState?: PermissionState;
  permissionsSupported?: boolean;
}) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  });
  permissionsQuery.mockImplementation(() =>
    permissionsSupported
      ? Promise.resolve({ state: permissionState } as PermissionStatus)
      : Promise.reject(new TypeError("unsupported permission name")),
  );
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: permissionsQuery },
  });
}

describe("useLocationBias", () => {
  beforeEach(() => {
    getCurrentPosition.mockReset();
    getCurrentPosition.mockImplementation((onSuccess) => onSuccess(position));
    permissionsQuery.mockReset();
    window.localStorage.clear();
  });

  it("provides the user's coordinates when permission is already granted", async () => {
    mockGeolocation({ permissionState: "granted" });

    const { result } = renderHook(() => useLocationBias(true));

    await waitFor(() =>
      expect(result.current.current).toEqual({ lat: 43.0, lon: -81.2 }),
    );
  });

  it("does not prompt, and stays unbiased, when permission has not been granted", async () => {
    mockGeolocation({ permissionState: "prompt" });

    const { result } = renderHook(() => useLocationBias(true));

    await waitFor(() => expect(permissionsQuery).toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.current).toBeUndefined();
  });

  it("stays unbiased when permission is denied", async () => {
    mockGeolocation({ permissionState: "denied" });

    const { result } = renderHook(() => useLocationBias(true));

    await waitFor(() => expect(permissionsQuery).toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.current).toBeUndefined();
  });

  it("stays unbiased when the geolocation read fails", async () => {
    mockGeolocation({ permissionState: "granted" });
    getCurrentPosition.mockImplementation((_onSuccess, onError) =>
      onError({ code: 3, message: "timeout" }),
    );

    const { result } = renderHook(() => useLocationBias(true));

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalled());
    expect(result.current.current).toBeUndefined();
  });

  it("stays unbiased when geolocation is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useLocationBias(true));

    await waitFor(() => expect(permissionsQuery).not.toHaveBeenCalled());
    expect(result.current.current).toBeUndefined();
  });

  it("does nothing when bias is not enabled", async () => {
    mockGeolocation({ permissionState: "granted" });

    const { result } = renderHook(() => useLocationBias(false));

    await waitFor(() => expect(permissionsQuery).not.toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.current).toBeUndefined();
  });

  describe("when the Permissions API cannot report geolocation (Safari)", () => {
    it("stays unbiased until a grant has been recorded", async () => {
      mockGeolocation({ permissionsSupported: false });

      const { result } = renderHook(() => useLocationBias(true));

      await waitFor(() => expect(permissionsQuery).toHaveBeenCalled());
      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(result.current.current).toBeUndefined();
    });

    it("biases once a grant has been recorded", async () => {
      mockGeolocation({ permissionsSupported: false });
      markGeolocationGranted();

      const { result } = renderHook(() => useLocationBias(true));

      await waitFor(() =>
        expect(result.current.current).toEqual({ lat: 43.0, lon: -81.2 }),
      );
    });
  });
});
