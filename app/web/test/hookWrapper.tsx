import { GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouterProvider } from "next-router-mock/MemoryRouterProvider";
import React, { Suspense } from "react";
import { theme } from "theme";

import AuthProvider from "../features/auth/AuthProvider";

// In prod the GrowthBook provider sits at the app root (see pages/_app.tsx), so any component using
// flag hooks expects one. Mirror that here with a fresh, uninitialized SDK; flag hooks will return
// the caller's default and useGrowthBook().ready stays false, which is what tests want.
function makeGrowthBook() {
  return new GrowthBook();
}

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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={client}>
              <MemoryRouterProvider>
                <AuthProvider>
                  <GrowthBookProvider growthbook={makeGrowthBook()}>
                    {children}
                  </GrowthBookProvider>
                </AuthProvider>
              </MemoryRouterProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={client}>
              <MemoryRouterProvider>
                <AuthProvider>
                  <GrowthBookProvider growthbook={makeGrowthBook()}>
                    {children}
                  </GrowthBookProvider>
                </AuthProvider>
              </MemoryRouterProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
    </Suspense>
  );

  return {
    client,
    wrapper,
  };
}
