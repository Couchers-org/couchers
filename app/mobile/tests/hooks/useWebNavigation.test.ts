import { renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type { WebViewNavigation } from "react-native-webview";

import { useWebNavigation } from "@/hooks/useWebNavigation";

const mockWebBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

// Helper to create WebViewNavigation object with all required properties
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

    it("triggers native navigation for non-tab routes (catch-all)", () => {
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

      expect(mockRouter.navigate).toHaveBeenCalledWith("/user/123");
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
    });

    it("does not navigate when staying on the same tab", () => {
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

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/user/username?tab=home`, false),
      );

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe("tab mapping", () => {
    const testCases = [
      { webPath: "/dashboard", expectedTab: "dashboard", expectedPath: null },
      {
        webPath: "/dashboard/settings",
        expectedTab: "dashboard",
        expectedPath: null,
      },
      {
        webPath: "/messages",
        expectedTab: "messages",
        expectedPath: "/messages",
      },
      {
        webPath: "/messages/123",
        expectedTab: "messages",
        expectedPath: "/messages",
      },
      { webPath: "/search", expectedTab: "search", expectedPath: "/search" },
      {
        webPath: "/search?query=test",
        expectedTab: "search",
        expectedPath: "/search?query=test",
      },
      {
        webPath: "/communities",
        expectedTab: "communities",
        expectedPath: "/communities",
      },
      {
        webPath: "/communities/456",
        expectedTab: "communities",
        expectedPath: "/communities",
      },
      { webPath: "/events", expectedTab: "events", expectedPath: "/events" },
      { webPath: "/user/789", expectedTab: null, expectedPath: "/user/789" },
    ];

    testCases.forEach(({ webPath, expectedTab, expectedPath }) => {
      it(`maps ${webPath} to tab: ${expectedTab}`, () => {
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

        if (expectedTab === "dashboard") {
          // Same tab - no navigation
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        } else if (expectedPath) {
          // Different route - navigate (main tabs or catch-all)
          expect(mockRouter.navigate).toHaveBeenCalledWith(expectedPath);
        } else {
          // Sub-route of same tab - no navigation
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
    });

    it("clears sync target when sync navigation completes", () => {
      const syncTargetPathRef = { current: "/dashboard" };
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/messages",
          syncTargetPathRef,
        }),
      );

      result.current.handleNavigationStateChange(
        createNavState(`${mockWebBaseUrl}/dashboard`, false),
      );

      expect(syncTargetPathRef.current).toBeNull();
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
