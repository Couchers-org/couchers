import { styled } from "@mui/material";
import FadingScrollTrack, { cardScrollDistance } from "components/FadingScrollTrack";
import { ComponentProps, ReactNode, RefCallback, useCallback, useRef, useState } from "react";

export interface CardTrackState {
  ref: RefCallback<HTMLDivElement>;
  onScroll: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  // shaped to spread straight into DashboardSectionHeader or other arrow controls
  navProps: {
    hasPrevious: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
  };
}

interface CardTrackProps extends Omit<ComponentProps<typeof FadingScrollTrack>, "ref" | "onScroll"> {
  // omit for tracks with no arrows, e.g. loading skeletons
  track?: CardTrackState;
  cardWidth: number;
  // used below the md breakpoint; defaults to cardWidth
  mobileCardWidth?: number;
  gap?: number;
  children: ReactNode;
}

// A card never takes more than this share of the track, so the next card always peeks in on phones.
const MAX_CARD_SHARE = "85%";

const Track = styled(FadingScrollTrack, {
  shouldForwardProp: (prop) => prop !== "$cardWidth" && prop !== "$mobileCardWidth",
})<{ $cardWidth: number; $mobileCardWidth: number }>(({ theme, $cardWidth, $mobileCardWidth }) => ({
  // Sizing lives on the track so every child gets it, wrapped or not.
  "& > *": {
    flex: `0 0 min(${$cardWidth}px, ${MAX_CARD_SHARE})`,
    // flex items default to min-width: auto, so a long unbroken word would stretch the card
    minWidth: 0,
    overflowWrap: "anywhere",
    scrollSnapAlign: "start",
    [theme.breakpoints.down("md")]: {
      flexBasis: `min(${$mobileCardWidth}px, ${MAX_CARD_SHARE})`,
    },
  },
}));

/**
 * Scroll state for a CardTrack. Re-measures itself when the track resizes or its cards change.
 */
export function useCardTrack({ maxCardsPerScroll = 2 } = {}): CardTrackState {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const onScroll = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    // scrollLeft is fractional on high-DPI screens, so allow a pixel of slack at the end
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      if (!node) return;
      onScroll();
      // jsdom has neither observer
      const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onScroll) : null;
      const mutation = typeof MutationObserver !== "undefined" ? new MutationObserver(onScroll) : null;
      resize?.observe(node);
      mutation?.observe(node, { childList: true });
      return () => {
        resize?.disconnect();
        mutation?.disconnect();
        nodeRef.current = null;
      };
    },
    [onScroll],
  );

  const scroll = (dir: 1 | -1) => {
    const el = nodeRef.current;
    if (!el) return;
    // measure the real card, since its width depends on the breakpoint and track width
    const cardWidth = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * cardScrollDistance(el, cardWidth, gap, maxCardsPerScroll), behavior: "smooth" });
  };

  return {
    ref,
    onScroll,
    canScrollLeft,
    canScrollRight,
    navProps: {
      hasPrevious: canScrollLeft,
      hasNext: canScrollRight,
      onPrevious: () => scroll(-1),
      onNext: () => scroll(1),
    },
  };
}

/**
 * Horizontal row of fixed-width cards. Use this for any card carousel rather than FadingScrollTrack
 * directly: it caps card width, stops long text stretching cards, and narrows cards on phones.
 * Cards stretch to equal height on their own; don't set `height: 100%` on a card's root, which stops that.
 */
export default function CardTrack({
  track,
  cardWidth,
  mobileCardWidth = cardWidth,
  gap = 12,
  children,
  ...rest
}: CardTrackProps) {
  return (
    <Track
      ref={track?.ref}
      onScroll={track?.onScroll}
      $gap={gap}
      $snapType="x proximity"
      $canScrollLeft={track?.canScrollLeft}
      $canScrollRight={track?.canScrollRight}
      $cardWidth={cardWidth}
      $mobileCardWidth={mobileCardWidth}
      {...rest}
    >
      {children}
    </Track>
  );
}
