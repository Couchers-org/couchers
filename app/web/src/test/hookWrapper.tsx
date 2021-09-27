import { ThemeProvider } from "@material-ui/core";
import { LocationDescriptor } from "history";
import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { theme } from "theme";

import AuthProvider from "../features/auth/AuthProvider";

export default function hookWrapper({
  children,
}: {
  children?: React.ReactNode;
}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <QueryClientProvider client={client}>
            <AuthProvider>{children}</AuthProvider>
          </QueryClientProvider>
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

interface HookWrapperConfig {
  initialIndex?: number;
  initialRouterEntries?: LocationDescriptor[];
}

/**
 * Test utility function for retrieving the wrapper with the React Query client.
 * Useful for when you need access to the client as well for certain tests.
 */
export function getHookWrapperWithClient({
  initialIndex,
  initialRouterEntries,
}: HookWrapperConfig = {}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialIndex={initialIndex}
          initialEntries={initialRouterEntries}
        >
          <QueryClientProvider client={client}>
            <AuthProvider>{children}</AuthProvider>
          </QueryClientProvider>
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>
  );

  return {
    client,
    wrapper,
  };
}
