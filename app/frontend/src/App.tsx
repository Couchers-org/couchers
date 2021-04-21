import "./App.css";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import ErrorFallback from "components/ErrorFallback";
import React from "react";
import { ErrorBoundary as FatalErrorBoundary } from "react-error-boundary";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <FatalErrorBoundary fallbackRender={() => <ErrorFallback isFatal />}>
          <ReactQueryClientProvider>
            <AuthProvider>
              <ErrorBoundary>
                <CssBaseline />
                <EnvironmentBanner />
                <AppRoutes />
              </ErrorBoundary>
            </AuthProvider>
          </ReactQueryClientProvider>
        </FatalErrorBoundary>
      </ThemeProvider>
    </Router>
  );
}

export default App;
