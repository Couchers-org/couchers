import type { RootState } from "../../reducers";
import { service } from "../../service";
import { updateUserProfile } from "./actions";

const getUserMock = service.user.getUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;

describe("updateUserProfile thunk", () => {
  test("updates the store with the latest user profile info", async () => {
    const newUserProfileData = {
      ...defaultUser,
      city: "New York",
      hostingStatus: 3,
      languages: ["English", "Finnish", "Spanish"],
      countriesVisited: [...defaultUser.countriesVisitedList, "United States"],
      countriesLived: defaultUser.countriesLivedList,
    };
    updateProfileMock.mockResolvedValue(undefined);
    getUserMock.mockResolvedValue({
      ...newUserProfileData,
      countriesVisitedList: newUserProfileData.countriesVisited,
    });

    await store.dispatch(updateUserProfile(newUserProfileData));

    const state: RootState = store.getState();

    // Things that have been updated
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
    expect(state.auth.user).toMatchObject(defaultUser);
  });
});
