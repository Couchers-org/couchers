import { FeatureApiResponse, GrowthBook } from "@growthbook/growthbook";
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
// flag hooks expects one. Mirror that with a ready SDK; with no configured features flag hooks
// return the caller's default and the AppRoute readiness gate passes.
function newGrowthBook(features: FeatureApiResponse["features"] = {}) {
  const growthbook = new GrowthBook();
  growthbook.initSync({ payload: { features } });
  return growthbook;
}

// hookWrapper is used as the component directly (render(x, { wrapper })), so its body runs on every
// render - it must reuse one instance, not allocate per render. The get* factories below run once
// per call, so they each get a fresh, isolated instance instead.
const testGrowthBook = newGrowthBook();

function newQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function Providers({
  client,
  growthbook,
  children,
}: {
  client: QueryClient;
  growthbook: GrowthBook;
  children?: React.ReactNode;
}) {
  return (
    <Suspense fallback="loading...">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={client}>
              <MemoryRouterProvider>
                <AuthProvider>
                  <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
                </AuthProvider>
              </MemoryRouterProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
    </Suspense>
  );
}

export default function hookWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <Providers client={newQueryClient()} growthbook={testGrowthBook}>
      {children}
    </Providers>
  );
}

/**
 * Test utility function for retrieving the wrapper with the React Query client.
 * Useful for when you need access to the client as well for certain tests.
 */
export function getHookWrapperWithClient(features: FeatureApiResponse["features"] = {}) {
  const growthbook = newGrowthBook(features);
  const client = newQueryClient();
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <Providers client={client} growthbook={growthbook}>
      {children}
    </Providers>
  );

  return {
    client,
    wrapper,
  };
}
