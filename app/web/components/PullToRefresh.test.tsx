import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { pullToRefresh } from "test/utils";
import { useIsNativeEmbed } from "utils/nativeLink";

import PullToRefresh from "./PullToRefresh";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

const mockUseIsNativeEmbed = useIsNativeEmbed as jest.MockedFunction<typeof useIsNativeEmbed>;

function renderPullToRefresh() {
  const { client, wrapper } = getHookWrapperWithClient();
  const refetchQueries = jest.spyOn(client, "refetchQueries");
  render(<PullToRefresh queryKeys={[["screen"]]} />, { wrapper });
  return refetchQueries;
}

function ScreenWithAppWideQuery({ fetchScreen, fetchPing }: { fetchScreen: () => string; fetchPing: () => string }) {
  useQuery({ queryKey: ["screen", 1], queryFn: fetchScreen });
  useQuery({ queryKey: ["ping"], queryFn: fetchPing });
  return <PullToRefresh queryKeys={[["screen", 1]]} />;
}

describe("PullToRefresh", () => {
  beforeEach(() => {
    mockUseIsNativeEmbed.mockReturnValue(true);
  });

  it("refetches only the screen's queries after a long enough pull", async () => {
    const fetchScreen = jest.fn(() => "screen");
    const fetchPing = jest.fn(() => "ping");
    const { wrapper } = getHookWrapperWithClient();
    render(<ScreenWithAppWideQuery fetchScreen={fetchScreen} fetchPing={fetchPing} />, { wrapper });
    await waitFor(() => expect(fetchScreen).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchPing).toHaveBeenCalledTimes(1));

    pullToRefresh();

    await waitFor(() => expect(fetchScreen).toHaveBeenCalledTimes(2));
    expect(fetchPing).toHaveBeenCalledTimes(1);
  });

  it("shows how far you've pulled", () => {
    renderPullToRefresh();

    fireEvent.touchStart(document.body, { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchMove(document.body, { touches: [{ clientX: 100, clientY: 60 }] });

    expect(screen.getByRole("progressbar", { name: "Pull down to refresh" })).toBeVisible();
  });

  it("does nothing after a short pull", () => {
    const refetchQueries = renderPullToRefresh();

    pullToRefresh(document.body, 40);

    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it("does nothing when the pull starts on a map", () => {
    const refetchQueries = renderPullToRefresh();
    const map = document.createElement("div");
    map.className = "maplibregl-map";
    document.body.appendChild(map);

    pullToRefresh(map);

    expect(refetchQueries).not.toHaveBeenCalled();
    map.remove();
  });

  it("does nothing outside the mobile app", () => {
    mockUseIsNativeEmbed.mockReturnValue(false);
    const refetchQueries = renderPullToRefresh();

    pullToRefresh();

    expect(refetchQueries).not.toHaveBeenCalled();
  });
});
