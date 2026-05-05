import { renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type { WebViewNavigation } from "react-native-webview";

import { useWebNavigation } from "@/hooks/useWebNavigation";

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

  describe("navigation state changes", () => {
    it("navigates to messages tab when WebView navigates to /messages", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
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
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/communities`, false),
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith("/communities");
    });

    it("does not trigger native navigation when WebView navigates to a detail page", () => {
      // Detail pages (profiles, events, etc.) stay in the originating tab WebView
      // so goBack() can return correctly without a router.back() → dashboard flash.
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/123`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("triggers native navigation from catch-all to tab route", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/user/456",
          syncTargetPathRef,
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
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, true),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("does not trigger native navigation for sub-routes of tabs", () => {
      // Sub-routes like /messages/123 are detail pages — they stay in the tab WebView.
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/messages",
          syncTargetPathRef,
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages/123`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("strips hash fragments from URL when navigating to main tabs", () => {
      const syncTargetPathRef = { current: null };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          syncTargetPathRef,
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
      { webPath: "/dashboard/settings", expectedPath: null }, // detail route, stays in tab WebView
      { webPath: "/messages", expectedPath: "/messages" },
      { webPath: "/messages/123", expectedPath: null }, // detail route
      { webPath: "/search", expectedPath: "/search" },
      { webPath: "/search?query=test", expectedPath: "/search?query=test" },
      { webPath: "/communities", expectedPath: "/communities" },
      { webPath: "/communities/456", expectedPath: null }, // detail route
      { webPath: "/events", expectedPath: "/events" },
      { webPath: "/user/789", expectedPath: null }, // detail route
    ];

    testCases.forEach(({ webPath, expectedPath }) => {
      it(`maps ${webPath} correctly`, () => {
        const syncTargetPathRef = { current: null };
        const { result } = renderHook(() =>
          useWebNavigation({
            webBaseUrl: mockWebBaseUrl,
            currentPath: "/dashboard",
            syncTargetPathRef,
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
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/messages`, false),
      );

      expect(syncTargetPathRef.current).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages");
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
