import { act, renderHook } from "@testing-library/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StatusCode } from "grpc-web";
import { usePersistedState } from "platform/usePersistedState";
import { service } from "service";

import wrapper from "../../test/hookWrapper";
import { addDefaultUser } from "../../test/utils";
import useAuthStore from "./useAuthStore";

const getUserMock = service.user.getUser as jest.Mock;
const getCurrentUserMock = service.user.getCurrentUser as jest.Mock;
const passwordLoginMock = service.user.passwordLogin as jest.Mock;
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
      usePersistedState("key", { test: "" }),
    );
    expect(result2.current[0]).toStrictEqual(value);
  });

  it("saves then loads a value from sessionStorage", () => {
    const value = { test: "session test" };
    const { result } = renderHook(() =>
      usePersistedState("key", { test: "" }, "sessionStorage"),
    );
    expect(result.current[0]).toStrictEqual({ test: "" });
    act(() => result.current[1](value));
    expect(result.current[0]).toStrictEqual(value);
    expect(sessionStorage.getItem("key")).toBe(JSON.stringify(value));
    const { result: result2 } = renderHook(() =>
      usePersistedState("key", { test: "" }, "sessionStorage"),
    );
    expect(result2.current[0]).toStrictEqual(value);
  });

  it("clears a value", () => {
    const { result } = renderHook(() =>
      usePersistedState("key", { test: "" }, "sessionStorage"),
    );
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
    expect(result.current.authState.error).toBe(
      "Invalid username or password.",
    );
  });
});

describe("firstLogin action", () => {
  it("sets state correctly", async () => {
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
        needBasic: false,
        needAccount: true,
        needFeedback: true,
        needVerifyEmail: true,
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
        needBasic: false,
        needAccount: false,
        needFeedback: false,
        needVerifyEmail: false,
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
