import { ThemeProvider } from "@material-ui/core";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";

import { theme } from "../src/theme";
import { AuthContext } from "../src/features/auth/AuthProvider";
import "../src/App.css";
import "../src/test/testI18n";
import "./reset.css";
import { Suspense } from "react";

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
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={client}>
              <MemoryRouter>
                <Story {...context} />
              </MemoryRouter>
            </QueryClientProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </Suspense>
    );
  },
];
