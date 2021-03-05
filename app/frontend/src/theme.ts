import { createMuiTheme, ThemeOptions } from "@material-ui/core";
import createBreakpoints from "@material-ui/core/styles/createBreakpoints";
import { CSSProperties } from "@material-ui/core/styles/withStyles";
import type {} from "@material-ui/lab/themeAugmentation";

declare module "@material-ui/core/styles/createTypography" {
  interface TypographyOptions {
    h1Large?: TypographyStyleOptions;
  }
}

const spacing = (factor: number) => `${0.5 * factor}rem`;
const borderRadius = 12;
const breakpoints = createBreakpoints({});
declare module "@material-ui/core/styles/shape" {
  interface Shape {
    navPaddingDesktop: ReturnType<typeof spacing>;
    navPaddingMobile: ReturnType<typeof spacing>;
    scrollBar: CSSProperties;
  }
}

const themeOptions: ThemeOptions = {
  breakpoints,
  palette: {
    primary: {
      main: "#55185d",
      light: "#84458b",
      dark: "#2a0033",
    },
    secondary: {
      main: "#ffd524",
      light: "#ffff60",
      dark: "#c7a400",
    },
    error: {
      main: "#ff0000",
    },
    success: {
      main: "#1ac302",
    },
  },
  spacing: spacing,
  typography: {
    fontFamily: "Ubuntu, sans-serif",
    allVariants: {
      lineHeight: 1.5,
    },
    h1: {
      fontSize: "1.25rem", //20px
      fontWeight: "bold",
      marginTop: spacing(2),
      [breakpoints.up("md")]: {
        fontSize: "1.5rem", //24px
      },
    },
    h1Large: {
      fontSize: "1.5rem", //24px
      [breakpoints.up("md")]: {
        fontSize: "4rem", //64px
      },
    },
    h2: {
      fontSize: "1rem", //16px
      fontWeight: "bold",
      marginTop: spacing(1),
      [breakpoints.up("md")]: {
        fontSize: "1.25rem", //20px
      },
    },
    h3: {
      fontSize: "0.75rem", //12px
      fontWeight: "bold",
      marginTop: spacing(1),
      [breakpoints.up("md")]: {
        fontSize: "0.875rem", //14px
      },
    },
    body1: {
      fontSize: "0.875rem", //14px
      [breakpoints.up("md")]: {
        fontSize: "1rem", //16px
      },
    },
    body2: {
      fontSize: "0.75rem", //12px
      [breakpoints.up("md")]: {
        fontSize: "0.875rem", //14px
      },
    },
    caption: {
      fontSize: "0.625rem", //10px
      [breakpoints.up("md")]: {
        fontSize: "0.75rem", //12px
      },
    },
    overline: {
      fontSize: "0.875rem", //14px
      fontStyle: "italic",
      [breakpoints.up("md")]: {
        fontSize: "1rem", //14px
      },
    },
    button: {
      fontSize: "0.875rem", //14px
      textTransform: "none", //don't capitalize
      [breakpoints.up("md")]: {
        fontSize: "1rem", //16px
      },
    },
  },
  shape: {
    borderRadius,
    navPaddingDesktop: spacing(10),
    navPaddingMobile: spacing(7),
    scrollBar: {
      paddingInlineEnd: spacing(1),
      overflow: "auto",
      scrollbarWidth: "thin",
      scrollbarHeight: "thin",
      "&::-webkit-scrollbar": {
        width: "0.5rem",
        height: "0.5rem",
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
