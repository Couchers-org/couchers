import { Container, CssBaseline, ThemeProvider } from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import PageTitle from "./components/PageTitle";
import { theme } from "./theme";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="md">
          <PageTitle>Couchers</PageTitle>
          <Navigation />
          <AppRoutes />
        </Container>
      </ThemeProvider>
    </Router>
  );
}

export default App;
