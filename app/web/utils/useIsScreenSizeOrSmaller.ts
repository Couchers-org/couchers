import { Breakpoint, useMediaQuery } from "@mui/material";
import { theme } from "theme";

export type Screensize =
  // 600 px
  | "smallMobile"
  // 900 px
  | "mobile"
  // 1200 px
  | "tablet";

const themeSizes = {
  smallMobile: "sm" as Breakpoint,
  mobile: "md" as Breakpoint,
  tablet: "lg" as Breakpoint,
};

export default function useIsScreenSizeOrSmaller(size: Screensize) {
  return useMediaQuery(theme.breakpoints.down(themeSizes[size]));
}
