import { act, renderHook } from "@testing-library/react";

import { useGooglePlayLink } from "./useGooglePlayLink";

const mockLogEvent = jest.fn();

jest.mock("routes", () => ({
  couchersGooglePlayURL: "https://play.google.com/store/apps/details?id=org.couchers.android",
}));

jest.mock("./eventCollector", () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

beforeEach(() => {
  mockLogEvent.mockReset();
});

describe("useGooglePlayLink", () => {
  it("puts a handoff token in the install referrer and logs it on click", () => {
    const { result } = renderHook(() => useGooglePlayLink());

    const url = new URL(result.current.href);
    const referrer = new URLSearchParams(url.searchParams.get("referrer")!);
    const token = referrer.get("ht");
    expect(url.searchParams.get("id")).toBe("org.couchers.android");
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(mockLogEvent).not.toHaveBeenCalled();

    act(() => result.current.onClick());

    expect(mockLogEvent).toHaveBeenCalledWith("handoff.created", { token, kind: "google_play" });
  });
});
