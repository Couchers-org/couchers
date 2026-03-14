import { Breakpoint, useMediaQuery } from "@mui/material";
import { theme } from "theme";

export type Screensize =
  // 900 px
  | "MOBILE"
  // 1200 px
  | "TABLET";

const themeSizes = {
  MOBILE: "md" as Breakpoint,
  TABLET: "lg" as Breakpoint,
};

export default function useIsScreenSmallerThan(size: Screensize) {
  return useMediaQuery(theme.breakpoints.down(themeSizes[size]));
}
