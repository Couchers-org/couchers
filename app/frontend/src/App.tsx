import "./App.css";

import {
  Container,
  CssBaseline,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

const useStyles = makeStyles((theme) => ({
  padding: {
    paddingBottom: theme.spacing(10),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
      paddingBottom: theme.spacing(6),
    },
    [theme.breakpoints.up("md")]: {
      paddingBottom: 0,
      paddingTop: theme.spacing(9),
    },
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
            <Navigation />
            <Container maxWidth="md" className={classes.padding}>
              <AppRoutes />
            </Container>
          </AuthProvider>
        </ReactQueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
