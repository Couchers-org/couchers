import "./App.css";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import HtmlMeta from "components/HtmlMeta";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ThemeProvider theme={theme}>
          <ErrorBoundary isFatal>
            <ReactQueryClientProvider>
              <AuthProvider>
                <CssBaseline />
                <EnvironmentBanner />
                <HtmlMeta />
                <AppRoutes />
              </AuthProvider>
            </ReactQueryClientProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
