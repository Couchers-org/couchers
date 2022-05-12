import { createTheme, Theme, useTheme } from "@material-ui/core";
import { useMemo } from "react";

const getImageOverlayTheme = (theme: Theme) =>
  createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      primary: {
        main: "#ffffff",
      },
      text: {
        ...theme.palette.text,
        primary: "#ffffff",
      },
    },
  });

/**
 *
 * @returns
 */
export default function useImageOverlayTheme(): Theme {
  const theme = useTheme();
  const imageOverlayTheme = useMemo(() => getImageOverlayTheme(theme), [theme]);
  return imageOverlayTheme;
}
