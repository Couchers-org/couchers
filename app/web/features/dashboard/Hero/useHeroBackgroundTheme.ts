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
 * Hook that returns a modified theme that adapts text to be over the hero image background
 */
export default function useHeroBackgroundTheme(): Theme {
  const theme = useTheme();
  const imageOverlayTheme = useMemo(() => getImageOverlayTheme(theme), [theme]);
  return imageOverlayTheme;
}
