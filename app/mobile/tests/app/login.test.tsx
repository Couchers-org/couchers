import { render, waitFor } from "@testing-library/react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { act } from "react";

import LoginScreen from "@/app/login";
import { useAuthContext } from "@/features/auth/AuthContext";

const mockWebBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: jest.fn(),
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

let capturedWebViewProps: {
  source?: { uri: string };
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
} = {};

jest.mock("react-native-webview", () => ({
  WebView: jest.fn((props) => {
    capturedWebViewProps = props;
    return null;
  }),
}));

describe("LoginScreen", () => {
  const mockRouter = { replace: jest.fn() };

  const mockAuthContext = {
    markAuthenticated: jest.fn(),
    markLoggedOut: jest.fn(),
    setUserId: jest.fn(),
    setJailed: jest.fn(),
  };

  const sendMessage = async (data: object) => {
    await act(async () => {
      capturedWebViewProps.onMessage?.({
        nativeEvent: { data: JSON.stringify(data) },
      });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedWebViewProps = {};
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);
    (useFocusEffect as jest.Mock).mockImplementation((callback) => callback());
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
  });

  describe("rendering", () => {
    it("renders WebView with login URL when no deep link", async () => {
      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toContain(mockWebBaseUrl);
        expect(capturedWebViewProps.source?.uri).toContain("/login");
      });
    });

    it("renders WebView with signup URL when opened via signup deep link", async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(
        "https://couchers.org/signup?token=abc123",
      );

      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toBe(
          mockWebBaseUrl + "/signup?token=abc123",
        );
      });
    });

    it("renders WebView with confirm-email URL when opened via confirm-email deep link", async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(
        "https://couchers.org/confirm-email?token=xyz789",
      );

      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toBe(
          mockWebBaseUrl + "/confirm-email?token=xyz789",
        );
      });
    });

    it("renders WebView with password reset URL when opened via password reset deep link", async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(
        "https://couchers.org/complete-password-reset?token=reset456",
      );

      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toBe(
          mockWebBaseUrl + "/complete-password-reset?token=reset456",
        );
      });
    });

    it("falls back to login URL for non-auth deep links", async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(
        "https://couchers.org/profile/someuser",
      );

      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toContain("/login");
      });
    });
  });

  describe("runtime deep link handling", () => {
    it("reloads WebView when a deep link arrives while mounted", async () => {
      let urlListener: ((event: { url: string }) => void) | undefined;
      (Linking.addEventListener as jest.Mock).mockImplementation(
        (_event: string, callback: (event: { url: string }) => void) => {
          urlListener = callback;
          return { remove: jest.fn() };
        },
      );

      render(<LoginScreen />);

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toContain("/login");
      });

      // Simulate deep link arriving
      act(() => {
        urlListener?.({ url: "https://couchers.org/signup?token=late123" });
      });

      await waitFor(() => {
        expect(capturedWebViewProps.source?.uri).toBe(
          mockWebBaseUrl + "/signup?token=late123",
        );
      });
    });
  });

  describe("LOGIN_SUCCESS handling", () => {
    it("updates auth state on successful login", async () => {
      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 123, jailed: false });

      expect(mockAuthContext.setUserId).toHaveBeenCalledWith(123);
      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(false);
      expect(mockAuthContext.markAuthenticated).toHaveBeenCalled();
    });

    it("handles jailed user correctly", async () => {
      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 456, jailed: true });

      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(true);
    });

    it("navigates to dashboard after login", async () => {
      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 1 });

      expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/dashboard");
    });
  });

  describe("LOGOUT handling", () => {
    it("clears auth state on logout", async () => {
      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      await sendMessage({ type: "LOGOUT" });

      expect(mockAuthContext.markLoggedOut).toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    it("ignores non-JSON messages", async () => {
      jest.spyOn(console, "debug").mockImplementation();

      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      expect(() => {
        capturedWebViewProps.onMessage?.({
          nativeEvent: { data: "not valid json" },
        });
      }).not.toThrow();

      expect(mockAuthContext.markAuthenticated).not.toHaveBeenCalled();
    });

    it("ignores unknown message types", async () => {
      render(<LoginScreen />);
      await waitFor(() => {
        expect(capturedWebViewProps.onMessage).toBeDefined();
      });

      await sendMessage({ type: "UNKNOWN" });

      expect(mockAuthContext.markAuthenticated).not.toHaveBeenCalled();
      expect(mockAuthContext.markLoggedOut).not.toHaveBeenCalled();
    });
  });
});
