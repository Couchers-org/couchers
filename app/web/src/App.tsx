import "./App.css";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

function App() {
  //workaround to force re-render on hydration to avoid mismatching jss classNames
  const [, setRender] = useState(0);
  useEffect(() => setRender(1), []);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <ErrorBoundary isFatal>
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
