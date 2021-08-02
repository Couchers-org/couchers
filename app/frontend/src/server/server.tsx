// eslint-disable-next-line simple-import-sort/imports
import { CssBaseline, ThemeProvider } from "@material-ui/core";
import React from "react";
// import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import { StaticRouter as Router } from "react-router-dom";
import { ServerStyleSheets } from "@material-ui/core/styles";
import { loginRoute } from "../routes";

// import AuthProvider from "./features/auth/AuthProvider";
import { ReactQueryClientProvider } from "../reactQueryClient";
import { theme } from "../theme";
import Login from "../features/auth/login/Login";
import AuthProvider from "../features/auth/AuthProvider";
import express from "express";

const app = express();

const port = 12000;

app.get("/login", (req, res) => {
  const sheets = new ServerStyleSheets();

  const html = ReactDOMServer.renderToString(
    sheets.collect(
      <React.StrictMode>
        <Router location={loginRoute}>
          <ThemeProvider theme={theme}>
            <ReactQueryClientProvider>
              <AuthProvider>
                <CssBaseline />
                <Login />
              </AuthProvider>
            </ReactQueryClientProvider>
          </ThemeProvider>
        </Router>
      </React.StrictMode>
    )
  );

  const css = sheets.toString();

  const page = `
  <!DOCTYPE html>
  <html>
    <head>
      <style id="jss-server-side">${css}</style>
    </head>
    <body>
      <div id="root">${html}</div>
    </body>
  </html>`;

  res.send(page);
});

app.use(express.static("public/"));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
