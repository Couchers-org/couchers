import { renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type { WebViewNavigation } from "react-native-webview";

import { useWebNavigation } from "@/hooks/useWebNavigation";
import { currentActiveWebPathRef } from "@/state/webViewState";

const mockWebBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

const createNavState = (
  url: string,
  loading: boolean,
  canGoBack: boolean = false,
): WebViewNavigation => ({
  url,
  loading,
  canGoBack,
  canGoForward: false,
  navigationType: "other",
  title: "",
  lockIdentifier: 0,
});

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    i18n: { language: "en", changeLanguage: jest.fn() },
  })),
}));

describe("useWebNavigation", () => {
  const mockRouter = {
    navigate: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("current page for notifications", () => {
    function navigate(isFocused: boolean) {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef: { current: null },
          isFocusedRef: { current: isFocused },
        }),
      );
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/en/messages`, false),
      );
    }

    afterEach(() => {
      currentActiveWebPathRef.current = null;
    });

    it("records the page when the screen is on display", () => {
      navigate(true);

      expect(currentActiveWebPathRef.current).toBe("/en/messages");
    });

    it("leaves the page alone when a background screen navigates", () => {
      currentActiveWebPathRef.current = "/en/messages/request/425";

      navigate(false);

      expect(currentActiveWebPathRef.current).toBe("/en/messages/request/425");
    });
  });

  describe("navigation state changes", () => {
    it("navigates to messages tab when WebView navigates to /messages", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages");
    });

    it("navigates to search tab when WebView navigates to /search", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/search`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("navigates to communities tab when WebView navigates to /communities", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/communities`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/communities");
    });

    it("navigates to the detail path when WebView navigates to a detail page", () => {
      // Detail pages navigate to [..slug] so no tab is highlighted.
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/123`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/user/123");
    });

    it("triggers native navigation from catch-all to tab route", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/user/456",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/dashboard`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/dashboard");
    });

    it("does not navigate when URL is still loading", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, true),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("navigates to the detail path for sub-routes of tabs", () => {
      // Sub-routes like /messages/123 are detail pages — they navigate to [..slug].
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/messages",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages/123`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages/123");
    });

    it("strips hash fragments from URL when navigating to main tabs", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/search#10/40.7127/-74.006`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("does not trigger navigation for query parameter changes on same route", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/user/username",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/username?tab=about`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/username?tab=home`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("tab mapping", () => {
    const testCases = [
      { webPath: "/dashboard", expectedPath: null }, // same route, no navigation
      { webPath: "/dashboard/settings", expectedPath: "/dashboard/settings" }, // detail → [..slug]
      { webPath: "/messages", expectedPath: "/messages" },
      { webPath: "/messages/123", expectedPath: "/messages/123" }, // detail → [..slug]
      { webPath: "/search", expectedPath: "/search" },
      { webPath: "/search?query=test", expectedPath: "/search?query=test" },
      { webPath: "/communities", expectedPath: "/communities" },
      { webPath: "/communities/456", expectedPath: "/communities/456" }, // detail → [..slug]
      { webPath: "/events", expectedPath: "/events" },
      { webPath: "/user/789", expectedPath: "/user/789" }, // detail → [..slug]
    ];

    testCases.forEach(({ webPath, expectedPath }) => {
      it(`maps ${webPath} correctly`, () => {
        const syncTargetPathRef = { current: null };
        const { result } = renderHook(() =>
          useWebNavigation({
            webBaseUrl: mockWebBaseUrl,
            currentPath: "/dashboard",
            syncTargetPathRef,
            isFocusedRef: { current: true },
          }),
        );

        mockRouter.navigate.mockClear();

        result.current.handleNavigationStateChange(
          createNavState(`${mockWebBaseUrl}${webPath}`, false),
        );

        if (expectedPath) {
          expect(mockRouter.navigate).toHaveBeenCalledWith(expectedPath);
        } else {
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe("sync operations", () => {
    it("skips navigation when sync is in progress and URL is not the sync target", () => {
      const syncTargetPathRef = { current: "/dashboard" };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("clears sync target when sync navigation completes on same route", () => {
      const syncTargetPathRef = { current: "/dashboard" };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/dashboard`, false),
      );

      expect(syncTargetPathRef.current).toBeNull();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("clears sync target and navigates when sync navigation reaches a different route", () => {
      const syncTargetPathRef = { current: "/messages" };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, false),
      );

      expect(syncTargetPathRef.current).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages");
    });
  });

  describe("prepareGoBack", () => {
    it("is returned from the hook", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/search",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      expect(typeof result.current.prepareGoBack).toBe("function");
    });

    it("prevents a stale detail URL event from re-triggering navigation after goBack", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/search",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      // Navigate to detail page — fires native navigation
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/123`, false),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith("/user/123");
      mockRouter.navigate.mockClear();

      // prepareGoBack called just before goBack()
      result.current.prepareGoBack();

      // Stale iOS event fires for the detail URL (before back navigation completes)
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/123`, false),
      );
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      // Actual back navigation completes — WebView arrives at search results
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/search?page=3&location=xyz`, false),
      );
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(result.current.currentWebPathRef.current).toBe(
        "/search?page=3&location=xyz",
      );
    });

    it("preserves locale prefix in skipNextDetailRef so the stale event path matches", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/search",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      // Navigate to locale-prefixed detail page
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/en/user/123`, false),
      );
      mockRouter.navigate.mockClear();

      result.current.prepareGoBack();

      // Stale event fires with locale-prefixed path — must be caught
      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/en/user/123`, false),
      );
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe("canGoBack tracking", () => {
    it("updates canGoBackRef when navigation state changes", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
          isFocusedRef: { current: true },
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/dashboard`, false, true),
      );

      expect(result.current.canGoBackRef.current).toBe(true);

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/dashboard`, false, false),
      );

      expect(result.current.canGoBackRef.current).toBe(false);
    });
  });
});
