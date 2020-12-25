import {
  Container,
  CssBaseline,
  Hidden,
  ThemeProvider,
  makeStyles,
} from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import PageTitle from "./components/PageTitle";
import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "./reactQueryClient";
import { theme } from "./theme";

const useStyles = makeStyles((theme) => ({
  padding: {
    paddingBottom: theme.spacing(7),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
      paddingBottom: theme.spacing(6),
    },
    [theme.breakpoints.up("md")]: {
      paddingBottom: 0,
      paddingTop: theme.spacing(8),
    },
  },
}));

function App() {
  const classes = useStyles();
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <ReactQueryClientProvider>
            <CssBaseline />
            <Navigation />
            <Container maxWidth="md" className={classes.padding}>
              <Hidden mdUp>
                <PageTitle>Couchers</PageTitle>
              </Hidden>
              <AppRoutes />
            </Container>
          </ReactQueryClientProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
