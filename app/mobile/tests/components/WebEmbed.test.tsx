import { act, render, screen, userEvent } from "@testing-library/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { BackHandler, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import WebEmbed from "@/components/WebEmbed";
import { useAuthContext } from "@/features/auth/AuthContext";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useWebNavigation } from "@/hooks/useWebNavigation";

const mockWebBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

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

jest.mock("@/hooks/useWebNavigation", () => ({
  useWebNavigation: jest.fn(),
}));

jest.mock("@/hooks/useImagePicker", () => ({
  useImagePicker: jest.fn(),
}));

// WebView mock - captures props and ref methods for test assertions
const mockWebViewRef = {
  reload: jest.fn(),
  stopLoading: jest.fn(),
  injectJavaScript: jest.fn(),
  goBack: jest.fn(),
};

let capturedWebViewProps: {
  source?: { uri: string };
  allowsBackForwardNavigationGestures?: boolean;
  onNavigationStateChange?: (navState: {
    url: string;
    loading: boolean;
    canGoBack?: boolean;
  }) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onError?: (event: { nativeEvent: unknown }) => void;
  onOpenWindow?: (event: { nativeEvent: { targetUrl: string } }) => void;
  onShouldStartLoadWithRequest?: (event: { url: string }) => boolean;
} = {};

// BackHandler mock - captures the hardware back press listener
let capturedBackHandler: (() => boolean) | null = null;
const mockBackHandlerRemove = jest.fn();

// Track useFocusEffect cleanup functions
let focusEffectCleanups: (() => void)[] = [];

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
  capturedBackHandler = null;
  focusEffectCleanups = [];
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

  // Default mock implementations for custom hooks
  const mockHandleNavigationStateChange = jest.fn();
  const mockPickImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleNavigationStateChange.mockClear();
    mockPickImage.mockClear();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });
    (useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);
    (useFocusEffect as jest.Mock).mockImplementation((callback) => {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        focusEffectCleanups.push(cleanup);
      }
    });

    // Default mock for useWebNavigation
    (useWebNavigation as jest.Mock).mockReturnValue({
      handleNavigationStateChange: mockHandleNavigationStateChange,
      canGoBack: false,
    });

    // Default mock for useImagePicker
    (useImagePicker as jest.Mock).mockReturnValue({
      pickImage: mockPickImage,
    });
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

    it("enables iOS back/forward navigation gestures", () => {
      render(<WebEmbed path="/dashboard" />);

      expect(capturedWebViewProps.allowsBackForwardNavigationGestures).toBe(
        true,
      );
    });
  });

  describe("navigation state changes", () => {
    it("passes navigation state changes to the hook", () => {
      render(<WebEmbed path="/dashboard" />);

      const navState = {
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
        canGoBack: false,
      };

      act(() => {
        capturedWebViewProps.onNavigationStateChange?.(navState);
      });

      expect(mockHandleNavigationStateChange).toHaveBeenCalledWith(navState);
    });

    it("navigates to messages tab when WebView navigates to /messages", () => {
      render(<WebEmbed path="/dashboard" />);

      act(() => {
        capturedWebViewProps.onNavigationStateChange?.({
          url: `${mockWebBaseUrl}/messages`,
          loading: false,
        });
      });

      expect(mockHandleNavigationStateChange).toHaveBeenCalled();
    });


    it("blocks external URLs via onShouldStartLoadWithRequest", () => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

      render(<WebEmbed path="/dashboard" />);

      // External URLs should return false to prevent loading in WebView
      const result = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: "https://external-site.com/page",
      });

      expect(result).toBe(false);
      expect(openURLSpy).toHaveBeenCalledWith("https://external-site.com/page");
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      openURLSpy.mockRestore();
    });

    it("allows internal URLs via onShouldStartLoadWithRequest", () => {
      render(<WebEmbed path="/dashboard" />);

      const result = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: `${mockWebBaseUrl}/some-page`,
      });

      expect(result).toBe(true);
    });

    it("allows special URLs like about:blank via onShouldStartLoadWithRequest", () => {
      render(<WebEmbed path="/dashboard" />);

      const aboutBlank = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: "about:blank",
      });
      const dataUrl = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: "data:text/html,<h1>Test</h1>",
      });

      expect(aboutBlank).toBe(true);
      expect(dataUrl).toBe(true);
    });

    it("allows reCAPTCHA URLs via onShouldStartLoadWithRequest", () => {
      render(<WebEmbed path="/dashboard" />);

      const recaptcha = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: "https://www.google.com/recaptcha/api2/anchor",
      });
      const gstatic = capturedWebViewProps.onShouldStartLoadWithRequest?.({
        url: "https://www.gstatic.com/recaptcha/releases/abc123/recaptcha.js",
      });

      expect(recaptcha).toBe(true);
      expect(gstatic).toBe(true);
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

      expect(screen.getByText("errors.failed_to_load")).toBeTruthy();
      expect(screen.getByText("errors.check_connection")).toBeTruthy();
    });

    it("allows retry after error", async () => {
      render(<WebEmbed path="/dashboard" />);

      await act(async () => {
        capturedWebViewProps.onError?.({ nativeEvent: { code: -1 } });
      });

      expect(screen.getByText("errors.failed_to_load")).toBeTruthy();

      await user.press(
        screen.getByRole("button", { name: "errors.try_again" }),
      );

      expect(screen.queryByText("errors.failed_to_load")).toBeNull();
    });
  });

  describe("external link handling", () => {
    it("opens target='_blank' links in device browser via onOpenWindow", () => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

      render(<WebEmbed path="/dashboard" />);

      capturedWebViewProps.onOpenWindow?.({
        nativeEvent: {
          targetUrl: "https://example.com/external",
        },
      });

      expect(openURLSpy).toHaveBeenCalledWith("https://example.com/external");

      openURLSpy.mockRestore();
    });
  });

  describe("focus effect", () => {
    it("navigates WebView back to expected path when drifted", () => {
      // Store the latest path drift callback
      let latestPathDriftCallback: (() => void) | undefined;
      let callCount = 0;

      (useFocusEffect as jest.Mock).mockImplementation(
        (callback: () => void) => {
          callCount++;
          // First useFocusEffect is for back button, second is for path drift
          if (callCount % 2 === 0) {
            // Path drift callback - store it but don't call it yet
            latestPathDriftCallback = callback;
          } else {
            // Back button callback - execute normally
            const cleanup = callback();
            if (typeof cleanup === "function") {
              focusEffectCleanups.push(cleanup);
            }
          }
        },
      );

      const { rerender } = render(<WebEmbed path="/dashboard" />);

      // Manually call the path drift callback as if focus was gained
      // This simulates the component gaining focus
      latestPathDriftCallback?.();

      // Should not inject JavaScript because path matches currentWebPathRef
      expect(mockWebViewRef.injectJavaScript).not.toHaveBeenCalled();

      // Now rerender with a different path (simulates navigating to different tab)
      rerender(<WebEmbed path="/search" />);

      mockWebViewRef.injectJavaScript.mockClear();

      // Call the path drift callback again (the updated one from rerender)
      latestPathDriftCallback?.();

      // Should inject JavaScript to navigate to the new path
      expect(mockWebViewRef.injectJavaScript).toHaveBeenCalledWith(
        `window.location.href = "${mockWebBaseUrl}/search"; true;`,
      );
    });
  });


  describe("Android back button handling", () => {
    let backHandlerSpy: jest.SpyInstance;

    beforeEach(() => {
      // Ensure Platform.OS is android for these tests
      Object.defineProperty(Platform, "OS", { get: () => "android" });

      // Spy on BackHandler.addEventListener
      backHandlerSpy = jest
        .spyOn(BackHandler, "addEventListener")
        .mockImplementation((_event, handler) => {
          capturedBackHandler = handler as () => boolean;
          return { remove: mockBackHandlerRemove };
        });
    });

    afterEach(() => {
      backHandlerSpy.mockRestore();
    });

    it("registers BackHandler on Android when component mounts", () => {
      render(<WebEmbed path="/dashboard" />);

      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function),
      );
    });

    it("removes BackHandler listener on cleanup", () => {
      render(<WebEmbed path="/dashboard" />);

      // Simulate focus effect cleanup (called when screen loses focus or unmounts)
      focusEffectCleanups.forEach((cleanup) => cleanup());

      expect(mockBackHandlerRemove).toHaveBeenCalled();
    });

    it("calls WebView goBack when canGoBack is true and back button is pressed", () => {
      // Mock the hook to return canGoBack: true
      (useWebNavigation as jest.Mock).mockReturnValue({
        handleNavigationStateChange: mockHandleNavigationStateChange,
        canGoBack: true,
      });

      render(<WebEmbed path="/messages" />);

      // Simulate pressing hardware back button
      expect(capturedBackHandler).toBeDefined();
      const result = capturedBackHandler!();

      expect(mockWebViewRef.goBack).toHaveBeenCalled();
      expect(result).toBe(true); // Prevents default back behavior
    });

    it("does not call WebView goBack when canGoBack is false", () => {
      // Mock the hook to return canGoBack: false (this is also the default)
      (useWebNavigation as jest.Mock).mockReturnValue({
        handleNavigationStateChange: mockHandleNavigationStateChange,
        canGoBack: false,
      });

      render(<WebEmbed path="/messages" />);

      // Simulate pressing hardware back button
      expect(capturedBackHandler).toBeDefined();
      const result = capturedBackHandler!();

      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();
      expect(result).toBe(false); // Allows native navigation to handle it
    });

    it("returns false (allows native navigation) when WebView has no history", () => {
      render(<WebEmbed path="/dashboard" />);

      // Initial state - canGoBack should be false
      expect(capturedBackHandler).toBeDefined();
      const result = capturedBackHandler!();

      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("does not register BackHandler on non-Android platforms", () => {
      // Change Platform.OS to iOS
      Object.defineProperty(Platform, "OS", { get: () => "ios" });

      // Clear any previous calls
      backHandlerSpy.mockClear();

      render(<WebEmbed path="/dashboard" />);

      expect(BackHandler.addEventListener).not.toHaveBeenCalled();
    });

    it("updates BackHandler when canGoBack state changes", () => {
      // Start with canGoBack: false
      (useWebNavigation as jest.Mock).mockReturnValue({
        handleNavigationStateChange: mockHandleNavigationStateChange,
        canGoBack: false,
      });

      const { rerender } = render(<WebEmbed path="/messages" />);

      let result = capturedBackHandler!();
      expect(result).toBe(false);
      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();

      // Update the hook to return canGoBack: true
      (useWebNavigation as jest.Mock).mockReturnValue({
        handleNavigationStateChange: mockHandleNavigationStateChange,
        canGoBack: true,
      });

      // Rerender to pick up the new hook value
      rerender(<WebEmbed path="/messages" />);

      result = capturedBackHandler!();
      expect(result).toBe(true);
      expect(mockWebViewRef.goBack).toHaveBeenCalled();
    });
  });
});
