import { Box, styled } from "@mui/material";

const FADE = "40px";

const FadingScrollTrack = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "$canScrollLeft" && prop !== "$canScrollRight" && prop !== "$gap" && prop !== "$snapType",
})<{
  $canScrollLeft?: boolean;
  $canScrollRight?: boolean;
  $gap?: number;
  $snapType?: "x mandatory" | "x proximity";
}>(({ $canScrollLeft, $canScrollRight, $gap = 16, $snapType = "x mandatory" }) => {
  const mask =
    $canScrollLeft && $canScrollRight
      ? `linear-gradient(to right, transparent, black ${FADE}, black calc(100% - ${FADE}), transparent)`
      : $canScrollLeft
        ? `linear-gradient(to right, transparent, black ${FADE})`
        : $canScrollRight
          ? `linear-gradient(to left, transparent, black ${FADE})`
          : undefined;
  return {
    display: "flex",
    gap: `${$gap}px`,
    overflowX: "auto",
    scrollSnapType: $snapType,
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
    ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : {}),
  };
});

export default FadingScrollTrack;
