import { renderHook } from "@testing-library/react-hooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { StatusCode } from "grpc-web";
import { act } from "react-test-renderer";

import { service, SignupArguments } from "../../service";
import wrapper from "../../test/hookWrapper";
import { addDefaultUser } from "../../test/utils";
import useAuthStore, { usePersistedState } from "./useAuthStore";

const getUserMock = service.user.getUser as jest.Mock;
const getCurrentUserMock = service.user.getCurrentUser as jest.Mock;
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
});

describe("passwordLogin action", () => {
  it("sets authenticated correctly", async () => {
    passwordLoginMock.mockResolvedValue({ jailed: false });
    getUserMock.mockResolvedValue(defaultUser);
    const { result } = renderHook(() => useAuthStore(), {
      wrapper,
    });
    expect(result.current.authState.authenticated).toBe(false);
    await act(() =>
      result.current.authActions.passwordLogin({
        password: "pass",
        username: "user",
      })
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
    getCurrentUserMock.mockResolvedValue(defaultUser);
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.tokenLogin("token"));
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets error correctly for login fail", async () => {
    tokenLoginMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid token.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
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
    getCurrentUserMock.mockResolvedValue(defaultUser);
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    await act(() => result.current.authActions.signup({} as SignupArguments));
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets error correctly for login fail", async () => {
    signupMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Invalid token.",
    });
    const { result } = renderHook(() => useAuthStore(), { wrapper });
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
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(true);
    expect(result.current.authState.authenticated).toBe(true);
  });
  it("sets jailed to false for non-jailed user", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: false });
    getCurrentUserMock.mockResolvedValue({});
    addDefaultUser();
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await act(() => result.current.authActions.updateJailStatus());
    expect(result.current.authState.jailed).toBe(false);
    expect(result.current.authState.authenticated).toBe(true);
  });
});
