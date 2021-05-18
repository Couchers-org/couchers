import { renderHook } from "@testing-library/react-hooks";
import useUpdateHostingPreferences from "features/profile/hooks/useUpdateHostingPreferences";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { act } from "react-test-renderer";
import { HostingPreferenceData, service } from "service";
import wrapper from "test/hookWrapper";
import { addDefaultUser, MockedService } from "test/utils";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

describe("useUpdateHostingPreference hook", () => {
  const newHostingPreferenceData: HostingPreferenceData = {
    aboutPlace: "",
    acceptsPets: false,
    area: "",
    houseRules: "",
    lastMinute: true,
    maxGuests: null,
    smokingAllowed: 1,
    wheelchairAccessible: true,
    hasPets: false,
    petDetails: "",
    hasKids: false,
    acceptsKids: false,
    kidDetails: "",
    hasHousemates: false,
    housemateDetails: "",
    smokesAtHome: false,
    drinkingAllowed: false,
    drinksAtHome: false,
    otherHostInfo: "",
    campingOk: true,
    parking: true,
    parkingDetails: 3,
    sleepingArrangement: 2,
    sleepingDetails: "",
  };

  it("updates the store with the latest user hosting preference", async () => {
    addDefaultUser();

    updateHostingPreferenceMock.mockResolvedValue(new Empty());

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
