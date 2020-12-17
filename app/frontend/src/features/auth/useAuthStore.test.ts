import { renderHook } from "@testing-library/react-hooks";
import { usePersistedState } from "./useAuthStore";

describe("usePersistedState hook", () => {
  it("uses a default value", () => {
    const defaultValue = "Test string";
    const { result } = renderHook(() => usePersistedState("key", defaultValue));
    expect(result.current[0]).toBe(defaultValue);
  });
});
