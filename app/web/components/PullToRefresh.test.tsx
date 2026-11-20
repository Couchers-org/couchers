import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { pullToRefresh } from "test/utils";
import { sendNativeHapticImpact, useIsNativeEmbed } from "utils/nativeLink";

import PullToRefresh from "./PullToRefresh";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
  sendNativeHapticImpact: jest.fn(),
}));

const mockUseIsNativeEmbed = useIsNativeEmbed as jest.MockedFunction<typeof useIsNativeEmbed>;
const mockSendNativeHapticImpact = sendNativeHapticImpact as jest.MockedFunction<typeof sendNativeHapticImpact>;

function renderPullToRefresh(extra?: ReactNode) {
  const { client, wrapper } = getHookWrapperWithClient();
  const refetchQueries = jest.spyOn(client, "refetchQueries");
  render(
    <>
      {extra}
      <PullToRefresh queryKeys={[["screen"]]} />
    </>,
    { wrapper },
  );
  return refetchQueries;
}

// Touch at the top, then move down through each y without lifting the finger
function drag(...ys: number[]) {
  fireEvent.touchStart(document.body, { touches: [{ clientX: 100, clientY: 0 }] });
  ys.forEach((y) => fireEvent.touchMove(document.body, { touches: [{ clientX: 100, clientY: y }] }));
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

    drag(60);

    expect(screen.getByRole("progressbar", { name: "Pull down to refresh" })).toBeVisible();
  });

  it("taps once when the pull passes the threshold", () => {
    renderPullToRefresh();

    drag(160, 180);

    expect(mockSendNativeHapticImpact).toHaveBeenCalledTimes(1);
  });

  it("does nothing after a short pull", () => {
    const refetchQueries = renderPullToRefresh();

    pullToRefresh(document.body, 40);

    expect(refetchQueries).not.toHaveBeenCalled();
    expect(mockSendNativeHapticImpact).not.toHaveBeenCalled();
  });

  it("does nothing when the pull starts on a map", () => {
    const refetchQueries = renderPullToRefresh(<div className="maplibregl-map" data-testid="map" />);

    pullToRefresh(screen.getByTestId("map"));

    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it("does nothing outside the mobile app", () => {
    mockUseIsNativeEmbed.mockReturnValue(false);
    const refetchQueries = renderPullToRefresh();

    pullToRefresh();

    expect(refetchQueries).not.toHaveBeenCalled();
  });
});
