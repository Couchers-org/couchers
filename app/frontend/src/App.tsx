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
import { theme } from "./theme";

const useStyles = makeStyles((theme) => ({
  offset: {
    paddingBottom: 56,
    [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
      paddingBottom: 48,
    },
    [theme.breakpoints.up("md")]: {
      paddingBottom: 0,
      paddingTop: 64,
    },
  },
}));

function App() {
  const classes = useStyles();
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navigation />
        <Container maxWidth="md" className={classes.offset}>
          <Hidden mdUp>
            <PageTitle>Couchers</PageTitle>
          </Hidden>
          <AppRoutes />
        </Container>
      </ThemeProvider>
    </Router>
  );
}

export default App;
