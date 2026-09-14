import { captureException } from "@sentry/nextjs";
import { act, renderHook } from "@testing-library/react";
import { userIdCookieName } from "appConstants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StatusCode } from "grpc-web";
import { useClearablePersistedState } from "platform/usePersistedState";
import { service } from "service";

import wrapper from "../../test/hookWrapper";
import { addDefaultUser } from "../../test/utils";
import useAuthStore from "./useAuthStore";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

const getUserMock = service.user.getUser as jest.Mock;
const getCurrentUserMock = service.user.getCurrentUser as jest.Mock;
const passwordLoginMock = service.user.passwordLogin as jest.Mock;
const getIsJailedMock = service.jail.getIsJailed as jest.Mock;
const logoutMock = service.user.logout as jest.Mock;
const getAccountInfoMock = service.account.getAccountInfo as jest.Mock;
const captureExceptionMock = captureException as jest.Mock;

// document.cookie is a plain property on jsdom's document, so a test that swaps it out leaks into every
// test after it. Install one jar for the whole file instead, rebuilt each test so resetMocks can't strip it.
let cookies = "";
let cookieSetter: jest.Mock;

beforeEach(() => {
  cookies = "";
  cookieSetter = jest.fn((value: string) => {
    cookies = value;
  });
  Object.defineProperty(document, "cookie", {
    get: () => cookies,
    set: cookieSetter,
    configurable: true,
  });
});

describe("useClearablePersistedState hook", () => {
  it("uses a default value", () => {
    const defaultValue = "Test string";
    const { result } = renderHook(() => useClearablePersistedState("key", defaultValue));
    expect(result.current[0]).toBe(defaultValue);
  });

  it("saves then loads a value", () => {
    const value = { test: "Test string" };
    const { result } = renderHook(() => useClearablePersistedState("key", { test: "" }));
    expect(result.current[0]).toStrictEqual({ test: "" });
    act(() => result.current[1](value));
    expect(result.current[0]).toStrictEqual(value);
    expect(localStorage.getItem("key")).toBe(JSON.stringify(value));
    const { result: result2 } = renderHook(() => useClearablePersistedState("key", { test: "" }));
    expect(result2.current[0]).toStrictEqual(value);
  });

  it("saves then loads a value from sessionStorage", () => {
    const value = { test: "session test" };
    const { result } = renderHook(() => useClearablePersistedState("key", { test: "" }, "sessionStorage"));
    expect(result.current[0]).toStrictEqual({ test: "" });
    act(() => result.current[1](value));
    expect(result.current[0]).toStrictEqual(value);
    expect(sessionStorage.getItem("key")).toBe(JSON.stringify(value));
    const { result: result2 } = renderHook(() => useClearablePersistedState("key", { test: "" }, "sessionStorage"));
    expect(result2.current[0]).toStrictEqual(value);
  });

  it("clears a value", () => {
    const { result } = renderHook(() => useClearablePersistedState("key", { test: "" }, "sessionStorage"));
    expect(result.current[0]).toStrictEqual({ test: "" });
    act(() => result.current[2]());
    expect(result.current[0]).toStrictEqual(undefined);
    expect(sessionStorage.getItem("key")).toBe(null);
  });
});

describe("useAuthStore hook", () => {
  it("sets and clears an error", async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    act(() => result.current.authActions.authError("error1"));
    expect(result.current.authState.error).toBe("error1");
    act(() => result.current.authActions.clearError());
    expect(result.current.authState.error).toBeNull();
  });

  it("logs out", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(true);
    await act(() => result.current.authActions.logout());
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBeNull();
    expect(result.current.authState.userId).toBeNull();
  });

  it("clears sessionStorage on logout", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(true);
    sessionStorage.setItem("test key", "test value");
    expect(sessionStorage.length).toBe(1);
    await act(() => result.current.authActions.logout());
    expect(sessionStorage.length).toBe(0);
  });
});

describe("passwordLogin action", () => {
  it("sets authenticated correctly", async () => {
    passwordLoginMock.mockResolvedValue({ userId: 1, jailed: false });
    getUserMock.mockResolvedValue(defaultUser);
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "en" });
    const { result } = renderHook(() => useAuthStore(), {
      wrapper,
    });
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );
    expect(result.current.authState.authenticated).toBe(true);
  });

  it("sets NEXT_LOCALE cookie from user's language preference after login", async () => {
    passwordLoginMock.mockResolvedValue({ userId: 1, jailed: false });
    getUserMock.mockResolvedValue(defaultUser);
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "es" });

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );

    expect(cookieSetter).toHaveBeenCalledWith("NEXT_LOCALE=es; path=/; max-age=31536000; samesite=lax");
  });

  it("does not update NEXT_LOCALE cookie if it matches user's language preference", async () => {
    passwordLoginMock.mockResolvedValue({ userId: 1, jailed: false });
    getUserMock.mockResolvedValue(defaultUser);
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "fr" });

    cookies = "NEXT_LOCALE=fr";

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );

    // Cookie should not be set since it already matches
    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it("handles syncLanguagePreference errors gracefully", async () => {
    passwordLoginMock.mockResolvedValue({ userId: 1, jailed: false });
    getUserMock.mockResolvedValue(defaultUser);
    getAccountInfoMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    // Should still authenticate even if language sync fails
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );

    expect(result.current.authState.authenticated).toBe(true);
  });

  it("sets error correctly for login fail", async () => {
    passwordLoginMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid username or password.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe("Invalid username or password.");
  });

  it("does not report wrong username/password to Sentry", async () => {
    passwordLoginMock.mockRejectedValue({
      code: StatusCode.NOT_FOUND,
      message: "Wrong username/email or password.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );
    expect(result.current.authState.error).toBe("Wrong username/email or password.");
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("does not report account not found to Sentry", async () => {
    passwordLoginMock.mockRejectedValue({
      code: StatusCode.NOT_FOUND,
      message: "An account with that username or email was not found.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );
    expect(result.current.authState.error).toBe("An account with that username or email was not found.");
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("still reports unexpected login errors to Sentry", async () => {
    passwordLoginMock.mockRejectedValue({
      code: StatusCode.UNKNOWN,
      message: "Something went wrong.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
        rememberDevice: true,
      }),
    );
    expect(result.current.authState.error).toBe("Something went wrong.");
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });
});

describe("firstLogin action", () => {
  it("sets state correctly", async () => {
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "en" });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(null);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.firstLogin({
        userId: 55,
        jailed: false,
      }),
    );
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(55);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(true);
  });

  it("sets NEXT_LOCALE cookie from user's language preference on first login", async () => {
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "de" });

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(() =>
      result.current.authActions.firstLogin({
        userId: 55,
        jailed: false,
      }),
    );

    expect(cookieSetter).toHaveBeenCalledWith("NEXT_LOCALE=de; path=/; max-age=31536000; samesite=lax");
  });
});

describe("updateSignupState action", () => {
  it("sets state correctly if in progress", async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(null);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);
    await act(() =>
      result.current.authActions.updateSignupState({
        flowToken: "dummy-token",
        email: "test@example.com",
        needBasic: false,
        needAccount: true,
        needFeedback: false,
        needVerifyEmail: true,
        needMotivations: true,
        needAcceptCommunityGuidelines: true,
      }),
    );
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(null);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState?.flowToken).toBe("dummy-token");
  });

  it("sets state correctly if success", async () => {
    getAccountInfoMock.mockResolvedValue({ uiLanguagePreference: "en" });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(null);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);
    await act(() =>
      result.current.authActions.updateSignupState({
        flowToken: "",
        authRes: {
          userId: 51,
          jailed: false,
        },
        email: "test@example.com",
        needBasic: false,
        needAccount: false,
        needFeedback: false,
        needVerifyEmail: false,
        needMotivations: false,
        needAcceptCommunityGuidelines: false,
      }),
    );
    expect(result.current.authState.error).toBe(null);
    expect(result.current.authState.userId).toBe(51);
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(true);
    expect(result.current.authState.flowState).toBe(null);
  });
});

describe("updateJailStatus action", () => {
  it("sets jailed to true for jailed user", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: true });
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(true);
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets jailed to false for non-jailed user", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: false, user: defaultUser });
    getCurrentUserMock.mockResolvedValue({});
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(true);
  });
});

describe("session cookie fallback", () => {
  it("signs in from the session cookie when localStorage has been cleared", () => {
    cookies = `${userIdCookieName}=42`;
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(true);
    expect(result.current.authState.userId).toBe(42);
  });

  it("stays signed out when there is no session cookie", () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.userId).toBeNull();
  });

  it("ignores a malformed session cookie", () => {
    cookies = `${userIdCookieName}=not-a-user-id`;
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.userId).toBeNull();
  });

  it("doesn't undo an explicit logout", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();
    cookies = `${userIdCookieName}=${defaultUser.userId}`;
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() => result.current.authActions.logout());
    expect(result.current.authState.authenticated).toBe(false);

    const { result: afterReload } = renderHook(() => useAuthStore(), { wrapper });
    expect(afterReload.current.authState.authenticated).toBe(false);
  });

  it("stays signed in when the cookie isn't readable", () => {
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(true);
    expect(result.current.authState.userId).toBe(defaultUser.userId);
  });
});
