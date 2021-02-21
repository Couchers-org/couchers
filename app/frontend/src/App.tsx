import "./App.css";

import {
  Container,
  CssBaseline,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import AuthPage from "./features/auth/AuthPage";
import AuthProvider from "./features/auth/AuthProvider";
import Login from "./features/auth/login/Login";
import Signup from "./features/auth/signup/Signup";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { authRoute, loginRoute, signupRoute } from "./routes";
import { theme } from "./theme";

const useStyles = makeStyles((theme) => ({
  standardContainer: {
    paddingBottom: theme.shape.navPaddingMobile,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      paddingBottom: 0,
      paddingTop: theme.shape.navPaddingDesktop,
    },
  },
  fullscreenContainer: {
    padding: 0,
    margin: 0,
  },
}));

function App() {
  const classes = useStyles();
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <ReactQueryClientProvider>
          <AuthProvider>
            <CssBaseline />
            <Switch>
              <Route path={authRoute}>
                <Container
                  maxWidth="md"
                  className={classes.fullscreenContainer}
                >
                  <AuthPage />
                </Container>
              </Route>
              <Route path={`${loginRoute}/:urlToken?`}>
                <Login />
              </Route>
              <Route path={`${signupRoute}/:urlToken?`}>
                <Signup />
              </Route>
              <Route path="/">
                <Container maxWidth="md" className={classes.standardContainer}>
                  <Navigation />
                  <AppRoutes />
                </Container>
              </Route>
            </Switch>
          </AuthProvider>
        </ReactQueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
