import type {} from "@mui/lab/themeAugmentation";
import { createTheme } from "@mui/material";
import { ThemeOptions } from "@mui/material/styles";
import { createBreakpoints } from "@mui/system";

const breakpoints = createBreakpoints({});
const spacing = (factor: number) => `${0.5 * factor}rem`;
const borderRadius = 4;
const navBarHeightXs = 3.5; //rem
const navBarHeightSmUp = 4; //rem

declare module "@mui/material/styles" {
  interface Shape {
    borderRadius: number;
    navPaddingSmUp: string;
    navPaddingXs: string;
  }

  interface Theme {
    shape: Shape;
  }

  interface ThemeOptions {
    shape?: Partial<Shape>;
  }
}

const themeOptions: ThemeOptions = {
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme",
  },
  colorSchemes: {
    dark: {
      palette: {
        background: {
          default: "#313539",
          paper: "#313539",
        },
        primary: {
          main: "#6bc4a6",
          light: "#8fd4ba",
          dark: "#00a398",
        },
        secondary: {
          main: "#fe982a",
          light: "#ffad52",
          dark: "#e47701",
        },
        text: {
          primary: "#fff",
          secondary: "rgba(255, 255, 255, 0.7)",
        },
        divider: "rgba(255, 255, 255, 0.12)",
        grey: {
          50: "#2a2e32",
          100: "#3d4347",
          200: "#4a5056",
          300: "#5a6066",
          500: "#8a8f94",
          600: "#b0b5ba",
          900: "#1a1d20",
        },
        action: {
          active: "#fff",
          hover: "rgba(255, 255, 255, 0.08)",
          selected: "rgba(255, 255, 255, 0.16)",
          disabled: "rgba(255, 255, 255, 0.3)",
          disabledBackground: "rgba(255, 255, 255, 0.12)",
        },
      },
    },
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          textDecoration: "none",
          color: "inherit",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": { color: "inherit" },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          // Target autofill on the input element with high specificity
          "& input:-webkit-autofill": {
            WebkitBoxShadow:
              "0 0 0 1000px var(--mui-palette-background-paper) inset !important",
            WebkitTextFillColor: "var(--mui-palette-text-primary)",
            caretColor: "var(--mui-palette-text-primary)",
            borderRadius: "inherit",
            transition:
              "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s",
          },
          "& input:-webkit-autofill:hover": {
            WebkitBoxShadow:
              "0 0 0 1000px var(--mui-palette-background-paper) inset !important",
            WebkitTextFillColor: "var(--mui-palette-text-primary)",
            caretColor: "var(--mui-palette-text-primary)",
          },
          "& input:-webkit-autofill:focus": {
            WebkitBoxShadow:
              "0 0 0 1000px var(--mui-palette-background-paper) inset !important",
            WebkitTextFillColor: "var(--mui-palette-text-primary)",
            caretColor: "var(--mui-palette-text-primary)",
          },
          "& input:-webkit-autofill:active": {
            WebkitBoxShadow:
              "0 0 0 1000px var(--mui-palette-background-paper) inset !important",
            WebkitTextFillColor: "var(--mui-palette-text-primary)",
            caretColor: "var(--mui-palette-text-primary)",
          },
        },
        input: {
          fontSize: "1rem",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    // Bc this change in v5 https://github.com/mui/material-ui/pull/26458
    MuiTab: {
      styleOverrides: {
        root: {
          // up-sm
          "@media screen and (min-width: 600px)": {
            minWidth: 160,
          },
        },
      },
    },
    MuiTabPanel: {
      styleOverrides: {
        root: {
          padding: 0,
          paddingTop: spacing(1),
        },
      },
    },
  },
  palette: {
    background: {
      default: "#fcfcfc",
      paper: "#fff",
    },
    common: {
      black: "#313539",
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
      200: "#e9e9e9",
      600: "#767676",
    },
    text: {
      primary: "#313539",
      secondary: "#767676",
    },
  },
  shape: {
    borderRadius,
    navPaddingSmUp: `${navBarHeightSmUp}rem`,
    navPaddingXs: `${navBarHeightXs}rem`,
  },
  spacing: spacing,
  typography: {
    allVariants: {
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem", //16px
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
      [breakpoints.up("md")]: {
        fontSize: "1.5rem", //24px
      },
    },
    h2: {
      fontSize: "1rem", //16px
      fontWeight: "bold",
      [breakpoints.up("md")]: {
        fontSize: "1.25rem", //20px
      },
    },
    h3: {
      fontSize: "0.875rem", //14px
      fontWeight: "bold",
      [breakpoints.up("md")]: {
        fontSize: "1rem", //16px
      },
    },
    h4: {
      fontSize: "0.75rem", //12px
      fontWeight: "bold",
      [breakpoints.up("md")]: {
        fontSize: "0.875rem", //14px
      },
    },
    h5: {
      fontSize: "0.75rem", //12px
      fontWeight: "bold",
      [breakpoints.up("md")]: {
        fontSize: "0.875rem", //14px
      },
    },
    h6: {
      fontSize: "0.75rem", //12px
      fontWeight: "bold",
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
    subtitle1: {
      fontSize: "1rem", //16px
    },
  },
};

export const theme = createTheme(themeOptions);
