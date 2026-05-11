import { act, renderHook } from "@testing-library/react";

import { usePersistedState } from "./usePersistedState";

describe("usePersistedState", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("localStorage (default)", () => {
    it("returns default value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        usePersistedState("test-key", "default"),
      );

      const [value, , , isHydrated] = result.current;
      expect(value).toBe("default");
      // After effect runs, isHydrated is true
      expect(isHydrated).toBe(true);
    });

    it("loads value from localStorage after hydration", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));

      const { result } = renderHook(() =>
        usePersistedState("test-key", "default"),
      );

      // After hydration, value should come from localStorage
      expect(result.current[0]).toBe("stored-value");
      expect(result.current[3]).toBe(true);
    });

    it("persists value to localStorage when setState is called", () => {
      const { result } = renderHook(() =>
        usePersistedState("test-key", "default"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(localStorage.getItem("test-key")).toBe(
        JSON.stringify("new-value"),
      );
    });

    it("clears value from localStorage when clearState is called", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));

      const { result } = renderHook(() =>
        usePersistedState("test-key", "default"),
      );

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBeUndefined();
      expect(localStorage.getItem("test-key")).toBeNull();
    });
  });

  describe("sessionStorage", () => {
    it("reads from sessionStorage immediately and isHydrated=true", () => {
      sessionStorage.setItem("test-key", JSON.stringify("session-value"));

      const { result } = renderHook(() =>
        usePersistedState("test-key", "default", "sessionStorage"),
      );

      const [value, , , isHydrated] = result.current;
      // sessionStorage is read synchronously, so value and isHydrated are ready immediately
      expect(value).toBe("session-value");
      expect(isHydrated).toBe(true);
    });

    it("returns default when sessionStorage is empty", () => {
      const { result } = renderHook(() =>
        usePersistedState("test-key", "default", "sessionStorage"),
      );

      expect(result.current[0]).toBe("default");
      expect(result.current[3]).toBe(true);
    });
  });

  describe("hydration behavior", () => {
    /**
     * This test documents the key architectural difference:
     *
     * - localStorage: The initial useState value is always the default, NOT the
     *   stored value. The stored value is loaded via useEffect after hydration.
     *   This prevents React hydration mismatches where SSR renders with default
     *   but client would render with stored value.
     *
     * - sessionStorage: Reads immediately since it's per-tab data that doesn't
     *   exist during SSR anyway.
     *
     * Note: In React Testing Library, effects run synchronously after render,
     * so we can't observe the intermediate isHydrated=false state directly.
     * The real SSR scenario is: server renders with default -> client hydrates
     * with default (matching server) -> effect runs and loads actual value.
     */
    it("localStorage defers reading to useEffect for SSR compatibility", () => {
      localStorage.setItem("local-key", JSON.stringify("local-value"));
      sessionStorage.setItem("session-key", JSON.stringify("session-value"));

      const localResult = renderHook(() =>
        usePersistedState("local-key", "default", "localStorage"),
      );

      const sessionResult = renderHook(() =>
        usePersistedState("session-key", "default", "sessionStorage"),
      );

      // After effects run, both have their stored values and are hydrated
      expect(localResult.result.current[0]).toBe("local-value");
      expect(localResult.result.current[3]).toBe(true);

      expect(sessionResult.result.current[0]).toBe("session-value");
      expect(sessionResult.result.current[3]).toBe(true);
    });

    it("exposes isHydrated flag for consumers to gate logic", () => {
      // The isHydrated flag allows consumers (like useCurrentUser) to wait
      // for localStorage to be loaded before making decisions like redirects
      const { result } = renderHook(() =>
        usePersistedState<number | null>("userId", null),
      );

      // After hydration, isHydrated is true and value is loaded
      expect(result.current[3]).toBe(true);

      // Consumer can now safely check if userId is null (meaning not logged in)
      // vs null because we haven't loaded from localStorage yet
    });
  });
});
