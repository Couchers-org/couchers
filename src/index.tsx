import "react-app-polyfill/stable";
import "intersection-observer";
import "./index.css";
import "./i18n";

import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";

import App from "./App";
import * as serviceWorker from "./serviceWorker";

if (process.env.REACT_APP_COUCHERS_ENV === "prod") {
  Sentry.init({
    dsn: "https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/5887585",
    environment: process.env.REACT_APP_COUCHERS_ENV,
    release: process.env.REACT_APP_VERSION,
  });
  TagManager.initialize({ gtmId: "GTM-PXP3896" });
}

polyfill();

// jss is not very compatible with react-snap
// https://github.com/stereobooster/react-snap/issues/99
// @ts-expect-error - this is read by react-snap
window.snapSaveState = () => {
  Array.from(document.querySelectorAll("[data-jss]")).forEach((elem) =>
    elem.setAttribute("data-jss-snap", "")
  );
};

const root = document.getElementById("root") as HTMLElement;
if (root.hasChildNodes()) {
  ReactDOM.hydrate(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    root,
    () => {
      Array.from(document.querySelectorAll("[data-jss-snap]")).forEach(
        (element) => element.remove()
      );
    }
  );
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    root
  );
}

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
