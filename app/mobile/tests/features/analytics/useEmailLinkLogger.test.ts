import { renderHook } from "@testing-library/react-native";
import { Linking } from "react-native";

import { useEmailLinkLogger } from "@/features/analytics/useEmailLinkLogger";
import { logEvent } from "@/service/analytics";

jest.mock("@/service/analytics", () => ({
  logEvent: jest.fn(),
}));

const logEventMock = logEvent as jest.Mock;

describe("useEmailLinkLogger", () => {
  const removeSubscription = jest.fn();
  let getInitialURLSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    getInitialURLSpy = jest
      .spyOn(Linking, "getInitialURL")
      .mockResolvedValue(null);
    addEventListenerSpy = jest
      .spyOn(Linking, "addEventListener")
      .mockReturnValue({ remove: removeSubscription } as never);
  });

  afterEach(() => {
    getInitialURLSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  });

  function openLink(url: string) {
    const [, handler] = addEventListenerSpy.mock.calls[0];
    handler({ url });
  }

  it("logs the zz of the link that launched the app, only once", async () => {
    getInitialURLSpy.mockResolvedValue(
      "https://couchers.org/messages/chats/1?zz=abc123&tab=info",
    );

    const { unmount } = renderHook(() => useEmailLinkLogger());
    await Promise.resolve();
    unmount();
    renderHook(() => useEmailLinkLogger());
    await Promise.resolve();

    expect(logEventMock).toHaveBeenCalledTimes(1);
    expect(logEventMock).toHaveBeenCalledWith("email.link_opened", {
      zz: "abc123",
      path: "/messages/chats/1",
    });
  });

  it("logs the zz of a link opened while the app is running", () => {
    renderHook(() => useEmailLinkLogger());

    openLink("https://couchers.org/quick-link?payload=x&sig=y&zz=def456");

    expect(logEventMock).toHaveBeenCalledWith("email.link_opened", {
      zz: "def456",
      path: "/quick-link",
    });
  });

  it("ignores links without a zz", () => {
    renderHook(() => useEmailLinkLogger());

    openLink("https://couchers.org/dashboard");

    expect(logEventMock).not.toHaveBeenCalled();
  });

  it("stops listening on unmount", () => {
    const { unmount } = renderHook(() => useEmailLinkLogger());

    unmount();

    expect(removeSubscription).toHaveBeenCalled();
  });
});
