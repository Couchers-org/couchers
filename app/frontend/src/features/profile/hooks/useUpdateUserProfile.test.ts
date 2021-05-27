import { act, renderHook } from "@testing-library/react-hooks";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { User } from "pb/api_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

const getUserMock = service.user.getUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;

jest.mock("features/userQueries/useCurrentUser");

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

describe("updateUserProfile action", () => {
  it("updates the store with the latest user profile info", async () => {
    addDefaultUser();
    const {
      aboutMe,
      aboutPlace,
      additionalInformation,
      avatarUrl,
      radius,
      countriesLivedList,
      countriesVisitedList,
      education,
      gender,
      hometown,
      meetupStatus,
      myTravels,
      name,
      occupation,
      pronouns,
      thingsILike,
    } = defaultUser;
    /* eslint-disable sort-keys */
    const newUserProfileData = {
      // Unchanged data
      aboutMe,
      aboutPlace,
      additionalInformation,
      avatarKey: avatarUrl,
      countriesLived: countriesLivedList,
      education,
      gender,
      hometown,
      meetupStatus,
      myTravels,
      name,
      occupation,
      pronouns,
      thingsILike,

      // Changed data
      countriesVisited: [...countriesVisitedList, "United States"],
      city: "New York",
      hostingStatus: 3,
      lat: 40.7306,
      lng: -73.9352,
      radius,
      languages: ["English", "Finnish", "Spanish"],
    };
    /* eslint-enable sort-keys */
    updateProfileMock.mockResolvedValue(new Empty());

    const { result, waitFor } = renderHook(() => useUpdateUserProfile(), {
      wrapper,
    });

    act(() =>
      result.current.updateUserProfile({
        profileData: newUserProfileData,
        setMutationError: () => null,
      })
    );

    await waitFor(() => result.current.status === "success");

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(newUserProfileData);
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
          countriesLived: ["Ecuador"],
          countriesVisited: defaultUser.countriesVisitedList,
          languages: defaultUser.languagesList,
          avatarKey: defaultUser.avatarUrl,
        },
        setMutationError: setError,
      })
    );
    await waitFor(() => result.current.mutate.status === "error");

    expect(setError).toBeCalledWith("API error");
    expect(setError).toBeCalledTimes(2);
  });
});
