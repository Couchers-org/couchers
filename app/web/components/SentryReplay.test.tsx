import { GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { act, render } from "@testing-library/react";
import SentryReplay, { SENTRY_SESSION_REPLAY_FLAG } from "components/SentryReplay";
import devFlags from "feature-flags.dev.json";
import Sentry from "platform/sentry";
import React from "react";

jest.mock("platform/sentry", () => {
  const sentry = { addIntegration: jest.fn(), replayIntegration: jest.fn(), getReplay: jest.fn() };
  return { __esModule: true, ...sentry, default: sentry };
});

const REPLAY_INTEGRATION = { name: "Replay" };

const mockedSentry = Sentry as unknown as {
  addIntegration: jest.Mock;
  replayIntegration: jest.Mock;
  getReplay: jest.Mock;
};

let replay: { startBuffering: jest.Mock; stop: jest.Mock };

beforeEach(() => {
  replay = { startBuffering: jest.fn(), stop: jest.fn(() => Promise.resolve()) };
  mockedSentry.replayIntegration.mockReturnValue(REPLAY_INTEGRATION);
  // Model the real SDK: getReplay() is empty until the integration is added, and keeps
  // returning it afterwards - including after a stop().
  mockedSentry.getReplay.mockReturnValue(undefined);
  mockedSentry.addIntegration.mockImplementation(() => mockedSentry.getReplay.mockReturnValue(replay));
});

// Mirrors how FeatureFlagProvider loads feature-flags.dev.json: each value becomes a defaultValue.
// Flags are flipped through one live GrowthBook instance, the way a rollout change reaches a page
// that's already open.
function renderWithFlags(flags: Record<string, unknown>) {
  const toPayload = (values: Record<string, unknown>) => ({
    features: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { defaultValue: value }])),
  });
  const growthbook = new GrowthBook();
  growthbook.initSync({ payload: toPayload(flags) });

  const tree = (
    <GrowthBookProvider growthbook={growthbook}>
      <SentryReplay />
    </GrowthBookProvider>
  );
  const { rerender } = render(tree);

  return {
    rerender: () => rerender(tree),
    setFlags: async (values: Record<string, unknown>) => {
      await act(async () => {
        await growthbook.setPayload(toPayload(values));
      });
    },
  };
}

describe("SentryReplay", () => {
  it.each([
    { name: "the flag is unset", flags: {} },
    { name: "the flag is off", flags: { [SENTRY_SESSION_REPLAY_FLAG]: false } },
  ])("does not record when $name", ({ flags }) => {
    renderWithFlags(flags);
    expect(mockedSentry.addIntegration).not.toHaveBeenCalled();
    expect(replay.stop).not.toHaveBeenCalled();
  });

  it("records with everything masked when the flag is on", () => {
    renderWithFlags({ [SENTRY_SESSION_REPLAY_FLAG]: true });
    expect(mockedSentry.replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    });
    expect(mockedSentry.addIntegration).toHaveBeenCalledWith(REPLAY_INTEGRATION);
  });

  it("records with the committed dev overrides", () => {
    renderWithFlags(devFlags);
    expect(mockedSentry.addIntegration).toHaveBeenCalled();
  });

  it("adds the integration once, not on every render", () => {
    const { rerender } = renderWithFlags({ [SENTRY_SESSION_REPLAY_FLAG]: true });
    rerender();
    rerender();
    expect(mockedSentry.addIntegration).toHaveBeenCalledTimes(1);
  });

  it("stops recording when the flag is turned off mid-session", async () => {
    const { setFlags } = renderWithFlags({ [SENTRY_SESSION_REPLAY_FLAG]: true });
    await setFlags({ [SENTRY_SESSION_REPLAY_FLAG]: false });
    expect(replay.stop).toHaveBeenCalledTimes(1);
  });

  it("restarts the registered integration when the flag comes back on", async () => {
    const { setFlags } = renderWithFlags({ [SENTRY_SESSION_REPLAY_FLAG]: true });
    await setFlags({ [SENTRY_SESSION_REPLAY_FLAG]: false });
    await setFlags({ [SENTRY_SESSION_REPLAY_FLAG]: true });
    expect(replay.startBuffering).toHaveBeenCalledTimes(1);
    expect(mockedSentry.addIntegration).toHaveBeenCalledTimes(1);
  });
});
