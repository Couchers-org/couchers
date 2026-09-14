import { useFeatureValue } from "@growthbook/growthbook-react";
import Sentry from "platform/sentry";
import { useEffect } from "react";

const REPLAY_OPTIONS = { maskAllText: true, maskAllInputs: true, blockAllMedia: true };

// Added here rather than at Sentry.init, which runs before the flag is known. The
// unflagged version froze search pages with many results (#9538).
export default function SentryReplay() {
  const enabled = useFeatureValue("sentry_session_replay_enabled", false);

  useEffect(() => {
    if (!enabled) void Sentry.getReplay()?.stop();
    else if (!Sentry.getReplay()) Sentry.addIntegration(Sentry.replayIntegration(REPLAY_OPTIONS));
  }, [enabled]);

  return null;
}
