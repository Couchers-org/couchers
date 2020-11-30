import { createMuiTheme, ThemeOptions } from "@material-ui/core";

const spacing = (factor: number) => `${0.5 * factor}rem`;

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: "#f8aa3a",
    },
    secondary: {
      main: "#b8574c",
    },
  },
  spacing: spacing,
  typography: {
    fontFamily: "Lato, Arial, sans-serif",
    h1: {
      fontSize: 48,
      marginTop: spacing(2),
    },
    h2: {
      fontSize: 36,
      marginTop: spacing(1),
    },
    h3: {
      fontSize: 28,
      marginTop: spacing(1),
    },
  },
  shape: {
    borderRadius: 16,
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
};

export const theme = createMuiTheme(themeOptions);
