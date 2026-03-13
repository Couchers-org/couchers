import { useMediaQuery } from "@mui/material";
import { theme } from "theme";

export default function useIsMobile() {
  // below 600 px
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return isMobile;
}
