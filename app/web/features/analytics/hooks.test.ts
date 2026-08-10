import { act, renderHook } from "@testing-library/react";

import { useDurationEvent, useImpressionRef, useLogEvent } from "./hooks";

// Mock the eventCollector module
const mockLogEvent = jest.fn();
jest.mock("./eventCollector", () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

beforeEach(() => {
  mockLogEvent.mockReset();
});

describe("useLogEvent", () => {
  it("returns a stable callback across re-renders", () => {
    const { result, rerender } = renderHook(() => useLogEvent());

    const firstRef = result.current;
    rerender();
    expect(result.current).toBe(firstRef);
  });

  it("calls logEvent with the provided arguments", () => {
    const { result } = renderHook(() => useLogEvent());

    act(() => {
      result.current("button.clicked", { id: "cta" }, 5);
    });

    expect(mockLogEvent).toHaveBeenCalledWith("button.clicked", { id: "cta" }, 5);
  });
});

describe("useDurationEvent", () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = 1000;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs duration in seconds when stop is called after start", () => {
    const { result } = renderHook(() => useDurationEvent("page.time_spent", { path: "/" }));

    const [start, stop] = result.current;

    act(() => {
      start();
    });

    // Simulate 2.5 seconds passing
    mockNow = 3500;

    act(() => {
      stop();
    });

    expect(mockLogEvent).toHaveBeenCalledWith("page.time_spent", { path: "/" }, 2.5);
  });

  it("does nothing if stop is called without start", () => {
    const { result } = renderHook(() => useDurationEvent("timing.event"));

    const [, stop] = result.current;

    act(() => {
      stop();
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("merges extraProperties provided to stop()", () => {
    const { result } = renderHook(() => useDurationEvent("form.completed", { form: "signup" }));

    const [start, stop] = result.current;

    act(() => {
      start();
    });

    mockNow = 6000;

    act(() => {
      stop({ success: true, fields_filled: 5 });
    });

    expect(mockLogEvent).toHaveBeenCalledWith("form.completed", { form: "signup", success: true, fields_filled: 5 }, 5);
  });

  it("returns stable callbacks — stop does not change when properties change", () => {
    let props = { path: "/a" };
    const { result, rerender } = renderHook(() => useDurationEvent("nav.duration", props));

    const [firstStart, firstStop] = result.current;

    // Re-render with different properties object
    props = { path: "/b" };
    rerender();

    const [secondStart, secondStop] = result.current;

    // Callbacks should be stable (same reference)
    expect(secondStart).toBe(firstStart);
    expect(secondStop).toBe(firstStop);

    // But when called, should use the latest properties
    act(() => {
      secondStart();
    });
    mockNow = 2000;
    act(() => {
      secondStop();
    });

    expect(mockLogEvent).toHaveBeenCalledWith("nav.duration", { path: "/b" }, 1);
  });

  it("resets after stop so start/stop can be reused", () => {
    const { result } = renderHook(() => useDurationEvent("reusable.timer"));

    const [start, stop] = result.current;

    // First cycle
    act(() => start());
    mockNow = 2000;
    act(() => stop());

    // Second stop without start — should do nothing
    act(() => stop());

    expect(mockLogEvent).toHaveBeenCalledTimes(1);

    // Second cycle
    mockNow = 3000;
    act(() => start());
    mockNow = 3500;
    act(() => stop());

    expect(mockLogEvent).toHaveBeenCalledTimes(2);
    expect(mockLogEvent).toHaveBeenLastCalledWith("reusable.timer", {}, 0.5);
  });
});

describe("useImpressionRef", () => {
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let lastCallback: IntersectionObserverCallback;

  beforeEach(() => {
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    global.IntersectionObserver = jest.fn((callback) => {
      lastCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: jest.fn(),
        root: null,
        rootMargin: "",
        thresholds: [],
        takeRecords: () => [],
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("observes the element when the ref is attached", () => {
    const { result } = renderHook(() => useImpressionRef("card.viewed", { card_id: "123" }));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    expect(mockObserve).toHaveBeenCalledWith(node);
  });

  it("fires the event once when the element becomes visible", () => {
    const { result } = renderHook(() => useImpressionRef("card.viewed", { card_id: "123" }));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    // Simulate intersection
    act(() => {
      lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith("card.viewed", {
      card_id: "123",
    });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("does not fire again after the first impression", () => {
    const { result } = renderHook(() => useImpressionRef("card.viewed"));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    // First intersection
    act(() => {
      lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    // Reset disconnect mock and simulate re-attaching
    mockDisconnect.mockClear();

    // Try to re-attach the same ref
    act(() => {
      result.current(node);
    });

    // Should not observe again since hasFired is true
    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  it("uses custom threshold option", () => {
    renderHook(() => useImpressionRef("hero.viewed", {}, { threshold: 0.8 }));

    const node = document.createElement("div");

    // We need to get the callbackRef from the hook result
    const { result } = renderHook(() => useImpressionRef("hero.viewed", {}, { threshold: 0.8 }));

    act(() => {
      result.current(node);
    });

    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.8,
    });
  });

  it("returns a stable callback ref when properties change", () => {
    let props = { card_id: "1" };
    const { result, rerender } = renderHook(() => useImpressionRef("card.viewed", props));

    const firstRef = result.current;

    props = { card_id: "2" };
    rerender();

    // Callback ref should be the same — only eventType matters
    expect(result.current).toBe(firstRef);
  });

  it("uses latest properties from ref when firing", () => {
    let props = { card_id: "1" };
    const { result, rerender } = renderHook(() => useImpressionRef("card.viewed", props));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    // Update properties before the intersection fires
    props = { card_id: "2" };
    rerender();

    // Simulate intersection
    act(() => {
      lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    // Should use the latest properties
    expect(mockLogEvent).toHaveBeenCalledWith("card.viewed", { card_id: "2" });
  });

  it("disconnects on unmount", () => {
    const { result, unmount } = renderHook(() => useImpressionRef("card.viewed"));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("ignores non-intersecting entries", () => {
    const { result } = renderHook(() => useImpressionRef("card.viewed"));

    const node = document.createElement("div");
    act(() => {
      result.current(node);
    });

    act(() => {
      lastCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  describe("with minDurationMs", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("fires after the element is continuously visible for the duration", () => {
      const { result } = renderHook(() => useImpressionRef("card.viewed", { card_id: "1" }, { minDurationMs: 250 }));

      const node = document.createElement("div");
      act(() => {
        result.current(node);
      });

      act(() => {
        lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(mockLogEvent).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith("card.viewed", {
        card_id: "1",
      });
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("does not fire if the element leaves before the duration elapses", () => {
      const { result } = renderHook(() => useImpressionRef("card.viewed", {}, { minDurationMs: 250 }));

      const node = document.createElement("div");
      act(() => {
        result.current(node);
      });

      act(() => {
        lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        lastCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it("restarts the timer when the element re-enters after leaving", () => {
      const { result } = renderHook(() => useImpressionRef("card.viewed", {}, { minDurationMs: 250 }));

      const node = document.createElement("div");
      act(() => {
        result.current(node);
      });

      act(() => {
        lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      act(() => {
        lastCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      // Re-enter — timer should restart from zero
      act(() => {
        lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });
      act(() => {
        jest.advanceTimersByTime(249);
      });
      expect(mockLogEvent).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });

    it("clears the pending timer on unmount", () => {
      const { result, unmount } = renderHook(() => useImpressionRef("card.viewed", {}, { minDurationMs: 250 }));

      const node = document.createElement("div");
      act(() => {
        result.current(node);
      });
      act(() => {
        lastCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockLogEvent).not.toHaveBeenCalled();
    });
  });
});
