import {
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@material-ui/core";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import "./App.css";
import AppRoutes from "./AppRoutes";
import Navigation from "./components/Navigation";
import { persistor, store } from "./store";
import { theme } from "./theme";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  );
}

export default App;
