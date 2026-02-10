import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { WebViewNavigation } from "react-native-webview";

import { useWebNavigation } from "@/hooks/useWebNavigation";

const mockWebBaseUrl = "https://couchers.org";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
}));

describe("useWebNavigation", () => {
  const mockRouter = {
    navigate: jest.fn(),
  };

  const mockI18n = {
    language: "en",
    changeLanguage: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ i18n: mockI18n });
  });

  describe("initialization", () => {
    it("returns handleNavigationStateChange and canGoBack", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      expect(result.current.handleNavigationStateChange).toBeDefined();
      expect(typeof result.current.handleNavigationStateChange).toBe(
        "function",
      );
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("canGoBack state", () => {
    it("updates canGoBack when navigation state changes", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      expect(result.current.canGoBack).toBe(false);

      // Simulate navigation that allows going back
      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages/123`,
        loading: false,
        canGoBack: true,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      // Call the handler - this will update state
      act(() => {
        result.current.handleNavigationStateChange(navState);
      });

      // Now canGoBack should be updated
      expect(result.current.canGoBack).toBe(true);
    });

    it("updates canGoBack to false when navigation state has canGoBack: false", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      act(() => {
        result.current.handleNavigationStateChange(navState);
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("navigation routing", () => {
    it("navigates to messages tab when WebView navigates to /messages", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/messages");
    });

    it("navigates to search tab when WebView navigates to /search", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/search`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("navigates to communities tab when WebView navigates to /communities", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/communities`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/communities");
    });

    it("navigates to events tab when WebView navigates to /events", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/events`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/events");
    });

    it("navigates to catch-all route for non-tab pages", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/user/123`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/user/123");
    });

    it("does not navigate when staying on the same tab", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/messages",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages/123`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("does not navigate when URL is still loading", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: true,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("does not navigate when URL is undefined", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState = {
        url: undefined,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      } as unknown as WebViewNavigation;

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("strips hash fragments when navigating to main tabs", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/search#10/40.7127/-74.006`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search");
    });

    it("preserves query parameters when navigating to main tabs", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/search?query=test`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).toHaveBeenCalledWith("/search?query=test");
    });

    it("skips external URLs", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: "https://external-site.com/page",
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe("locale synchronization", () => {
    it("extracts locale from URL and syncs with i18n", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/de/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("de");
    });

    it("does not change language if locale matches current", () => {
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/en/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    });

    it("defaults to 'en' when no locale prefix is present", () => {
      mockI18n.language = "de"; // Start with a different language
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
    });
  });

  describe("retry count reset", () => {
    it("calls onRetryCountReset when page loads successfully", () => {
      const onRetryCountReset = jest.fn();
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          onRetryCountReset,
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(onRetryCountReset).toHaveBeenCalled();
    });

    it("does not call onRetryCountReset when page is still loading", () => {
      const onRetryCountReset = jest.fn();
      const { result } = renderHook(() =>
        useWebNavigation({
          webBaseUrl: mockWebBaseUrl,
          currentPath: "/dashboard",
          onRetryCountReset,
        }),
      );

      const navState: WebViewNavigation = {
        url: `${mockWebBaseUrl}/messages`,
        loading: true,
        canGoBack: false,
        canGoForward: false,
        navigationType: "click",
        title: "",
        lockIdentifier: 0,
        mainDocumentURL: "",
      };

      result.current.handleNavigationStateChange(navState);

      expect(onRetryCountReset).not.toHaveBeenCalled();
    });
  });

  describe("tab route mapping with locales", () => {
    const testCases = [
      { path: "/dashboard", route: "dashboard" },
      { path: "/de/dashboard", route: "dashboard" },
      { path: "/dashboard/settings", route: "dashboard" },
      { path: "/de/dashboard/settings", route: "dashboard" },
      { path: "/messages", route: "messages" },
      { path: "/de/messages", route: "messages" },
      { path: "/messages/123", route: "messages" },
      { path: "/search", route: "search" },
      { path: "/de/search", route: "search" },
      { path: "/communities", route: "communities" },
      { path: "/de/communities", route: "communities" },
      { path: "/events", route: "events" },
      { path: "/de/events", route: "events" },
    ];

    testCases.forEach(({ path, route }) => {
      it(`maps ${path} to ${route} route`, () => {
        const { result } = renderHook(() =>
          useWebNavigation({
            webBaseUrl: mockWebBaseUrl,
            currentPath: "/dashboard",
          }),
        );

        const navState: WebViewNavigation = {
          url: `${mockWebBaseUrl}${path}`,
          loading: false,
          canGoBack: false,
          canGoForward: false,
          navigationType: "click",
          title: "",
          lockIdentifier: 0,
          mainDocumentURL: "",
        };

        result.current.handleNavigationStateChange(navState);

        if (route === "dashboard") {
          // Same route - no navigation
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        } else {
          expect(mockRouter.navigate).toHaveBeenCalled();
        }
      });
    });
  });
});
