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
    borderRadius: 5,
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
  overrides: {
    MuiDialog: { paper: { padding: 0 } },
    MuiDialogTitle: {
      root: {
        padding: spacing(2),
        paddingBottom: 0,
        textAlign: "center",
        //default typography is h2 with h6 styling
        "& > h2": {
          fontSize: 16,
          fontWeight: "bold",
        },
      },
    },
    MuiDialogContent: { root: { padding: spacing(2) } },
    MuiDialogContentText: { root: { padding: spacing(2) } },
    MuiDialogActions: {
      root: {
        display: "flex",
        justifyContent: "space-between",
        padding: spacing(2),
        paddingTop: 0,
        margin: 0,
        "& > button": { marginInline: "auto" },
      },
    },
  },
};

export const theme = createMuiTheme(themeOptions);
