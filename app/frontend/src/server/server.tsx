// eslint-disable-next-line simple-import-sort/imports
import { CssBaseline, ThemeProvider } from "@material-ui/core";
import React from "react";
// import ReactDOM from "react-dom";
import ReactDOMServer from 'react-dom/server';

// import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "../reactQueryClient";
import SSRTestForm from "./SSRTestForm"
import { theme } from "../theme";

export default function render() {
  return ReactDOMServer.renderToStaticMarkup(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <ReactQueryClientProvider>
          <CssBaseline />
          <SSRTestForm />
        </ReactQueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
}

console.log(render())
