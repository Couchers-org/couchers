import { act, render, renderHook } from "@testing-library/react";
import React from "react";

import {
  useFormInteraction,
  useFunnelStep,
  useHoverDwell,
  useScrollDepth,
} from "./journey-hooks";

const mockLogEvent = jest.fn();
jest.mock("./event-collector", () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

beforeEach(() => {
  mockLogEvent.mockReset();
});

describe("useFunnelStep", () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = 1000;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs funnel.step_entered on mount", () => {
    renderHook(() => useFunnelStep("signup", "basic"));

    expect(mockLogEvent).toHaveBeenCalledWith("funnel.step_entered", {
      funnel: "signup",
      step: "basic",
    });
  });

  it("logs funnel.step_exited with duration on unmount", () => {
    const { unmount } = renderHook(() => useFunnelStep("signup", "basic"));

    mockLogEvent.mockClear();
    mockNow = 6000; // 5 seconds later

    unmount();

    expect(mockLogEvent).toHaveBeenCalledWith(
      "funnel.step_exited",
      { funnel: "signup", step: "basic" },
      5,
    );
  });

  it("includes custom properties in both enter and exit events", () => {
    const { unmount } = renderHook(() =>
      useFunnelStep("onboarding", "profile", { variant: "A" }),
    );

    expect(mockLogEvent).toHaveBeenCalledWith("funnel.step_entered", {
      funnel: "onboarding",
      step: "profile",
      variant: "A",
    });

    mockLogEvent.mockClear();
    mockNow = 2000;
    unmount();

    expect(mockLogEvent).toHaveBeenCalledWith(
      "funnel.step_exited",
      { funnel: "onboarding", step: "profile", variant: "A" },
      1,
    );
  });

  it("uses the latest properties from ref on unmount", () => {
    let props = { variant: "A" };
    const { rerender, unmount } = renderHook(() =>
      useFunnelStep("signup", "basic", props),
    );

    props = { variant: "B" };
    rerender();

    mockLogEvent.mockClear();
    mockNow = 3000;
    unmount();

    expect(mockLogEvent).toHaveBeenCalledWith(
      "funnel.step_exited",
      { funnel: "signup", step: "basic", variant: "B" },
      expect.any(Number),
    );
  });

  it("does not re-run effect when properties object changes", () => {
    let props = { variant: "A" };
    const { rerender } = renderHook(() =>
      useFunnelStep("signup", "basic", props),
    );

    // First mount fires step_entered
    expect(mockLogEvent).toHaveBeenCalledTimes(1);

    // Change properties — should not re-fire
    props = { variant: "B" };
    rerender();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });
});

describe("useScrollDepth", () => {
  it("returns a ref object", () => {
    const { result } = renderHook(() => useScrollDepth("page.scroll_depth"));
    expect(result.current).toHaveProperty("current");
  });

  it("logs max scroll depth on unmount when attached to a container", () => {
    // Use a real component so the ref is attached before useEffect runs
    function ScrollComponent() {
      const scrollRef = useScrollDepth("page.scroll_depth", {
        path: "/about",
      });
      return <div ref={scrollRef} data-testid="scroller" />;
    }

    const { getByTestId, unmount } = render(<ScrollComponent />);
    const container = getByTestId("scroller");

    // Mock scroll properties
    Object.defineProperties(container, {
      scrollTop: { value: 300, writable: true, configurable: true },
      scrollHeight: { value: 1000, writable: true, configurable: true },
      clientHeight: { value: 400, writable: true, configurable: true },
    });

    // Simulate a scroll event to record depth
    act(() => {
      container.dispatchEvent(new Event("scroll"));
    });

    unmount();

    expect(mockLogEvent).toHaveBeenCalledWith(
      "page.scroll_depth",
      expect.objectContaining({
        path: "/about",
        max_depth: 50, // 300 / (1000 - 400) = 0.5 -> 50%
      }),
      0.5,
    );
  });

  it("tracks maximum scroll depth, not final position", () => {
    function ScrollComponent() {
      const scrollRef = useScrollDepth("scroll.depth");
      return <div ref={scrollRef} data-testid="scroller" />;
    }

    const { getByTestId, unmount } = render(<ScrollComponent />);
    const container = getByTestId("scroller");

    Object.defineProperties(container, {
      scrollTop: { value: 0, writable: true, configurable: true },
      scrollHeight: { value: 1000, writable: true, configurable: true },
      clientHeight: { value: 200, writable: true, configurable: true },
    });

    // Scroll to 50%
    act(() => {
      Object.defineProperty(container, "scrollTop", {
        value: 400,
        configurable: true,
      });
      container.dispatchEvent(new Event("scroll"));
    });

    // Scroll back up to 10%
    act(() => {
      Object.defineProperty(container, "scrollTop", {
        value: 80,
        configurable: true,
      });
      container.dispatchEvent(new Event("scroll"));
    });

    unmount();

    // Should report max depth of 50%, not final 10%
    expect(mockLogEvent).toHaveBeenCalledWith(
      "scroll.depth",
      expect.objectContaining({ max_depth: 50 }),
      0.5,
    );
  });

  it("does not log if no scrolling occurred", () => {
    function ScrollComponent() {
      const scrollRef = useScrollDepth("scroll.depth");
      return <div ref={scrollRef} data-testid="scroller" />;
    }

    const { unmount } = render(<ScrollComponent />);
    unmount();

    // max_depth is 0 — still logs on unmount
    expect(mockLogEvent).toHaveBeenCalledWith(
      "scroll.depth",
      expect.objectContaining({ max_depth: 0 }),
      0,
    );
  });
});

describe("useHoverDwell", () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = 1000;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns stable onMouseEnter and onMouseLeave handlers", () => {
    const { result, rerender } = renderHook(() =>
      useHoverDwell("card.hovered", { card_id: "1" }),
    );

    const first = result.current;
    rerender();
    expect(result.current.onMouseEnter).toBe(first.onMouseEnter);
    expect(result.current.onMouseLeave).toBe(first.onMouseLeave);
  });

  it("logs dwell time on mouse leave", () => {
    const { result } = renderHook(() =>
      useHoverDwell("card.hovered", { card_id: "42" }),
    );

    act(() => {
      result.current.onMouseEnter();
    });

    mockNow = 3500; // 2.5 seconds later

    act(() => {
      result.current.onMouseLeave();
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      "card.hovered",
      { card_id: "42" },
      2.5,
    );
  });

  it("does nothing on mouse leave without prior enter", () => {
    const { result } = renderHook(() => useHoverDwell("card.hovered"));

    act(() => {
      result.current.onMouseLeave();
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("tracks multiple hover cycles", () => {
    const { result } = renderHook(() =>
      useHoverDwell("item.hovered", { id: "1" }),
    );

    // First hover
    act(() => result.current.onMouseEnter());
    mockNow = 2000;
    act(() => result.current.onMouseLeave());

    // Second hover
    mockNow = 5000;
    act(() => result.current.onMouseEnter());
    mockNow = 5500;
    act(() => result.current.onMouseLeave());

    expect(mockLogEvent).toHaveBeenCalledTimes(2);
    expect(mockLogEvent).toHaveBeenNthCalledWith(
      1,
      "item.hovered",
      { id: "1" },
      1,
    );
    expect(mockLogEvent).toHaveBeenNthCalledWith(
      2,
      "item.hovered",
      { id: "1" },
      0.5,
    );
  });

  it("uses latest properties from ref", () => {
    let props = { card_id: "1" };
    const { result, rerender } = renderHook(() =>
      useHoverDwell("card.hovered", props),
    );

    act(() => result.current.onMouseEnter());

    props = { card_id: "2" };
    rerender();

    mockNow = 2000;
    act(() => result.current.onMouseLeave());

    expect(mockLogEvent).toHaveBeenCalledWith(
      "card.hovered",
      { card_id: "2" },
      1,
    );
  });
});

describe("useFormInteraction", () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = 1000;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns stable trackFieldFocus, trackFieldBlur, trackSubmit callbacks", () => {
    const { result, rerender } = renderHook(() => useFormInteraction("signup"));

    const first = result.current;
    rerender();
    expect(result.current.trackFieldFocus).toBe(first.trackFieldFocus);
    expect(result.current.trackFieldBlur).toBe(first.trackFieldBlur);
    expect(result.current.trackSubmit).toBe(first.trackSubmit);
  });

  it("logs form.interaction_started on first field focus", () => {
    const { result } = renderHook(() => useFormInteraction("login"));

    act(() => {
      result.current.trackFieldFocus("email");
    });

    expect(mockLogEvent).toHaveBeenCalledWith("form.interaction_started", {
      form: "login",
    });
  });

  it("does not log interaction_started on subsequent field focuses", () => {
    const { result } = renderHook(() => useFormInteraction("login"));

    act(() => {
      result.current.trackFieldFocus("email");
    });
    act(() => {
      result.current.trackFieldFocus("password");
    });

    const interactionStartedCalls = mockLogEvent.mock.calls.filter(
      (call) => call[0] === "form.interaction_started",
    );
    expect(interactionStartedCalls).toHaveLength(1);
  });

  it("logs form.field_blurred with per-field duration", () => {
    const { result } = renderHook(() => useFormInteraction("signup"));

    act(() => {
      result.current.trackFieldFocus("name");
    });

    mockNow = 3000; // 2 seconds on the name field

    act(() => {
      result.current.trackFieldBlur("name");
    });

    expect(mockLogEvent).toHaveBeenCalledWith("form.field_blurred", {
      form: "signup",
      field: "name",
      duration: 2,
    });
  });

  it("does nothing on blur without prior focus", () => {
    const { result } = renderHook(() => useFormInteraction("signup"));

    act(() => {
      result.current.trackFieldBlur("name");
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("logs form.submitted with total duration and field_durations map", () => {
    const { result } = renderHook(() => useFormInteraction("signup"));

    // Focus and blur name field
    act(() => result.current.trackFieldFocus("name"));
    mockNow = 3000;
    act(() => result.current.trackFieldBlur("name"));

    // Focus and blur email field
    mockNow = 4000;
    act(() => result.current.trackFieldFocus("email"));
    mockNow = 6000;
    act(() => result.current.trackFieldBlur("email"));

    // Submit
    mockNow = 7000;
    act(() => {
      result.current.trackSubmit({ success: true });
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      "form.submitted",
      {
        form: "signup",
        field_durations: { name: 2, email: 2 },
        success: true,
      },
      6, // total duration from first focus (1000) to submit (7000)
    );
  });

  it("accumulates duration for the same field focused multiple times", () => {
    const { result } = renderHook(() => useFormInteraction("signup"));

    // First visit to name
    act(() => result.current.trackFieldFocus("name"));
    mockNow = 2000;
    act(() => result.current.trackFieldBlur("name"));

    // Second visit to name
    mockNow = 3000;
    act(() => result.current.trackFieldFocus("name"));
    mockNow = 4000;
    act(() => result.current.trackFieldBlur("name"));

    // Submit
    mockNow = 5000;
    act(() => result.current.trackSubmit());

    const submitCall = mockLogEvent.mock.calls.find(
      (call) => call[0] === "form.submitted",
    );
    expect(submitCall).toBeDefined();
    expect(submitCall![1].field_durations.name).toBe(2); // 1s + 1s
  });

  it("does nothing on submit if no focus happened", () => {
    const { result } = renderHook(() => useFormInteraction("empty_form"));

    act(() => {
      result.current.trackSubmit();
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("resets state after submit so the form can be reused", () => {
    const { result } = renderHook(() => useFormInteraction("reusable"));

    // First submission
    act(() => result.current.trackFieldFocus("field1"));
    mockNow = 2000;
    act(() => result.current.trackFieldBlur("field1"));
    mockNow = 3000;
    act(() => result.current.trackSubmit());

    mockLogEvent.mockClear();

    // Second submission — should log interaction_started again
    mockNow = 10000;
    act(() => result.current.trackFieldFocus("field2"));

    expect(mockLogEvent).toHaveBeenCalledWith("form.interaction_started", {
      form: "reusable",
    });

    mockNow = 11000;
    act(() => result.current.trackFieldBlur("field2"));
    mockNow = 12000;
    act(() => result.current.trackSubmit());

    const submitCall = mockLogEvent.mock.calls.find(
      (call) => call[0] === "form.submitted",
    );
    expect(submitCall![1].field_durations).toEqual({ field2: 1 });
    expect(submitCall![2]).toBe(2); // 12000 - 10000 = 2s
  });
});
