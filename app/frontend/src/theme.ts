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
    borderRadius: 10,
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
};

export const theme = createMuiTheme(themeOptions);
