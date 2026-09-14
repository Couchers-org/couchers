import { useFeatureValue } from "@growthbook/growthbook-react";
import Sentry from "platform/sentry";
import { useEffect } from "react";

// Mask everything: replays cover the whole logged-in app, which is full of other
// people's personal data.
const REPLAY_OPTIONS = { maskAllText: true, maskAllInputs: true, blockAllMedia: true };

/**
 * Attaches Sentry's session replay recorder when sentry_session_replay_enabled is on.
 *
 * Buffer mode records every user on every page, which is how the unflagged version of this
 * froze search pages with many results (#9538). Adding the integration here rather than at
 * Sentry.init is what lets the flag stop recording without a deploy.
 */
export default function SentryReplay() {
  const enabled = useFeatureValue("sentry_session_replay_enabled", false);

  useEffect(() => {
    // rrweb keeps recording until told to stop, and the integration can't be unregistered,
    // so it stays around (inert) once the flag goes off.
    if (!enabled) void Sentry.getReplay()?.stop();
    else if (!Sentry.getReplay()) Sentry.addIntegration(Sentry.replayIntegration(REPLAY_OPTIONS));
  }, [enabled]);

  return null;
}
