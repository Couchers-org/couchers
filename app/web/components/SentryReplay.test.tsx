import { FeatureApiResponse, GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { act, render } from "@testing-library/react";
import SentryReplay from "components/SentryReplay";
import Sentry from "platform/sentry";
import React from "react";

jest.mock("platform/sentry", () => {
  const sentry = { addIntegration: jest.fn(), replayIntegration: jest.fn(), getReplay: jest.fn() };
  return { __esModule: true, ...sentry, default: sentry };
});

const FLAG = "sentry_session_replay_enabled";
const INTEGRATION = { name: "Replay" };
const mockedSentry = Sentry as unknown as Record<"addIntegration" | "replayIntegration" | "getReplay", jest.Mock>;

let replay: { stop: jest.Mock };

beforeEach(() => {
  replay = { stop: jest.fn(() => Promise.resolve()) };
  mockedSentry.replayIntegration.mockReturnValue(INTEGRATION);
  // Model the real SDK: getReplay() is empty until the integration is added, and keeps
  // returning it afterwards - including after a stop().
  mockedSentry.getReplay.mockReturnValue(undefined);
  mockedSentry.addIntegration.mockImplementation(() => mockedSentry.getReplay.mockReturnValue(replay));
});

function payload(value?: boolean): { features: FeatureApiResponse["features"] } {
  return { features: value === undefined ? {} : { [FLAG]: { defaultValue: value } } };
}

// Flags are flipped through one live GrowthBook instance, the way a rollout change reaches a
// page that's already open.
function renderWithFlag(enabled?: boolean) {
  const growthbook = new GrowthBook();
  growthbook.initSync({ payload: payload(enabled) });

  const tree = (
    <GrowthBookProvider growthbook={growthbook}>
      <SentryReplay />
    </GrowthBookProvider>
  );
  const { rerender } = render(tree);
  return {
    rerender: () => rerender(tree),
    setFlag: (value: boolean) => act(() => growthbook.setPayload(payload(value))),
  };
}

describe("SentryReplay", () => {
  it.each([{ enabled: undefined }, { enabled: false }])("does not record when the flag is $enabled", ({ enabled }) => {
    renderWithFlag(enabled);
    expect(mockedSentry.addIntegration).not.toHaveBeenCalled();
    expect(replay.stop).not.toHaveBeenCalled();
  });

  it("records with everything masked when the flag is on", () => {
    renderWithFlag(true);
    expect(mockedSentry.replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
    );
    expect(mockedSentry.addIntegration).toHaveBeenCalledWith(INTEGRATION);
  });

  it("adds the integration once, not on every render", () => {
    const { rerender } = renderWithFlag(true);
    rerender();
    expect(mockedSentry.addIntegration).toHaveBeenCalledTimes(1);
  });

  it("stops recording when the flag is turned off mid-session", async () => {
    const { setFlag } = renderWithFlag(true);
    await setFlag(false);
    expect(replay.stop).toHaveBeenCalledTimes(1);
  });
});
