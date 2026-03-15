import { Breakpoint, useMediaQuery } from "@mui/material";
import { theme } from "theme";

export type Screensize =
  // 600 px
  | "SMALL_MOBILE"
  // 900 px
  | "MOBILE"
  // 1200 px
  | "TABLET";

const themeSizes = {
  SMALL_MOBILE: "sm" as Breakpoint,
  MOBILE: "md" as Breakpoint,
  TABLET: "lg" as Breakpoint,
};

export default function useIsScreenSmallerThan(size: Screensize) {
  return useMediaQuery(theme.breakpoints.down(themeSizes[size]));
}
