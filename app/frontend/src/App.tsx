import { Container, CssBaseline, Hidden, ThemeProvider, makeStyles } from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import PageTitle from "./components/PageTitle";
import { theme } from "./theme";

const useStyles = makeStyles(theme => ({
  offset: theme.mixins.toolbar,
}))

function App() {
  const classes = useStyles();
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navigation />
        <Hidden smDown>
          <div className={classes.offset} />
        </Hidden>
        <Container maxWidth="md">
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
