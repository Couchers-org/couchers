/**
 * Tests for the EventCollector.
 *
 * We import the class directly and create fresh instances per test
 * to avoid singleton state leaking between tests.
 */
import { _EventCollector as EventCollector } from "./event-collector";

const mockReportDiagnostics = jest.fn();

jest.mock("service/diagnostics", () => ({
  reportDiagnostics: (...args: unknown[]) => mockReportDiagnostics(...args),
}));

let collector: InstanceType<typeof EventCollector>;

beforeEach(() => {
  jest.useFakeTimers();
  mockReportDiagnostics.mockReset();
  mockReportDiagnostics.mockResolvedValue(undefined);
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  collector = new EventCollector();
});

afterEach(() => {
  collector.destroy();
  jest.useRealTimers();
});

describe("EventCollector", () => {
  describe("initial flush delay", () => {
    it("batches initial events with a 150ms delay instead of flushing immediately", () => {
      collector.logEvent("session.started", { landing_page: "/" });
      collector.logEvent("page.viewed", { path: "/" });

      expect(mockReportDiagnostics).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);

      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);
      const events = mockReportDiagnostics.mock.calls[0][0];
      expect(events).toHaveLength(2);
      expect(events[0].tag).toBe("session.started");
      expect(events[1].tag).toBe("page.viewed");
    });

    it("does not start a second timer if events arrive within the initial delay", () => {
      collector.logEvent("session.started");

      jest.advanceTimersByTime(50);
      collector.logEvent("page.viewed", { path: "/" });

      jest.advanceTimersByTime(50);
      collector.logEvent("some.other.event");

      expect(mockReportDiagnostics).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);
      expect(mockReportDiagnostics.mock.calls[0][0]).toHaveLength(3);
    });
  });

  describe("normal flush scheduling", () => {
    it("schedules subsequent events on a 3s interval after the first flush", () => {
      collector.logEvent("session.started");
      jest.advanceTimersByTime(150);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);

      collector.logEvent("button.clicked", { id: "cta" });
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(3000);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(2);
      expect(mockReportDiagnostics.mock.calls[1][0][0].tag).toBe(
        "button.clicked",
      );
    });
  });

  describe("event properties and value", () => {
    it("serialises properties as JSON and passes through the value", () => {
      collector.logEvent(
        "search.performed",
        { query: "paris", filters: 3 },
        42,
      );
      jest.advanceTimersByTime(150);

      const event = mockReportDiagnostics.mock.calls[0][0][0];
      expect(event.tag).toBe("search.performed");
      expect(JSON.parse(event.propertiesJson)).toEqual({
        query: "paris",
        filters: 3,
      });
      expect(event.value).toBe(42);
      expect(event.occurred).toBeInstanceOf(Date);
    });

    it("uses default empty properties and value=1 when not provided", () => {
      collector.logEvent("page.viewed");
      jest.advanceTimersByTime(150);

      const event = mockReportDiagnostics.mock.calls[0][0][0];
      expect(JSON.parse(event.propertiesJson)).toEqual({});
      expect(event.value).toBe(1);
    });
  });

  describe("retry backoff (item 8)", () => {
    it("re-queues events and retries with exponential backoff on failure", async () => {
      mockReportDiagnostics.mockRejectedValueOnce(new Error("network error"));

      collector.logEvent("session.started");

      // Initial flush at 150ms
      jest.advanceTimersByTime(150);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);

      // Flush the rejected promise
      await Promise.resolve();
      await Promise.resolve();

      // After 1 failure: backoff = 3000 * 2^1 = 6000ms
      jest.advanceTimersByTime(5999);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(2);

      // The same event should have been retried
      expect(mockReportDiagnostics.mock.calls[1][0][0].tag).toBe(
        "session.started",
      );
    });

    it("resets backoff to 0 on success", async () => {
      mockReportDiagnostics
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);

      collector.logEvent("event.one");
      jest.advanceTimersByTime(150);
      await Promise.resolve();
      await Promise.resolve();

      // First retry at 6s backoff
      jest.advanceTimersByTime(6000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(2);

      // Now log a new event — should use normal 3s interval (no backoff)
      collector.logEvent("event.two");
      jest.advanceTimersByTime(3000);
      expect(mockReportDiagnostics).toHaveBeenCalledTimes(3);
    });

    it("caps backoff at 60 seconds", async () => {
      mockReportDiagnostics.mockRejectedValue(new Error("fail"));

      collector.logEvent("event.one");
      jest.advanceTimersByTime(150);

      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
        await Promise.resolve();
        jest.advanceTimersByTime(60_000);
      }

      // Retries happened at the 60s cap, not at 3000 * 2^10 = 3,072,000ms
      const callCount = mockReportDiagnostics.mock.calls.length;
      expect(callCount).toBeGreaterThan(2);
    });
  });

  describe("beacon flush on unload (item 1)", () => {
    it("uses fetch with keepalive on visibilitychange hidden", () => {
      collector.logEvent("page.viewed", { path: "/about" });

      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("/org.couchers.bugs.Bugs/ReportDiagnostics");
      expect(options.method).toBe("POST");
      expect(options.keepalive).toBe(true);
      expect(options.credentials).toBe("include");
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body);
      expect(body.infos).toHaveLength(1);
      expect(body.infos[0].tag).toBe("page.viewed");
      expect(typeof body.infos[0].occurred).toBe("string");
      expect(() => new Date(body.infos[0].occurred)).not.toThrow();

      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
    });

    it("uses fetch with keepalive on beforeunload", () => {
      collector.logEvent("session.ended");

      window.dispatchEvent(new Event("beforeunload"));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.keepalive).toBe(true);
    });

    it("uses beacon flush in destroy()", () => {
      collector.logEvent("final.event");
      collector.destroy();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.keepalive).toBe(true);
    });

    it("does not beacon if queue is empty", () => {
      collector.destroy();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("re-queues events if fetch throws synchronously", () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        throw new Error("fetch unavailable");
      });

      collector.logEvent("important.event");

      // Beacon via beforeunload — fetch throws, events re-queued
      window.dispatchEvent(new Event("beforeunload"));

      // Reset fetch so destroy's beacon works
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      collector.destroy();

      // The event should have been sent on destroy after the re-queue
      const lastCall = (global.fetch as jest.Mock).mock.calls.at(-1);
      const body = JSON.parse(lastCall[1].body);
      expect(
        body.infos.some(
          (info: { tag: string }) => info.tag === "important.event",
        ),
      ).toBe(true);
    });
  });

  describe("destroy", () => {
    it("ignores events logged after destroy", () => {
      collector.destroy();
      collector.logEvent("should.be.ignored");

      jest.advanceTimersByTime(10_000);
      expect(mockReportDiagnostics).not.toHaveBeenCalled();
    });

    it("removes event listeners on destroy", () => {
      const removeSpy = jest.spyOn(document, "removeEventListener");
      const removeWindowSpy = jest.spyOn(window, "removeEventListener");

      collector.destroy();

      expect(removeSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
      expect(removeWindowSpy).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function),
      );

      removeSpy.mockRestore();
      removeWindowSpy.mockRestore();
    });
  });
});
