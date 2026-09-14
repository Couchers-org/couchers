import { useFeatureValue } from "@growthbook/growthbook-react";
import Sentry from "platform/sentry";
import { useEffect, useRef } from "react";

export const SENTRY_SESSION_REPLAY_FLAG = "sentry_session_replay_enabled";

// Mask everything: replays are recorded across the whole logged-in app, which is
// full of other people's personal data.
const REPLAY_OPTIONS = {
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
};

/**
 * Attaches Sentry's session replay recorder when the feature flag is on.
 *
 * Recording is always-on-and-buffered rather than sampled (see the sample rates in
 * instrumentation-client.ts), so the cost is paid by every user on every page — which is
 * how the first, unflagged attempt at this froze search pages with many results (#9538).
 * The integration is therefore added lazily here instead of at `Sentry.init`, so the flag
 * doubles as a kill switch that takes effect within a flag refresh rather than on the next
 * deploy.
 */
export default function SentryReplay() {
  const enabled = useFeatureValue(SENTRY_SESSION_REPLAY_FLAG, false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (enabled === startedRef.current) return;
    startedRef.current = enabled;

    if (!enabled) {
      // rrweb keeps recording until it's told to stop, and the integration can't be
      // removed once registered, so turning the flag off has to stop it explicitly.
      void Sentry.getReplay()?.stop();
      return;
    }

    const replay = Sentry.getReplay();
    // Adding the integration starts buffering; after a stop() it stays registered but
    // inert, so re-enabling has to restart it by hand.
    if (replay) {
      replay.startBuffering();
    } else {
      Sentry.addIntegration(Sentry.replayIntegration(REPLAY_OPTIONS));
    }
  }, [enabled]);

  return null;
}
