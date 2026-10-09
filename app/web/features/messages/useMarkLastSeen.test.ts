import { act, renderHook } from "@testing-library/react";

import { MARK_LAST_SEEN_TIMEOUT } from "./constants";
import useMarkLastSeen from "./useMarkLastSeen";

jest.useFakeTimers();

describe("useMarkLastSeen", () => {
  it("debounces then marks the latest seen message", () => {
    const mutate = jest.fn();
    const { result } = renderHook(() => useMarkLastSeen(mutate, 0));

    act(() => {
      result.current.markLastSeen(3);
      result.current.markLastSeen(5);
    });
    expect(mutate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(MARK_LAST_SEEN_TIMEOUT);
    });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(5);
  });

  it("does not mark messages already seen", () => {
    const mutate = jest.fn();
    const { result } = renderHook(() => useMarkLastSeen(mutate, 10));

    act(() => {
      result.current.markLastSeen(8);
      jest.advanceTimersByTime(MARK_LAST_SEEN_TIMEOUT);
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("flushes a pending mark-seen on unmount (e.g. navigating back quickly)", () => {
    const mutate = jest.fn();
    const { result, unmount } = renderHook(() => useMarkLastSeen(mutate, 0));

    act(() => {
      result.current.markLastSeen(7);
    });
    // debounce hasn't fired yet
    expect(mutate).not.toHaveBeenCalled();

    unmount();
    // the pending mark is flushed synchronously so its onSuccess invalidation runs
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(7);
  });

  it("does not double-mark on unmount once the debounce already fired", () => {
    const mutate = jest.fn();
    const { result, unmount } = renderHook(() => useMarkLastSeen(mutate, 0));

    act(() => {
      result.current.markLastSeen(7);
      jest.advanceTimersByTime(MARK_LAST_SEEN_TIMEOUT);
    });
    expect(mutate).toHaveBeenCalledTimes(1);

    unmount();
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
