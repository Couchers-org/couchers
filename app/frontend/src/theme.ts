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
const navBarHeight = 7;
const navBarPadding = 3; // padding below nav bar

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
  overrides: {
    MuiListItem: { gutters: { paddingLeft: 0, paddingRight: 0 } },
    MuiTabPanel: {
      root: {
        padding: 0,
        paddingTop: spacing(1),
      },
    },
    MuiInputBase: {
      input: {
        fontSize: "1rem",
      },
    },
  },
  palette: {
    background: {
      default: "#fcfcfc",
    },
    common: {
      white: "#fcfcfc",
    },
    error: {
      main: "#ff0000",
    },
    primary: {
      dark: "#20686c",
      light: "#6bc4a6",
      main: "#00a398",
    },
    secondary: {
      dark: "#fe5e01",
      light: "#fe982a",
      main: "#e47701",
    },
    success: {
      main: "#1ac302",
    },
    grey: {
      50: "#f3f3f3",
      100: "#aaafb4",
    },
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
  shape: {
    borderRadius,
    navPaddingDesktop: spacing(10),
    navPaddingMobile: spacing(navBarHeight + navBarPadding),
    scrollBar: {
      "&::-webkit-scrollbar": {
        background: "rgba(0,0,0,0)",
        height: "0.5rem",
        width: "0.5rem",
      },
      "&::-webkit-scrollbar:hover": {
        background: "rgba(0,0,0,0.1)",
        width: "0.5rem",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "rgba(0,0,0,0.2)",
        borderRadius: "20px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: "rgba(0,0,0,0.3)",
      },
      overflow: "auto",
      paddingInlineEnd: spacing(1),
      scrollbarHeight: "thin",
      scrollbarWidth: "thin",
    },
  },
  spacing: spacing,
  typography: {
    allVariants: {
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.875rem", //14px
    },
    body2: {
      fontSize: "0.75rem", //12px
    },
    button: {
      fontSize: "0.875rem", //14px
      textTransform: "none", //don't capitalize
    },
    caption: {
      fontSize: "0.625rem", //10px
    },
    fontFamily: "Ubuntu, sans-serif",
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
    overline: {
      fontSize: "0.875rem", //14px
      fontStyle: "italic",
      [breakpoints.up("md")]: {
        fontSize: "1rem", //14px
      },
    },
  },
};

export const theme = createMuiTheme(themeOptions);
