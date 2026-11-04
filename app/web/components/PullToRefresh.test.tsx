import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { useIsNativeEmbed } from "utils/nativeLink";

import PullToRefresh from "./PullToRefresh";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

const mockUseIsNativeEmbed = useIsNativeEmbed as jest.MockedFunction<typeof useIsNativeEmbed>;

function pullDown(target: Element, distance: number) {
  fireEvent.touchStart(target, { touches: [{ clientX: 100, clientY: 0 }] });
  fireEvent.touchMove(target, { touches: [{ clientX: 100, clientY: distance }] });
  fireEvent.touchEnd(target);
}

function renderPullToRefresh() {
  const { client, wrapper } = getHookWrapperWithClient();
  const invalidateQueries = jest.spyOn(client, "invalidateQueries");
  render(<PullToRefresh />, { wrapper });
  return invalidateQueries;
}

describe("PullToRefresh", () => {
  beforeEach(() => {
    mockUseIsNativeEmbed.mockReturnValue(true);
  });

  it("refetches the page's data after a long enough pull", async () => {
    const invalidateQueries = renderPullToRefresh();

    pullDown(document.body, 200);

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalled());
  });

  it("shows how far you've pulled", () => {
    renderPullToRefresh();

    fireEvent.touchStart(document.body, { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchMove(document.body, { touches: [{ clientX: 100, clientY: 60 }] });

    expect(screen.getByRole("progressbar", { name: "Pull down to refresh" })).toBeVisible();
  });

  it("does nothing after a short pull", () => {
    const invalidateQueries = renderPullToRefresh();

    pullDown(document.body, 40);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("does nothing when the pull starts on a map", () => {
    const invalidateQueries = renderPullToRefresh();
    const map = document.createElement("div");
    map.className = "maplibregl-map";
    document.body.appendChild(map);

    pullDown(map, 200);

    expect(invalidateQueries).not.toHaveBeenCalled();
    map.remove();
  });

  it("does nothing outside the mobile app", () => {
    mockUseIsNativeEmbed.mockReturnValue(false);
    const invalidateQueries = renderPullToRefresh();

    pullDown(document.body, 200);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
