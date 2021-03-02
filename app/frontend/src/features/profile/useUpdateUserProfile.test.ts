import { renderHook } from "@testing-library/react-hooks";
import useUpdateUserProfile from "features/profile/useUpdateUserProfile";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { act } from "react-test-renderer";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

const getUserMock = service.user.getUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;

describe("updateUserProfile action", () => {
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
    const { result, waitFor } = renderHook(
      () => ({
        mutate: useUpdateUserProfile(),
        currentUser: useCurrentUser(),
      }),
      { wrapper }
    );

    act(() =>
      result.current.mutate.updateUserProfile({
        profileData: newUserProfileData,
        setMutationError: () => null,
      })
    );

    await waitFor(() => result.current.mutate.status === "success");

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(newUserProfileData);
    //once for getCurrentUser then once for invalidation
    expect(getUserMock).toHaveBeenCalledTimes(2);
    expect(getUserMock).toHaveBeenCalledWith(`${defaultUser.userId}`);

    const currentUser = result.current.currentUser.data;

    // Things that have been updated are being reflected
    expect(currentUser).toMatchObject({
      city: "New York",
      hostingStatus: 3,
      languages: ["English", "Finnish", "Spanish"],
      countriesLivedList: ["Australia", "Finland", "Sweden", "United States"],
      countriesVisitedList: ["Australia", "United States"],
      lat: 40.7306,
      lng: -73.9352,
    });
    // Things haven't been updated should remain the same
    expect(currentUser).toMatchObject({
      name: "Aapeli Vuorinen",
      gender: "Male",
      occupation: "Mathematician",
      aboutMe: "Some generic stuff.",
      aboutPlace: "About Aapeli's place",
      radius: 200,
    });
  });

  it("does not update the existing user if the API call failed", async () => {
    addDefaultUser();
    updateProfileMock.mockRejectedValue(new Error("API error"));
    jest.spyOn(console, "error").mockReturnValue(undefined);
    getUserMock.mockResolvedValue(defaultUser);
    const setError = jest.fn();

    const { result, waitFor } = renderHook(
      () => ({
        mutate: useUpdateUserProfile(),
      }),
      { wrapper }
    );

    act(() =>
      result.current.mutate.updateUserProfile({
        profileData: {
          ...defaultUser,
          languages: defaultUser.languagesList,
          countriesLived: ["Ecuador"],
          countriesVisited: defaultUser.countriesVisitedList,
        },
        setMutationError: setError,
      })
    );
    await waitFor(() => result.current.mutate.status === "error");

    expect(setError).toBeCalledWith("API error");
    expect(setError).toBeCalledTimes(2);
  });
});
