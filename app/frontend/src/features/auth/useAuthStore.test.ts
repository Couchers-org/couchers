import { renderHook } from "@testing-library/react-hooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { act } from "react-test-renderer";
import { service } from "../../service";
import { addDefaultUser } from "../../test/utils";
import useAuthStore, { usePersistedState } from "./useAuthStore";

describe("usePersistedState hook", () => {
  it("uses a default value", () => {
    const defaultValue = "Test string";
    const { result } = renderHook(() => usePersistedState("key", defaultValue));
    expect(result.current[0]).toBe(defaultValue);
  });

  it("saves then loads a value", () => {
    const value = "Test string";
    renderHook(() => {
      const [state, setState] = usePersistedState("key", "");
      expect(state).toBe("");
      setState(value);
      expect(state).toBe(value);
    });
    expect(localStorage.getItem("key")).toBe(JSON.stringify(value));
    const { result } = renderHook(() => usePersistedState("key", ""));
    expect(result.current[0]).toBe(value);
  });
});

describe("useAuthStore hook", () => {
  it("keeps referential equality of actions between state changes", () => {
    const render = renderHook(() => useAuthStore());
    const firstActions = render.result.current.authActions;
    render.rerender();
    const secondActions = render.result.current.authActions;
    expect(firstActions).toBe(secondActions);
  });
});

const getUserMock = service.user.getUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as jest.Mock;

describe("updateUserProfile thunk", () => {
  it("updates the store with the latest user profile info", async () => {
    addDefaultUser();
    const {
      aboutMe,
      aboutPlace,
      radius,
      countriesLivedList,
      countriesVisitedList,
      gender,
      name,
      occupation,
    } = defaultUser;
    const newUserProfileData = {
      // Unchanged data
      name,
      gender,
      occupation,
      aboutMe,
      aboutPlace,
      countriesLived: countriesLivedList,
      // Changed data
      city: "New York",
      lat: 40.7306,
      lng: -73.9352,
      radius,
      hostingStatus: 3,
      languages: ["English", "Finnish", "Spanish"],
      countriesVisited: [...countriesVisitedList, "United States"],
    };
    updateProfileMock.mockResolvedValue(new Empty());
    getUserMock.mockResolvedValue({
      ...newUserProfileData,
      countriesLivedList,
      countriesVisitedList: newUserProfileData.countriesVisited,
    });
    const { result } = renderHook(() => useAuthStore());

    await act(() =>
      result.current.authActions.updateUserProfile(newUserProfileData)
    );

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(newUserProfileData);
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledWith("aapeli");

    const state = result.current.authState;

    // Things that have been updated are being reflected
    expect(state.user).toMatchObject({
      city: "New York",
      hostingStatus: 3,
      languages: ["English", "Finnish", "Spanish"],
      countriesLivedList: ["Australia", "Finland", "Sweden", "United States"],
      countriesVisitedList: ["Australia", "United States"],
    });
    // Things haven't been updated should remain the same
    expect(state.user).toMatchObject({
      name: "Aapeli Vuorinen",
      gender: "Male",
      occupation: "Mathematician",
      aboutMe: "Some generic stuff.",
      aboutPlace: "About Aapeli's place",
    });
  });

  it("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateProfileMock.mockRejectedValue(new Error("API error"));
    const { result } = renderHook(() => useAuthStore());

    expect(
      act(() =>
        result.current.authActions.updateUserProfile({
          ...defaultUser,
          languages: defaultUser.languagesList,
          countriesLived: ["Ecuador"],
          countriesVisited: defaultUser.countriesVisitedList,
        })
      )
    ).rejects.toThrow();

    expect(result.current.authState.user).toEqual(defaultUser);
  });

  it("does not try to update profile if a user does not exist in store", async () => {
    const { result } = renderHook(() => useAuthStore());
    expect(
      act(() =>
        result.current.authActions.updateUserProfile({
          ...defaultUser,
          languages: defaultUser.languagesList,
          countriesLived: defaultUser.countriesLivedList,
          countriesVisited: defaultUser.countriesVisitedList,
        })
      )
    ).rejects.toBeDefined();

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});

describe("updateHostingPreference thunk", () => {
  const newHostingPreferenceData = {
    multipleGroups: false,
    acceptsKids: false,
    acceptsPets: false,
    lastMinute: true,
    wheelchairAccessible: true,
    maxGuests: null,
    area: "",
    houseRules: "",
    smokingAllowed: 1,
    sleepingArrangement: "",
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
    getUserMock.mockResolvedValue({
      ...defaultUser,
      ...newUserPref,
    });
    const { result } = renderHook(() => useAuthStore());

    await act(() =>
      result.current.authActions.updateHostingPreferences(
        newHostingPreferenceData
      )
    );

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      newHostingPreferenceData
    );
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledWith("aapeli");
    // Things that have been updated are being reflected
    expect(result.current.authState.user).toMatchObject({
      multipleGroups: { value: false },
      acceptsKids: { value: false },
      acceptsPets: { value: false },
      lastMinute: { value: true },
      wheelchairAccessible: { value: true },
      maxGuests: { value: null },
      area: { value: "" },
      houseRules: { value: "" },
      smokingAllowed: 1,
      sleepingArrangement: { value: "" },
    });
    // Rest of profile should be the same as before
    expect(result.current.authState.user).toMatchObject(defaultUser);
  });

  it("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateHostingPreferenceMock.mockRejectedValue(new Error("API error"));
    const { result } = renderHook(() => useAuthStore());

    expect(
      act(() =>
        result.current.authActions.updateHostingPreferences(
          newHostingPreferenceData
        )
      )
    ).rejects.toThrow();

    expect(result.current.authState.user).toEqual(defaultUser);
  });

  it("does not try to update preference if a user does not exist in store", async () => {
    const { result } = renderHook(() => useAuthStore());
    expect(
      act(() =>
        result.current.authActions.updateHostingPreferences(
          newHostingPreferenceData
        )
      )
    ).rejects.toThrow();

    expect(updateHostingPreferenceMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
