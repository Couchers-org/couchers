import { createMuiTheme, ThemeOptions } from "@material-ui/core";
import { CSSProperties } from "@material-ui/core/styles/withStyles";
import type {} from "@material-ui/lab/themeAugmentation";

const spacing = (factor: number) => `${0.5 * factor}rem`;
const borderRadius = 10;

declare module "@material-ui/core/styles/shape" {
  interface Shape {
    navPaddingDesktop: ReturnType<typeof spacing>;
    navPaddingMobile: ReturnType<typeof spacing>;
    scrollBar: CSSProperties;
  }
}

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
    navPaddingDesktop: spacing(9),
    navPaddingMobile: spacing(6),
    scrollBar: {
      paddingInlineEnd: spacing(1),
      overflow: "auto",
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": {
        width: "0.5rem",
        background: "rgba(0,0,0,0)",
      },
      "&::-webkit-scrollbar:hover": {
        width: "0.5rem",
        background: "rgba(0,0,0,0.1)",
      },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: "20px",
        background: "rgba(0,0,0,0.2)",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: "rgba(0,0,0,0.3)",
      },
    },
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
        paddingTop: spacing(1),
      },
    },
  },
};

export const theme = createMuiTheme(themeOptions);
