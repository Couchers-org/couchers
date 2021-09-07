import { act, renderHook } from "@testing-library/react-hooks";
import useUpdateHostingPreferences from "features/profile/hooks/useUpdateHostingPreferences";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { User } from "proto/api_pb";
import { HostingPreferenceData, service } from "service";
import wrapper from "test/hookWrapper";
import { addDefaultUser, MockedService } from "test/utils";

jest.mock("features/userQueries/useCurrentUser");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;
beforeEach(() => {
  useCurrentUserMock.mockReturnValue({
    data: {
      username: "aapeli",
    } as User.AsObject,
    isError: false,
    isFetching: false,
    isLoading: false,
    error: "",
  });
});

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
      () => useUpdateHostingPreferences(),
      { wrapper }
    );

    act(() =>
      result.current.updateHostingPreferences({
        preferenceData: newHostingPreferenceData,
        setMutationError: () => null,
      })
    );

    await waitFor(() => result.current.status === "success");

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      newHostingPreferenceData
    );
  });

  it("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateHostingPreferenceMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);
    getUserMock.mockResolvedValue(defaultUser);
    const setError = jest.fn();

    const { result, waitFor } = renderHook(
      () => useUpdateHostingPreferences(),
      { wrapper }
    );

    act(() =>
      result.current.updateHostingPreferences({
        preferenceData: newHostingPreferenceData,
        setMutationError: setError,
      })
    );

    await waitFor(() => result.current.status === "error");

    expect(setError).toBeCalledWith("API error");
    expect(setError).toBeCalledTimes(2);
  });
});
