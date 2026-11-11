import { useFeatureValue } from "@growthbook/growthbook-react";
import { usePersistedState } from "platform/usePersistedState";
import { useEffect, useState } from "react";
import { useIsClient } from "utils/hooks";

import CelebrationBanner from "./CelebrationBanner";
import CelebrationOverlay from "./CelebrationOverlay";
import { CELEBRATION_100K_FLAG, CELEBRATION_100K_SEEN_KEY } from "./constants";

interface Celebration100kProps {
  /** Play the overlay by itself the first time this device opens the page */
  autoPlay?: boolean;
}

/**
 * The 100k members celebration, switched on and off with a feature flag for the week. Shows a one-row
 * banner with a replay, and (when `autoPlay` is set) plays the overlay once per device.
 */
export default function Celebration100k({ autoPlay = false }: Celebration100kProps) {
  const isEnabled = useFeatureValue(CELEBRATION_100K_FLAG, false);
  // Storage is only readable in the browser, so render nothing until then to avoid a hydration mismatch
  const isClient = useIsClient();
  const [hasSeen, setHasSeen] = usePersistedState(CELEBRATION_100K_SEEN_KEY, false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isEnabled || !isClient || !autoPlay || hasSeen) return;
    // Marked as seen as soon as it starts, so closing early or reloading doesn't play it again
    setHasSeen(true);
    setIsOpen(true);
  }, [isEnabled, isClient, autoPlay, hasSeen, setHasSeen]);

  if (!isEnabled || !isClient) return null;

  return (
    <>
      {(hasSeen || !autoPlay) && <CelebrationBanner onReplay={() => setIsOpen(true)} />}
      <CelebrationOverlay open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
