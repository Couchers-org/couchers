import { useMediaQuery } from "@mui/material";
import { theme } from "theme";

export default function useIsTabletOrSmaller() {
  // below 900 px
  const isTabletOrSmaller = useMediaQuery(theme.breakpoints.down("md"));
  return isTabletOrSmaller;
}
