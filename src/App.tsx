import {
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@material-ui/core";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import Navigation from "./components/Navigation";
import { theme } from "./theme";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="md">
          <Typography variant="h1">Couchers</Typography>
          <Navigation />
          <AppRoutes />
        </Container>
      </ThemeProvider>
    </Router>
  );
}

export default App;
