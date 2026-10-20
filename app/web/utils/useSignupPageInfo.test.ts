import { renderHook, waitFor } from "@testing-library/react";

import useSignupPageInfo from "./useSignupPageInfo";

const mockSignupInfo = {
  userCount: "80000",
  lastSignup: "2024-01-01T00:00:00Z",
  lastLocation: "Berlin",
};

describe("useSignupPageInfo", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the signup info once the request resolves", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSignupInfo),
    });

    const { result } = renderHook(() => useSignupPageInfo());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.signupInfo).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signupInfo).toEqual(mockSignupInfo);
  });

  it("leaves signupInfo null when the request fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSignupPageInfo());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signupInfo).toBeNull();
  });

  it("leaves signupInfo null when the response is not ok", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useSignupPageInfo());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signupInfo).toBeNull();
  });
});
