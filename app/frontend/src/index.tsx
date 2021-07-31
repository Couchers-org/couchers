import "./index.css";

import { init as InitSentry } from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";

import App from "./App";
import * as serviceWorker from "./serviceWorker";

if (process.env.REACT_APP_COUCHERS_ENV === "prod") {
  InitSentry({
    dsn: "https://f5340f75589a463c93b0947906edc410@o782870.ingest.sentry.io/5798447",
  });

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
