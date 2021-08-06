import "./App.css";

import {
  createGenerateClassName,
  CssBaseline,
  StylesProvider,
  ThemeProvider,
} from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

//for react-snap https://github.com/stereobooster/react-snap/issues/99
const generateClassName = createGenerateClassName({
  productionPrefix: navigator.userAgent === "ReactSnap" ? "snap" : "jss",
});

function App() {
  return (
    <Router>
      <StylesProvider generateClassName={generateClassName}>
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
      </StylesProvider>
    </Router>
  );
}

export default App;
