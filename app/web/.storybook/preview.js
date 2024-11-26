import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "react-query";
import { ThemeProvider as Emotion10ThemeProvider } from "emotion-theming";

import { theme } from "../theme";
import { AuthContext } from "../features/auth/AuthProvider";
import "../fonts";
import "./i18n";
import "./reset.css";
import { Suspense } from "react";

const defaultTheme = createTheme();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    storySort: {
      order: ["Couchers Storybook", "Components"],
    },
  },
};

export const decorators = [
  (Story, context) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: false },
      },
    });
    return (
      <Suspense fallback="loading...">
        <AuthContext.Provider
          value={{ authState: { authenticated: true, userId: 1 } }}
        >
          <StyledEngineProvider injectFirst>
            <Emotion10ThemeProvider theme={defaultTheme}>
              <ThemeProvider theme={theme}>
                <QueryClientProvider client={client}>
                  <Story {...context} />
                </QueryClientProvider>
              </ThemeProvider>
            </Emotion10ThemeProvider>
          </StyledEngineProvider>
        </AuthContext.Provider>
      </Suspense>
    );
  },
];
