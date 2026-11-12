import { CircularProgress, Paper } from "@mui/material";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { useIsNativeEmbed } from "utils/nativeLink";

const PULL_THRESHOLD_PX = 70;
const MAX_PULL_PX = 100;
// the indicator moves at half the finger's speed, so it feels like it resists
const PULL_RESISTANCE = 0.5;
const INDICATOR_SIZE_PX = 40;

interface PullToRefreshProps {
  // refetched by prefix, so ["event", 1] also covers ["event", 1, "summary"]
  queryKeys: QueryKey[];
}

// Pulling on these should scroll or pan them, not refresh the page
function startsInsideScrollable(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest(".maplibregl-map, [role='dialog']")) return true;
  for (let el: Element | null = target; el; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

/**
 * Pull down at the top of the page to refetch its data. Only in the mobile app:
 * mobile browsers have their own pull to refresh, and desktop has no pull gesture.
 * Render it on screens with live content (messages, discussions), not on forms or settings.
 * Only refetches the screen's own queryKeys, not app-wide ones like ping or the current user.
 */
export default function PullToRefresh({ queryKeys }: PullToRefreshProps) {
  const { t } = useTranslation(GLOBAL);
  const isNativeEmbed = useIsNativeEmbed();
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const pullRef = useRef(0);
  const isRefreshingRef = useRef(false);
  // a ref so a new array each render doesn't re-attach the touch listeners
  const queryKeysRef = useRef(queryKeys);
  queryKeysRef.current = queryKeys;

  useEffect(() => {
    if (!isNativeEmbed) return;

    const updatePull = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const canPull =
        !isRefreshingRef.current &&
        event.touches.length === 1 &&
        window.scrollY <= 0 &&
        !startsInsideScrollable(event.target);
      startRef.current = canPull ? { x: touch.clientX, y: touch.clientY } : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!startRef.current) return;
      const touch = event.touches[0];
      const dy = touch.clientY - startRef.current.y;
      const dx = Math.abs(touch.clientX - startRef.current.x);
      // a sideways swipe isn't a pull
      if (dx > dy) {
        startRef.current = null;
        updatePull(0);
        return;
      }
      updatePull(Math.min(Math.max(dy * PULL_RESISTANCE, 0), MAX_PULL_PX));
    };

    const handleTouchEnd = async () => {
      const shouldRefresh = startRef.current !== null && pullRef.current >= PULL_THRESHOLD_PX;
      startRef.current = null;
      updatePull(0);
      if (!shouldRefresh) return;

      isRefreshingRef.current = true;
      setIsRefreshing(true);
      try {
        // "active" skips cached variants nothing on screen uses; awaiting keeps the spinner until data is back
        await Promise.all(
          queryKeysRef.current.map((queryKey) => queryClient.refetchQueries({ queryKey, type: "active" })),
        );
      } finally {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isNativeEmbed, queryClient]);

  if (!isNativeEmbed || (pull === 0 && !isRefreshing)) return null;

  const offset = isRefreshing ? PULL_THRESHOLD_PX : pull;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        top: 0,
        left: "50%",
        zIndex: (theme) => theme.zIndex.appBar + 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: INDICATOR_SIZE_PX,
        height: INDICATOR_SIZE_PX,
        borderRadius: "50%",
        transform: `translate(-50%, ${offset - INDICATOR_SIZE_PX}px)`,
      }}
    >
      <CircularProgress
        size={24}
        aria-label={t("pull_to_refresh_progress_a11y")}
        variant={isRefreshing ? "indeterminate" : "determinate"}
        value={Math.min((pull / PULL_THRESHOLD_PX) * 100, 100)}
      />
    </Paper>
  );
}
