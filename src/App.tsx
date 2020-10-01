import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  Container,
} from "@material-ui/core";
import { theme } from "./theme";
import "./App.css";
import { Provider } from "react-redux";

import Navigation from "./components/Navigation";
import AppRoutes from "./AppRoutes";
import store from "./store";

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
