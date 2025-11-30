import type {} from "@mui/lab/themeAugmentation";
import { createTheme, PaletteOptions } from "@mui/material";
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

// Shared brand colors (consistent across light/dark modes)
const brandColors = {
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
  error: {
    main: "#ff0000",
  },
  success: {
    main: "#1ac302",
  },
};

const lightPalette: PaletteOptions = {
  mode: "light",
  ...brandColors,
  background: {
    default: "#fcfcfc",
    paper: "#fff",
  },
  common: {
    black: "#313539",
    white: "#fcfcfc",
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
};

const darkPalette: PaletteOptions = {
  mode: "dark",
  ...brandColors,
  background: {
    default: "#121212",
    paper: "#1e1e1e",
  },
  common: {
    black: "#121212",
    white: "#e0e0e0",
  },
  grey: {
    50: "#2a2a2a",
    100: "#6a6a6a",
    200: "#3a3a3a",
    600: "#a0a0a0",
  },
  text: {
    primary: "#e0e0e0",
    secondary: "#a0a0a0",
  },
};

const baseThemeOptions: Omit<ThemeOptions, "palette"> = {
  components: {
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

export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: lightPalette,
});

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: darkPalette,
});

// Default export for backwards compatibility
export const theme = lightTheme;

// Map style URLs
// For local development, use the public folder path
// For production, these will be served from the CDN
export const mapStyleUrls = {
  light: "https://cdn.couchers.org/maps/couchers-basemap-style-v1.json",
  dark: "/couchers-basemap-style-v1-dark.json",
} as const;
