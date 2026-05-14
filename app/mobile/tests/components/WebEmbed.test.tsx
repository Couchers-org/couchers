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

jest.mock("@/hooks/useImagePicker");
jest.mock("@/hooks/useWebNavigation");

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
  onLoad?: () => void;
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

  // Mock return values for hooks
  const mockPickImage = jest.fn();
  const mockHandleNavigationStateChange = jest.fn();
  const mockPrepareGoBack = jest.fn();
  const mockCanGoBackRef = { current: false };
  const mockCurrentWebPathRef = { current: "/dashboard" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBackRef.current = false;
    mockCurrentWebPathRef.current = "/dashboard";

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

    // Mock useImagePicker
    (useImagePicker as jest.Mock).mockReturnValue({
      pickImage: mockPickImage,
    });

    // Mock useWebNavigation
    (useWebNavigation as jest.Mock).mockReturnValue({
      handleNavigationStateChange: mockHandleNavigationStateChange,
      canGoBackRef: mockCanGoBackRef,
      currentWebPathRef: mockCurrentWebPathRef,
      prepareGoBack: mockPrepareGoBack,
    });
  });

  describe("rendering", () => {
    it("renders WebView with correct URL", () => {
      render(<WebEmbed path="/dashboard" />);

      expect(capturedWebViewProps.source?.uri).toBe(
        `${mockWebBaseUrl}/dashboard`,
      );

      // Verify hooks are called with correct arguments
      expect(useImagePicker).toHaveBeenCalledWith();
      expect(useWebNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef: expect.objectContaining({ current: null }),
          onRetryCountReset: expect.any(Function),
        }),
      );
    });

    it("renders with different paths", () => {
      const { rerender } = render(<WebEmbed path="/messages" />);

      expect(capturedWebViewProps.source?.uri).toBe(
        `${mockWebBaseUrl}/messages`,
      );
      expect(useWebNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPath: "/messages",
        }),
      );

      (useWebNavigation as jest.Mock).mockClear();

      rerender(<WebEmbed path="/search" />);
      // source.uri is frozen at mount (initialUri ref) — navigation syncs via MOBILE_NAVIGATE
      expect(capturedWebViewProps.source?.uri).toBe(
        `${mockWebBaseUrl}/messages`,
      );
      expect(useWebNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPath: "/search",
        }),
      );
    });

    it("enables iOS back/forward navigation gestures", () => {
      render(<WebEmbed path="/dashboard" />);

      expect(capturedWebViewProps.allowsBackForwardNavigationGestures).toBe(
        true,
      );
    });
  });

  describe("navigation integration", () => {
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

    it("handles LOGOUT message", async () => {
      render(<WebEmbed path="/dashboard" />);

      // Advance past the 5s grace period (lastLoginTimeRef defaults to 0, fake timers init at 0)
      jest.setSystemTime(10000);

      await act(async () => {
        capturedWebViewProps.onMessage?.({
          nativeEvent: {
            data: JSON.stringify({ type: "LOGOUT" }),
          },
        });
      });

      expect(mockAuthContext.markLoggedOut).toHaveBeenCalled();
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

  describe("focus sync: returning from detail page", () => {
    it("calls prepareGoBack and goBack when refocused on a detail URL with history", () => {
      mockCurrentWebPathRef.current = "/user/username";
      mockCanGoBackRef.current = true;

      const { rerender } = render(<WebEmbed path="/search" />);

      // Simulate WebView finishing its initial load
      act(() => {
        capturedWebViewProps.onLoad?.();
      });

      // Simulate tab regaining focus (useFocusEffect fires again after load)
      rerender(<WebEmbed path="/search" />);

      expect(mockPrepareGoBack).toHaveBeenCalled();
      expect(mockWebViewRef.goBack).toHaveBeenCalled();
      expect(mockWebViewRef.injectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("MOBILE_NAVIGATE"),
      );
    });

    it("falls back to MOBILE_NAVIGATE when WebView has no history to go back through", () => {
      mockCurrentWebPathRef.current = "/user/username";
      mockCanGoBackRef.current = false;

      const { rerender } = render(<WebEmbed path="/search" />);

      act(() => {
        capturedWebViewProps.onLoad?.();
      });

      rerender(<WebEmbed path="/search" />);

      expect(mockPrepareGoBack).not.toHaveBeenCalled();
      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();
      expect(mockWebViewRef.injectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("MOBILE_NAVIGATE"),
      );
    });

    it("does not call goBack when the WebView is already on the correct tab root", () => {
      mockCurrentWebPathRef.current = "/search";
      mockCanGoBackRef.current = true;

      const { rerender } = render(<WebEmbed path="/search" />);

      act(() => {
        capturedWebViewProps.onLoad?.();
      });

      rerender(<WebEmbed path="/search" />);

      expect(mockPrepareGoBack).not.toHaveBeenCalled();
      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();
    });
  });

  // Note: Android back button tests below test integration glue code
  // between BackHandler and WebView. While not pure user behavior tests,
  // they verify important functionality that can't be tested by simulating
  // actual hardware back button presses.
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
      render(<WebEmbed path="/messages" />);

      // Set canGoBack to true to simulate WebView having history
      mockCanGoBackRef.current = true;

      // Simulate pressing hardware back button
      expect(capturedBackHandler).toBeDefined();
      const result = capturedBackHandler!();

      expect(mockWebViewRef.goBack).toHaveBeenCalled();
      expect(result).toBe(true); // Prevents default back behavior
    });

    it("does not call WebView goBack when canGoBack is false", () => {
      render(<WebEmbed path="/messages" />);

      // Simulate WebView navigation that sets canGoBack to false
      act(() => {
        capturedWebViewProps.onNavigationStateChange?.({
          url: `${mockWebBaseUrl}/messages`,
          loading: false,
          canGoBack: false,
        });
      });

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

    it("responds correctly to canGoBackRef changes", () => {
      render(<WebEmbed path="/messages" />);

      // When canGoBack is false
      mockCanGoBackRef.current = false;
      let result = capturedBackHandler!();
      expect(result).toBe(false);
      expect(mockWebViewRef.goBack).not.toHaveBeenCalled();

      // When canGoBack becomes true
      mockCanGoBackRef.current = true;
      result = capturedBackHandler!();
      expect(result).toBe(true);
      expect(mockWebViewRef.goBack).toHaveBeenCalled();
    });
  });
});
