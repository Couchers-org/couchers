import { renderHook, waitFor } from "@testing-library/react";
import { service } from "service";
import defaultUser from "test/fixtures/defaultUser.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import useProfileLocationBias from "./useProfileLocationBias";

const getUserMock = service.user.getUser as jest.Mock;

beforeEach(() => {
  window.localStorage.clear();
  getUserMock.mockImplementation(getUser);
});

describe("useProfileLocationBias", () => {
  it("returns the logged-in user's profile coordinates", async () => {
    addDefaultUser();

    const { result } = renderHook(() => useProfileLocationBias(), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual({
        lat: users[0].lat,
        lon: users[0].lng,
      });
    });
  });

  it("keeps the same object across re-renders, so it is safe as a dependency", async () => {
    addDefaultUser();

    const { result, rerender } = renderHook(() => useProfileLocationBias(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("returns undefined when logged out, without requesting a user", async () => {
    const { result } = renderHook(() => useProfileLocationBias(), { wrapper });

    expect(result.current).toBeUndefined();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns undefined when the profile has no location set", async () => {
    addDefaultUser();
    getUserMock.mockResolvedValue({ ...defaultUser, lat: 0, lng: 0 });

    const { result } = renderHook(() => useProfileLocationBias(), { wrapper });

    await waitFor(() => expect(getUserMock).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
