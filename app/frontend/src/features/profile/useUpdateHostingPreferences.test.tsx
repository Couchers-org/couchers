import { renderHook } from "@testing-library/react-hooks";
import useUpdateHostingPreferences from "features/profile/useUpdateHostingPreferences";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { act } from "react-test-renderer";
import { service } from "service/index";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

const getUserMock = service.user.getUser as jest.Mock;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as jest.Mock;

describe("useUpdateHostingPreference hook", () => {
  const newHostingPreferenceData = {
    acceptsKids: false,
    acceptsPets: false,
    area: "",
    houseRules: "",
    lastMinute: true,
    maxGuests: null,
    smokingAllowed: 1,
    wheelchairAccessible: true,
  };

  it("updates the store with the latest user hosting preference", async () => {
    addDefaultUser();
    const newUserPref = Object.entries(newHostingPreferenceData).reduce(
      (acc: Record<string, unknown>, [key, value]) => {
        if (key !== "smokingAllowed") {
          acc[key] = { value };
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
    getUserMock.mockImplementation(() => {
      if (!updateHostingPreferenceMock.mock.calls.length) {
        return defaultUser;
      } else {
        return {
          ...defaultUser,
          ...newUserPref,
        };
      }
    });
    const { result, waitFor } = renderHook(
      () => ({
        currentUser: useCurrentUser(),
        mutate: useUpdateHostingPreferences(),
      }),
      { wrapper }
    );

    act(() =>
      result.current.mutate.updateHostingPreferences({
        preferenceData: newHostingPreferenceData,
        setMutationError: () => null,
      })
    );

    await waitFor(() => result.current.mutate.status === "success");

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      newHostingPreferenceData
    );
    //once for getCurrentUser then once for invalidation
    expect(getUserMock).toHaveBeenCalledTimes(2);
    expect(getUserMock).toHaveBeenCalledWith(`${defaultUser.userId}`);
    // Things that have been updated are being reflected
    expect(result.current.currentUser.data).toMatchObject({
      acceptsKids: { value: false },
      acceptsPets: { value: false },
      area: { value: "" },
      houseRules: { value: "" },
      lastMinute: { value: true },
      maxGuests: { value: null },
      smokingAllowed: 1,
      wheelchairAccessible: { value: true },
    });
    // Rest of profile should be the same as before
    expect(result.current.currentUser.data).toMatchObject(defaultUser);
  });

  it("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateHostingPreferenceMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);
    getUserMock.mockResolvedValue(defaultUser);
    const setError = jest.fn();

    const { result, waitFor } = renderHook(
      () => ({
        mutate: useUpdateHostingPreferences(),
      }),
      { wrapper }
    );

    act(() =>
      result.current.mutate.updateHostingPreferences({
        preferenceData: newHostingPreferenceData,
        setMutationError: setError,
      })
    );

    await waitFor(() => result.current.mutate.status === "error");

    expect(setError).toBeCalledWith("API error");
    expect(setError).toBeCalledTimes(2);
  });
});
