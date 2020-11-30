import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import type { RootState } from "../../reducers";
import { service } from "../../service";
import { addDefaultUser } from "../../test/utils";
import { updateHostingPreference, updateUserProfile } from "./actions";

const getUserMock = service.user.getUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as jest.Mock;

describe("updateUserProfile thunk", () => {
  test("updates the store with the latest user profile info", async () => {
    addDefaultUser();
    const {
      aboutMe,
      aboutPlace,
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

    await store.dispatch(updateUserProfile(newUserProfileData));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(newUserProfileData);
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledWith("aapeli");

    const state: RootState = store.getState();
    // Things that have been updated are being reflected
    expect(state.auth.user).toMatchObject({
      city: "New York",
      hostingStatus: 3,
      languages: ["English", "Finnish", "Spanish"],
      countriesLivedList: ["Australia", "Finland", "Sweden", "United States"],
      countriesVisitedList: ["Australia", "United States"],
    });
    // Things haven't been updated should remain the same
    expect(state.auth.user).toMatchObject({
      name: "Aapeli Vuorinen",
      gender: "Male",
      occupation: "Mathematician",
      aboutMe: "Some generic stuff.",
      aboutPlace: "About Aapeli's place",
    });
  });

  test("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateProfileMock.mockRejectedValue(new Error("API error"));

    await store.dispatch(
      updateUserProfile({
        ...defaultUser,
        languages: defaultUser.languagesList,
        countriesLived: ["Ecuador"],
        countriesVisited: defaultUser.countriesVisitedList,
      })
    );

    const state: RootState = store.getState();
    expect(state.auth.user).toEqual(defaultUser);
  });

  test("does not try to update profile if a user does not exist in store", async () => {
    await store.dispatch(
      updateUserProfile({
        ...defaultUser,
        languages: defaultUser.languagesList,
        countriesLived: defaultUser.countriesLivedList,
        countriesVisited: defaultUser.countriesVisitedList,
      })
    );

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

  test("updates the store with the latest user hosting preference", async () => {
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

    await store.dispatch(updateHostingPreference(newHostingPreferenceData));

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      newHostingPreferenceData
    );
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledWith("aapeli");

    const state: RootState = store.getState();
    // Things that have been updated are being reflected
    expect(state.auth.user).toMatchObject({
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
    expect(state.auth.user).toMatchObject(defaultUser);
  });

  test("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateHostingPreferenceMock.mockRejectedValue(new Error("API error"));

    await store.dispatch(updateHostingPreference(newHostingPreferenceData));

    const state: RootState = store.getState();
    expect(state.auth.user).toEqual(defaultUser);
  });

  test("does not try to update preference if a user does not exist in store", async () => {
    await store.dispatch(updateHostingPreference(newHostingPreferenceData));

    expect(updateHostingPreferenceMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
