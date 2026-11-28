import { styled } from "@mui/material";
import { BOTTOM_NAV_BASE_HEIGHT } from "components/Navigation/constants";

interface StyledFullHeightViewProps {
  isNativeEmbed: boolean;
  embedded?: boolean;
}

const StyledFullHeightView = styled("div")<StyledFullHeightViewProps>(({ theme, isNativeEmbed, embedded }) => ({
  display: "flex",
  flexDirection: "column",
  ...(embedded
    ? { flex: 1, minHeight: 0 }
    : {
        height: isNativeEmbed
          ? "calc(100dvh - var(--nav-height, 3.5rem) - var(--cookie-banner-height, 0px))"
          : `calc(100dvh - var(--nav-height, 3.5rem) - ${BOTTOM_NAV_BASE_HEIGHT}px - env(safe-area-inset-bottom, 0px) - var(--cookie-banner-height, 0px))`,

        [theme.breakpoints.up("md")]: {
          height: "calc(100dvh - var(--nav-height, 4rem) - var(--cookie-banner-height, 0px))",
        },
      }),
}));

export default StyledFullHeightView;
