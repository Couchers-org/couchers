import { render } from "@testing-library/react";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { useIsNativeEmbed } from "utils/nativeLink";

import NativeMobileNavigationHandler from "./NativeMobileNavigationHandler";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

const mockUseIsNativeEmbed = useIsNativeEmbed as jest.MockedFunction<typeof useIsNativeEmbed>;

function sendMessage(data: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(data) }));
}

describe("NativeMobileNavigationHandler", () => {
  it("refetches the page's data when the app asks for a refresh", () => {
    mockUseIsNativeEmbed.mockReturnValue(true);
    const { client, wrapper } = getHookWrapperWithClient();
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    render(<NativeMobileNavigationHandler />, { wrapper });
    sendMessage({ type: "MOBILE_REFRESH" });

    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("ignores refresh messages outside the app", () => {
    mockUseIsNativeEmbed.mockReturnValue(false);
    const { client, wrapper } = getHookWrapperWithClient();
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    render(<NativeMobileNavigationHandler />, { wrapper });
    sendMessage({ type: "MOBILE_REFRESH" });

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
