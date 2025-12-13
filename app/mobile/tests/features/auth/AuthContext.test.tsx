import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { ReactNode } from "react";

import client from "@/service/client";
import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/service/client", () => ({
  auth: {
    getAuthState: jest.fn(),
  },
}));

// Note: expo-local-authentication uses dynamic import() in AuthContext
// which Jest cannot mock with jest.mock(). The biometric authentication
// flow is better tested with E2E tests (e.g., Maestro, Detox).
// These unit tests focus on state management and SecureStore interactions.

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    // Default: not logged in, no stored preferences
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
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

    it("checks stored biometrics preference on mount", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(
        (key: string) => {
          if (key === "biometrics_enabled") return Promise.resolve("true");
          if (key === "secure_login_enabled") return Promise.resolve("true");
          return Promise.resolve(null);
        },
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        "biometrics_enabled",
      );
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        "secure_login_enabled",
      );
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

  describe("enableBiometrics", () => {
    it("stores biometrics and secure login preferences", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      await act(async () => {
        await result.current.enableBiometrics();
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "biometrics_enabled",
        "true",
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "secure_login_enabled",
        "true",
      );
      expect(result.current.biometricsEnabled).toBe(true);
      expect(result.current.secureLoginEnabled).toBe(true);
    });
  });

  describe("enableSecureLogin", () => {
    it("stores secure login preference only", async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      await act(async () => {
        await result.current.enableSecureLogin();
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "secure_login_enabled",
        "true",
      );
      expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
        "biometrics_enabled",
        "true",
      );
      expect(result.current.secureLoginEnabled).toBe(true);
    });
  });

  describe("disableBiometrics", () => {
    it("removes stored preferences", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(
        (key: string) => {
          if (key === "biometrics_enabled") return Promise.resolve("true");
          if (key === "secure_login_enabled") return Promise.resolve("true");
          return Promise.resolve(null);
        },
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      await act(async () => {
        await result.current.disableBiometrics();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "biometrics_enabled",
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "secure_login_enabled",
      );
      expect(result.current.biometricsEnabled).toBe(false);
      expect(result.current.secureLoginEnabled).toBe(false);
    });
  });

  describe("biometricsAvailable", () => {
    it("is false when native module unavailable (e.g., Expo Go, Jest)", async () => {
      // In Jest, dynamic import() for expo-local-authentication fails
      // This mirrors real behavior in Expo Go where native modules aren't available
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.checkedAuthStatus).toBe(true);
      });

      expect(result.current.biometricsAvailable).toBe(false);
    });
  });
});
