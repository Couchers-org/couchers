import { act, render } from "@testing-library/react";
import mockRouter from "next-router-mock";

import AnalyticsProvider from "./provider";

const mockLogEvent = jest.fn();
const mockDestroyCollector = jest.fn();
const mockInitializeCollector = jest.fn();

jest.mock("./eventCollector", () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  destroyCollector: () => mockDestroyCollector(),
  initializeCollector: () => mockInitializeCollector(),
}));

let eventOnSpy: jest.SpyInstance;
let eventOffSpy: jest.SpyInstance;

// jsdom makes window.location non-configurable, so it can't be replaced with
// Object.defineProperty. pushState updates pathname/search/href in place instead.
function setLocation(pathname: string, search = "") {
  window.history.pushState({}, "", `${pathname}${search}`);
}

beforeEach(() => {
  mockLogEvent.mockReset();
  mockDestroyCollector.mockReset();
  mockInitializeCollector.mockReset();
  eventOnSpy = jest.spyOn(mockRouter.events, "on");
  eventOffSpy = jest.spyOn(mockRouter.events, "off");

  // Reset router to root
  mockRouter.setCurrentUrl("/");

  setLocation("/");
});

afterEach(() => {
  eventOnSpy.mockRestore();
  eventOffSpy.mockRestore();
});

describe("AnalyticsProvider", () => {
  describe("session start", () => {
    it("logs session.started with device info on mount", () => {
      render(
        <AnalyticsProvider>
          <div>child</div>
        </AnalyticsProvider>,
      );

      const sessionCall = mockLogEvent.mock.calls.find((call) => call[0] === "session.started");

      expect(sessionCall).toBeDefined();
      const props = sessionCall![1];
      expect(props).toMatchObject({
        landing_page: "/",
        user_agent: expect.any(String),
        screen_width: expect.any(Number),
        screen_height: expect.any(Number),
        viewport_width: expect.any(Number),
        viewport_height: expect.any(Number),
        language: expect.any(String),
      });
      expect(props).toHaveProperty("referrer");
    });

    it("logs session.started only once across re-renders", () => {
      const { rerender } = render(
        <AnalyticsProvider>
          <div>child</div>
        </AnalyticsProvider>,
      );

      rerender(
        <AnalyticsProvider>
          <div>updated child</div>
        </AnalyticsProvider>,
      );

      const sessionCalls = mockLogEvent.mock.calls.filter((call) => call[0] === "session.started");
      expect(sessionCalls).toHaveLength(1);
    });
  });

  describe("initial page.viewed", () => {
    it("logs page.viewed on mount with null previous_path", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall).toBeDefined();
      expect(pageCall![1]).toMatchObject({
        path: "/",
        previous_path: null,
        time_on_previous_page: null,
      });
    });
  });

  describe("search property (item 9)", () => {
    it("includes non-UTM query params as search in initial page.viewed", () => {
      setLocation("/search", "?q=paris&guests=2&utm_source=google&utm_medium=cpc");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall![1].search).toBe("q=paris&guests=2");
    });

    it("sets search to null when only UTM params are present", () => {
      setLocation("/landing", "?utm_source=google&utm_campaign=spring");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall![1].search).toBeNull();
    });

    it("sets search to null when no query params are present", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall![1].search).toBeNull();
    });
  });

  describe("UTM params in session.started", () => {
    it("includes UTM params in session.started properties", () => {
      setLocation("/", "?utm_source=twitter&utm_medium=social&utm_campaign=launch");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const sessionCall = mockLogEvent.mock.calls.find((call) => call[0] === "session.started");

      expect(sessionCall![1]).toMatchObject({
        utm_source: "twitter",
        utm_medium: "social",
        utm_campaign: "launch",
      });
    });
  });

  describe("email ref", () => {
    it("includes zz in session.started and strips it from page.viewed search", () => {
      setLocation("/messages/chats/1", "?zz=abc123&tab=info");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const sessionCall = mockLogEvent.mock.calls.find((call) => call[0] === "session.started");
      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(sessionCall![1]).toMatchObject({ zz: "abc123" });
      expect(pageCall![1].search).toBe("tab=info");
    });

    it("omits zz from session.started when not present", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      const sessionCall = mockLogEvent.mock.calls.find((call) => call[0] === "session.started");

      expect(sessionCall![1]).not.toHaveProperty("zz");
    });

    it("removes zz from the address bar and keeps other params and the hash", () => {
      setLocation("/messages/chats/1", "?zz=abc123&tab=info#latest");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      expect(window.location.pathname).toBe("/messages/chats/1");
      expect(window.location.search).toBe("?tab=info");
      expect(window.location.hash).toBe("#latest");
    });

    it("leaves the address bar alone when zz is not present", () => {
      setLocation("/search", "?q=paris");
      const replaceStateSpy = jest.spyOn(window.history, "replaceState");

      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      expect(replaceStateSpy).not.toHaveBeenCalled();
      expect(window.location.search).toBe("?q=paris");
      replaceStateSpy.mockRestore();
    });
  });

  describe("route change tracking", () => {
    it("registers a routeChangeComplete listener on mount", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      expect(eventOnSpy).toHaveBeenCalledWith("routeChangeComplete", expect.any(Function));
    });

    it("unregisters the listener on unmount", () => {
      const { unmount } = render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      unmount();

      expect(eventOffSpy).toHaveBeenCalledWith("routeChangeComplete", expect.any(Function));
    });

    it("logs page.viewed with search on route change", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      mockLogEvent.mockClear();

      // Trigger a route change via the mock router
      act(() => {
        mockRouter.push("/search?q=london&page=2");
      });

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall).toBeDefined();
      expect(pageCall![1]).toMatchObject({
        path: "/search",
        search: "q=london&page=2",
        previous_path: "/",
        time_on_previous_page: expect.any(Number),
      });
    });

    it("strips UTM params from search in route change events", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      mockLogEvent.mockClear();

      act(() => {
        mockRouter.push("/page?q=test&utm_source=google");
      });

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall).toBeDefined();
      expect(pageCall![1].search).toBe("q=test");
    });

    it("sets search to null on route change without query params", () => {
      render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      mockLogEvent.mockClear();

      act(() => {
        mockRouter.push("/about");
      });

      const pageCall = mockLogEvent.mock.calls.find((call) => call[0] === "page.viewed");

      expect(pageCall).toBeDefined();
      expect(pageCall![1].search).toBeNull();
    });
  });

  describe("cleanup", () => {
    it("calls destroyCollector on unmount", () => {
      const { unmount } = render(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );

      unmount();
      expect(mockDestroyCollector).toHaveBeenCalledTimes(1);
    });
  });

  describe("renders children", () => {
    it("renders its children", () => {
      const { getByText } = render(
        <AnalyticsProvider>
          <span>Hello Analytics</span>
        </AnalyticsProvider>,
      );

      expect(getByText("Hello Analytics")).toBeInTheDocument();
    });
  });
});
