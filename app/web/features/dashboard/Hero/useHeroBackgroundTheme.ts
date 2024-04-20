import { createTheme, Theme, useTheme } from "@material-ui/core";
import { useMemo } from "react";

const getTheme = (theme: Theme) =>
  createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      primary: {
        main: theme.palette.common.white,
      },
      text: {
        ...theme.palette.text,
        primary: theme.palette.common.white,
      },
    },
    shape: {
      ...theme.shape,
      borderRadius: 32, // px
    },
    typography: {
      ...theme.typography,
      button: {
        ...theme.typography.button,
        color: theme.palette.primary.main,
        fontWeight: 700,
      },
    },
  });

/**
 * Hook that returns a modified theme that adapts text to be over the hero image background
 */
export default function useHeroBackgroundTheme(): Theme {
  const theme = useTheme();
  const imageOverlayTheme = useMemo(() => getTheme(theme), [theme]);
  return imageOverlayTheme;
}
