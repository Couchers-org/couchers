import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";

import client from "@/service/client";
import {
  AuthProvider,
  LAST_AUTH_STATE_KEY,
  useAuthContext,
} from "@/features/auth/AuthContext";

jest.mock("@/service/client", () => ({
  auth: {
    getAuthState: jest.fn(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // Default: not logged in
    (client.auth.getAuthState as jest.Mock).mockResolvedValue({
      toObject: () => ({ loggedIn: false }),
    });
  });

  describe("useAuthContext", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useAuthContext());
      }).toThrow("useAuthContext must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("initial state", () => {
    it("starts with not authenticated and checking status", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.checkedAuthStatus).toBe(false);

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });
    });
  });

  describe("authentication state", () => {
    it("sets authenticated state when backend returns valid session", async () => {
      (client.auth.getAuthState as jest.Mock).mockResolvedValue({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 123, jailed: false },
        }),
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      expect(result.current.userId).toBe(123);
      expect(result.current.jailed).toBe(false);
    });

    it("handles jailed user state", async () => {
      (client.auth.getAuthState as jest.Mock).mockResolvedValue({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 456, jailed: true },
        }),
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.jailed).toBe(true);
      });
    });

    it("stays unauthenticated when backend returns not logged in", async () => {
      (client.auth.getAuthState as jest.Mock).mockResolvedValue({
        toObject: () => ({ loggedIn: false }),
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.userId).toBe(null);
    });

    it("handles network errors gracefully", async () => {
      (client.auth.getAuthState as jest.Mock).mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      expect(result.current.authenticated).toBe(false);
    });
  });

  describe("offline startup", () => {
    const storeAuthState = (state: object) =>
      AsyncStorage.setItem(LAST_AUTH_STATE_KEY, JSON.stringify(state));

    it("remembers the logged in user", async () => {
      (client.auth.getAuthState as jest.Mock).mockResolvedValue({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 123, jailed: false },
        }),
      });

      renderHook(() => useAuthContext(), { wrapper });

      await waitFor(async () => {
        expect(
          JSON.parse((await AsyncStorage.getItem(LAST_AUTH_STATE_KEY))!),
        ).toEqual({ userId: 123, jailed: false });
      });
    });

    it("stays logged in when the backend can't be reached", async () => {
      await storeAuthState({ userId: 123, jailed: true });
      (client.auth.getAuthState as jest.Mock).mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });
      expect(result.current.checkedAuthStatus).toBe(true);
      expect(result.current.userId).toBe(123);
      expect(result.current.jailed).toBe(true);
    });

    it("doesn't wait for the backend before showing the app", async () => {
      await storeAuthState({ userId: 123, jailed: false });
      (client.auth.getAuthState as jest.Mock).mockReturnValue(
        new Promise(() => {}),
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });
      expect(result.current.authenticated).toBe(true);
    });

    it("logs out when the backend says the session is no longer valid", async () => {
      await storeAuthState({ userId: 123, jailed: false });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(async () => {
        expect(await AsyncStorage.getItem(LAST_AUTH_STATE_KEY)).toBeNull();
      });
      expect(result.current.authenticated).toBe(false);
      expect(result.current.userId).toBe(null);
    });
  });

  describe("markAuthenticated", () => {
    it("sets authenticated to true", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      act(() => {
        result.current.markAuthenticated();
      });

      expect(result.current.authenticated).toBe(true);
    });
  });

  describe("markLoggedOut", () => {
    it("clears authentication state", async () => {
      (client.auth.getAuthState as jest.Mock).mockResolvedValue({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 123, jailed: false },
        }),
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      await act(async () => {
        await result.current.markLoggedOut();
      });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.userId).toBe(null);
      expect(result.current.jailed).toBe(false);
    });
  });

  describe("setUserId", () => {
    it("updates userId state", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      act(() => {
        result.current.setUserId(789);
      });

      expect(result.current.userId).toBe(789);
    });
  });

  describe("setJailed", () => {
    it("updates jailed state", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      act(() => {
        result.current.setJailed(true);
      });

      expect(result.current.jailed).toBe(true);
    });
  });
});
