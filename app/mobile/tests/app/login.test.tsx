import { act, render } from "@testing-library/react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

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

jest.mock("@/service/client", () => ({
  __esModule: true,
  default: {
    auth: {
      getAuthState: jest.fn().mockResolvedValue({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 123, jailed: false },
        }),
      }),
    },
  },
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
    // Flush the getAuthState promise in the LOGIN_SUCCESS handler
    await act(async () => {});
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);
    (useFocusEffect as jest.Mock).mockImplementation((callback) => callback());
  });

  describe("rendering", () => {
    it("renders WebView with login URL", () => {
      render(<LoginScreen />);

      expect(capturedWebViewProps.source?.uri).toContain(mockWebBaseUrl);
      expect(capturedWebViewProps.source?.uri).toContain("/login");
    });
  });

  describe("LOGIN_SUCCESS handling", () => {
    it("updates auth state on successful login", async () => {
      render(<LoginScreen />);

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 123, jailed: false });

      expect(mockAuthContext.setUserId).toHaveBeenCalledWith(123);
      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(false);
      expect(mockAuthContext.markAuthenticated).toHaveBeenCalled();
    });

    it("handles jailed user correctly", async () => {
      const mockClient = jest.requireMock("@/service/client").default;
      mockClient.auth.getAuthState.mockResolvedValueOnce({
        toObject: () => ({
          loggedIn: true,
          authRes: { userId: 456, jailed: true },
        }),
      });

      render(<LoginScreen />);

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 456, jailed: true });

      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(true);
    });

    it("navigates to dashboard after login", async () => {
      render(<LoginScreen />);

      await sendMessage({ type: "LOGIN_SUCCESS", userId: 1 });

      expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/dashboard");
    });
  });

  describe("LOGOUT handling", () => {
    it("clears auth state on logout", async () => {
      render(<LoginScreen />);

      await sendMessage({ type: "LOGOUT" });

      expect(mockAuthContext.markLoggedOut).toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    it("ignores non-JSON messages", () => {
      jest.spyOn(console, "debug").mockImplementation();

      render(<LoginScreen />);

      expect(() => {
        capturedWebViewProps.onMessage?.({
          nativeEvent: { data: "not valid json" },
        });
      }).not.toThrow();

      expect(mockAuthContext.markAuthenticated).not.toHaveBeenCalled();
    });

    it("ignores unknown message types", async () => {
      render(<LoginScreen />);

      await sendMessage({ type: "UNKNOWN" });

      expect(mockAuthContext.markAuthenticated).not.toHaveBeenCalled();
      expect(mockAuthContext.markLoggedOut).not.toHaveBeenCalled();
    });
  });
});
