import { styled } from "@mui/material";
import { BOTTOM_NAV_BASE_HEIGHT } from "components/Navigation/constants";

interface StyledFullHeightViewProps {
  isNativeEmbed: boolean;
  embedded?: boolean;
  noOverflow?: boolean;
}

const StyledFullHeightView = styled("div")<StyledFullHeightViewProps>(
  ({ theme, isNativeEmbed, embedded, noOverflow }) => ({
    display: "flex",
    flexDirection: "column",
    ...(noOverflow && { overflow: "hidden" }),
    ...(embedded
      ? { flex: 1, minHeight: 0 }
      : {
          // Use dvh (dynamic viewport height) which adjusts for mobile keyboard
          // Use CSS custom property set by Navigation component for actual height
          height: isNativeEmbed
            ? "calc(100dvh - var(--nav-height, 3.5rem) - var(--cookie-banner-height, 0px))"
            : `calc(100dvh - var(--nav-height, 3.5rem) - ${BOTTOM_NAV_BASE_HEIGHT}px - env(safe-area-inset-bottom, 0px) - var(--cookie-banner-height, 0px))`,

          [theme.breakpoints.up("md")]: {
            // On desktop, only subtract top nav (no bottom nav)
            height: "calc(100dvh - var(--nav-height, 4rem) - var(--cookie-banner-height, 0px))",
          },
        }),
  }),
);

export default StyledFullHeightView;
