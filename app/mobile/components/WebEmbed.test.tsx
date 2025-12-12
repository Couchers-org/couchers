import { act, render, screen, userEvent } from "@testing-library/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/features/auth/AuthContext";

import WebEmbed from "./WebEmbed";

jest.useFakeTimers();

const mockWebBaseUrl = "https://couchers.org";
process.env.EXPO_PUBLIC_WEB_BASE_URL = mockWebBaseUrl;

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: jest.fn(),
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

// WebView mock - captures props and ref methods for test assertions
const mockWebViewRef = {
  reload: jest.fn(),
  stopLoading: jest.fn(),
  injectJavaScript: jest.fn(),
};

let capturedWebViewProps: {
  source?: { uri: string };
  onNavigationStateChange?: (navState: {
    url: string;
    loading: boolean;
  }) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onError?: (event: { nativeEvent: unknown }) => void;
} = {};

jest.mock("react-native-webview", () => {
  const React = jest.requireActual("react");
  return {
    WebView: React.forwardRef(function MockWebView(
      props: typeof capturedWebViewProps,
      ref: React.Ref<typeof mockWebViewRef>,
    ) {
      capturedWebViewProps = props;
      React.useImperativeHandle(ref, () => mockWebViewRef);
      return null;
    }),
  };
});

beforeEach(() => {
  capturedWebViewProps = {};
  jest.clearAllMocks();
});

describe("WebEmbed", () => {
  const mockRouter = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  const mockAuthContext = {
    markLoggedOut: jest.fn(),
    setUserId: jest.fn(),
    setJailed: jest.fn(),
    markAuthenticated: jest.fn(),
  };

  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });
    (useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);
    (useFocusEffect as jest.Mock).mockImplementation((callback) => callback());
  });

  describe("rendering", () => {
    it("renders WebView with correct URL", () => {
      render(<WebEmbed path="/dashboard" />);

      expect(capturedWebViewProps.source?.uri).toBe(
        `${mockWebBaseUrl}/dashboard`,
      );
    });

    it("renders with different paths", () => {
      const { rerender } = render(<WebEmbed path="/messages" />);

      expect(capturedWebViewProps.source?.uri).toBe(
        `${mockWebBaseUrl}/messages`,
      );

      rerender(<WebEmbed path="/search" />);
      expect(capturedWebViewProps.source?.uri).toBe(`${mockWebBaseUrl}/search`);
    });
  });

  describe("navigation state changes", () => {
    it("navigates to messages tab when WebView navigates to /messages", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
      });

      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages");
    });

    it("navigates to search tab when WebView navigates to /search", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/search`,
        loading: false,
      });

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("navigates to communities tab when WebView navigates to /communities", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/communities`,
        loading: false,
      });

      expect(mockRouter.navigate).toHaveBeenCalledWith("/communities");
    });

    it("navigates to non-tab routes correctly", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/user/123`,
        loading: false,
      });

      expect(mockRouter.navigate).toHaveBeenCalledWith("/user/123");
    });

    it("does not navigate when URL is still loading", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/messages`,
        loading: true,
      });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("does not navigate when staying on the same tab", () => {
      render(<WebEmbed path="/messages" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/messages/123`,
        loading: false,
      });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("strips hash fragments from URL", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/search#10/40.7127/-74.006`,
        loading: false,
      });

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("stops loading for external URLs", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: "https://external-site.com/page",
        loading: false,
      });

      expect(mockWebViewRef.stopLoading).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    it("handles LOGIN_SUCCESS message", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: "LOGIN_SUCCESS",
            userId: 123,
            jailed: false,
          }),
        },
      });

      expect(mockAuthContext.setUserId).toHaveBeenCalledWith(123);
      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(false);
      expect(mockAuthContext.markAuthenticated).toHaveBeenCalled();
    });

    it("handles LOGIN_SUCCESS message with jailed user", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: "LOGIN_SUCCESS",
            userId: 456,
            jailed: true,
          }),
        },
      });

      expect(mockAuthContext.setUserId).toHaveBeenCalledWith(456);
      expect(mockAuthContext.setJailed).toHaveBeenCalledWith(true);
      expect(mockAuthContext.markAuthenticated).toHaveBeenCalled();
    });

    it("handles LOGOUT message", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({ type: "LOGOUT" }),
        },
      });

      expect(mockAuthContext.markLoggedOut).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/login");
    });

    it("ignores non-JSON messages", () => {
      const originalConsoleDebug = console.debug;
      console.debug = jest.fn();

      render(<WebEmbed path="/dashboard" />);

      expect(() => {
        capturedWebViewProps.onMessage?.({
          nativeEvent: {
            data: "not valid json",
          },
        });
      }).not.toThrow();

      expect(mockAuthContext.markLoggedOut).not.toHaveBeenCalled();
      expect(mockAuthContext.setUserId).not.toHaveBeenCalled();

      console.debug = originalConsoleDebug;
    });

    it("ignores unknown message types", () => {
      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({ type: "UNKNOWN_TYPE" }),
        },
      });

      expect(mockAuthContext.markLoggedOut).not.toHaveBeenCalled();
      expect(mockAuthContext.setUserId).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    const originalConsoleError = console.error;
    beforeEach(() => (console.error = jest.fn()));
    afterEach(() => (console.error = originalConsoleError));

    it("shows error screen when WebView has error", async () => {
      render(<WebEmbed path="/dashboard" />);

      await act(async () => {
        capturedWebViewProps.onError?.({ nativeEvent: { code: -1 } });
      });

      expect(screen.getByText("Failed to load")).toBeTruthy();
      expect(
        screen.getByText("Check your internet connection and try again."),
      ).toBeTruthy();
    });

    it("allows retry after error", async () => {
      render(<WebEmbed path="/dashboard" />);

      await act(async () => {
        capturedWebViewProps.onError?.({ nativeEvent: { code: -1 } });
      });

      expect(screen.getByText("Failed to load")).toBeTruthy();

      await user.press(screen.getByRole("button", { name: "Try Again" }));

      expect(screen.queryByText("Failed to load")).toBeNull();
    });
  });

  describe("focus effect", () => {
    it("navigates WebView back to expected path when drifted", () => {
      let focusCallback: (() => void) | undefined;
      (useFocusEffect as jest.Mock).mockImplementation(
        (callback: () => void) => (focusCallback = callback),
      );

      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onNavigationStateChange?.({
        url: `${mockWebBaseUrl}/messages/123`,
        loading: false,
      });

      mockWebViewRef.injectJavaScript.mockClear();

      expect(focusCallback).toBeDefined();
      focusCallback!();

      expect(mockWebViewRef.injectJavaScript).toHaveBeenCalledWith(
        `window.location.href = "${mockWebBaseUrl}/dashboard"; true;`,
      );
    });
  });

  describe("tab mapping", () => {
    const testCases = [
      { webPath: "/dashboard", expectedTab: "dashboard" },
      { webPath: "/dashboard/settings", expectedTab: "dashboard" },
      { webPath: "/messages", expectedTab: "messages" },
      { webPath: "/messages/123", expectedTab: "messages" },
      { webPath: "/search", expectedTab: "search" },
      { webPath: "/search?query=test", expectedTab: "search" },
      { webPath: "/communities", expectedTab: "communities" },
      { webPath: "/communities/456", expectedTab: "communities" },
      { webPath: "/user/789", expectedTab: null },
      { webPath: "/events", expectedTab: null },
    ];

    testCases.forEach(({ webPath, expectedTab }) => {
      it(`maps ${webPath} to tab: ${expectedTab}`, () => {
        render(<WebEmbed path="/dashboard" />);
        mockRouter.navigate.mockClear();

        capturedWebViewProps.onNavigationStateChange?.({
          url: `${mockWebBaseUrl}${webPath}`,
          loading: false,
        });

        if (expectedTab === "dashboard") {
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        } else if (expectedTab) {
          expect(mockRouter.navigate).toHaveBeenCalledWith(`/${expectedTab}`);
        } else {
          expect(mockRouter.navigate).toHaveBeenCalledWith(
            webPath.split("?")[0],
          );
        }
      });
    });
  });
});
