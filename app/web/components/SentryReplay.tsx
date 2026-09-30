import { useFeatureValue } from "@growthbook/growthbook-react";
import Sentry from "platform/sentry";
import { useEffect } from "react";

const REPLAY_OPTIONS = { maskAllText: true, maskAllInputs: true, blockAllMedia: true };

export default function SentryReplay() {
  const enabled = useFeatureValue("sentry_session_replay_enabled", false);

  useEffect(() => {
    if (!enabled) void Sentry.getReplay()?.stop();
    else if (!Sentry.getReplay()) Sentry.addIntegration(Sentry.replayIntegration(REPLAY_OPTIONS));
  }, [enabled]);

  return null;
}
