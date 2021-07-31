import "./index.css";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import React from "react";
import ReactDOM from "react-dom";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";

import App from "./App";
import * as serviceWorker from "./serviceWorker";

// the "history" package is pinned to "^4.9.0" since v5 of history is not compatible with
// react-router v5 - https://github.com/getsentry/sentry-javascript/issues/3709
Sentry.init({
  dsn: "https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/5887585",
  environment: process.env.REACT_APP_COUCHERS_ENV,
  tracesSampleRate: 0.1,
  debug: true,
  integrations: [
    new Integrations.BrowserTracing({
      tracingOrigins: [
        "localhost",
        /.+\.preview\.couchershq\.org/i,
        /next.couchershq.org/i,
        /app.couchers.org/i,
      ],
    }),
  ],
  release: `${process.env.REACT_APP_COUCHERS_ENV}-test`,
});

if (process.env.REACT_APP_COUCHERS_ENV === "prod") {
  TagManager.initialize({ gtmId: "GTM-PXP3896" });
}

polyfill();

const root = document.getElementById("root") as HTMLElement;
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  root
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// Adapted from https://github.com/mui-org/material-ui/issues/17010#issuecomment-723953307
// since the types are wrong. It's fixed in v5 of Material UI so once it's stable and we
// can upgrade to it, we can remove this
declare module "@material-ui/core" {
  interface BoxProps {
    ref?: React.Ref<HTMLElement>;
  }
}
