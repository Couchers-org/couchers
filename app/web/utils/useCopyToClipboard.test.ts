import { act, renderHook } from "@testing-library/react";

import useCopyToClipboard from "./useCopyToClipboard";

function mockClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("useCopyToClipboard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("copies the text and resets the status afterwards", async () => {
    jest.useFakeTimers();
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(() => result.current.copy("hello"));

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("copied");
    expect(result.current.copiedText).toBe("hello");

    act(() => jest.advanceTimersByTime(1000));

    expect(result.current.status).toBe("idle");
    expect(result.current.copiedText).toBeNull();
  });

  it("reports a failure when the clipboard rejects", async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy("hello"));

    expect(result.current.status).toBe("failed");
  });

  it("reports a failure when the clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy("hello"));

    expect(result.current.status).toBe("failed");
  });
});
