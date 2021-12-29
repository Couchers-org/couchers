import { ThemeProvider } from "@material-ui/core";
import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
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
    <Suspense fallback="loading...">
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  );
}

/**
 * Test utility function for retrieving the wrapper with the React Query client.
 * Useful for when you need access to the client as well for certain tests.
 */
export function getHookWrapperWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <Suspense fallback="loading...">
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  );

  return {
    client,
    wrapper,
  };
}
