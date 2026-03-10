import { useMediaQuery } from "@mui/material";
import { theme } from "theme";

export default function useIsMobile() {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return isMobile;
}
