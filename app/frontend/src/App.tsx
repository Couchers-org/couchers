import "./App.css";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import ErrorFallback from "components/ErrorFallback";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <ErrorBoundary fallbackRender={() => <ErrorFallback isFatal />}>
          <ReactQueryClientProvider>
            <AuthProvider>
              <CssBaseline />
              <EnvironmentBanner />
              <AppRoutes />
            </AuthProvider>
          </ReactQueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Router>
  );
}

export default App;
