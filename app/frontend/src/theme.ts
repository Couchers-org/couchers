import { createMuiTheme, ThemeOptions } from "@material-ui/core";
import type {} from "@material-ui/lab/themeAugmentation";

const spacing = (factor: number) => `${0.5 * factor}rem`;
const borderRadius = 10;

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: "#7d4cb8",
    },
    secondary: {
      main: "#f8aa3a",
    },
  },
  spacing: spacing,
  typography: {
    fontFamily: "Lato, Arial, sans-serif",
    h1: {
      fontSize: 24,
      marginTop: spacing(2),
    },
    h2: {
      fontSize: 20,
      marginTop: spacing(1),
    },
    h3: {
      fontSize: 16,
      marginTop: spacing(1),
    },
    caption: {
      fontSize: 10,
    },
    fontSize: 14,
  },
  shape: {
    borderRadius,
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
  overrides: {
    MuiListItem: { gutters: { paddingLeft: 0, paddingRight: 0 } },
    MuiTabPanel: {
      root: {
        padding: 0,
      },
    },
  },
};

export const theme = createMuiTheme(themeOptions);
