import { renderHook } from "@testing-library/react-hooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StatusCode } from "grpc-web";
import { act } from "react-test-renderer";
import { service, SignupArguments } from "../../service";
import { addDefaultUser } from "../../test/utils";
import useAuthStore, { usePersistedState } from "./useAuthStore";

const getUserMock = service.user.getUser as jest.Mock;
const getCurrentUserMock = service.user.getCurrentUser as jest.Mock;
const updateProfileMock = service.user.updateProfile as jest.Mock;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as jest.Mock;
const passwordLoginMock = service.user.passwordLogin as jest.Mock;
const tokenLoginMock = service.user.tokenLogin as jest.Mock;
const signupMock = service.user.completeSignup as jest.Mock;
const getIsJailedMock = service.jail.getIsJailed as jest.Mock;
const logoutMock = service.user.logout as jest.Mock;

describe("usePersistedState hook", () => {
  it("uses a default value", () => {
    const defaultValue = "Test string";
    const { result } = renderHook(() => usePersistedState("key", defaultValue));
    expect(result.current[0]).toBe(defaultValue);
  });

  it("saves then loads a value", () => {
    const value = { test: "Test string" };
    const { result } = renderHook(() => usePersistedState("key", { test: "" }));
    expect(result.current[0]).toStrictEqual({ test: "" });
    act(() => result.current[1](value));
    expect(result.current[0]).toStrictEqual(value);
    expect(localStorage.getItem("key")).toBe(JSON.stringify(value));
    const { result: result2 } = renderHook(() =>
      usePersistedState("key", { test: "" })
    );
    expect(result2.current[0]).toStrictEqual(value);
  });
});

describe("useAuthStore hook", () => {
  it("sets and clears an error", async () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.authActions.authError("error1"));
    expect(result.current.authState.error).toBe("error1");
    act(() => result.current.authActions.clearError());
    expect(result.current.authState.error).toBeNull();
  });

  it("logs out", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(true);
    await act(() => result.current.authActions.logout());
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBeNull();
    expect(result.current.authState.user).toBeNull();
  });
});

describe("passwordLogin action", () => {
  it("sets authenticated correctly", async () => {
    passwordLoginMock.mockResolvedValue({ jailed: false });
    getUserMock.mockResolvedValue(null);
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.passwordLogin({
        username: "user",
        password: "pass",
      })
    );
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets error correctly for login fail", async () => {
    passwordLoginMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid username or password.",
    });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.passwordLogin({
        username: "user",
        password: "pass",
      })
    );
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe(
      "Invalid username or password."
    );
  });
});

describe("tokenLogin action", () => {
  it("sets authenticated correctly", async () => {
    tokenLoginMock.mockResolvedValue({ jailed: false });
    getCurrentUserMock.mockResolvedValue(null);
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.tokenLogin("token"));
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets error correctly for login fail", async () => {
    tokenLoginMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid token.",
    });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.tokenLogin("token"));
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe("Invalid token.");
  });
});

describe("signup action", () => {
  //not testing for the user itself, as that is handled by getUser
  //and getCurrentUser
  it("sets authenticated correctly", async () => {
    signupMock.mockResolvedValue({ jailed: false });
    getCurrentUserMock.mockResolvedValue(null);
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.signup({} as SignupArguments));
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets error correctly for login fail", async () => {
    signupMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid token.",
    });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.signup({} as SignupArguments));
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe("Invalid token.");
  });
});

describe("updateJailStatus action", () => {
  it("sets jailed to true for jailed user", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: true });
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(true);
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets jailed to false for non-jailed user", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: false });
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(true);
  });
});

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
    const { result } = renderHook(() => useAuthStore());

    await act(() =>
      result.current.profileActions.updateUserProfile(newUserProfileData)
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
      lat: 40.7306,
      lng: -73.9352,
    });
    // Things haven't been updated should remain the same
    expect(state.user).toMatchObject({
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
    const { result } = renderHook(() => useAuthStore());

    expect(
      act(() =>
        result.current.profileActions.updateUserProfile({
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
        result.current.profileActions.updateUserProfile({
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

describe("updateHostingPreference action", () => {
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
      result.current.profileActions.updateHostingPreferences(
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
        result.current.profileActions.updateHostingPreferences(
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
        result.current.profileActions.updateHostingPreferences(
          newHostingPreferenceData
        )
      )
    ).rejects.toThrow();

    expect(updateHostingPreferenceMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
