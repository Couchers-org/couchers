// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import "whatwg-fetch";

//import * as Sentry from "@sentry/nextjs";
import { waitFor } from "@testing-library/react";
import crypto from "crypto";
import mediaQuery from "css-mediaquery";
import sentryTestkit from "sentry-testkit";
import i18n from "test/i18n";

import user from "./fixtures/defaultUser.json";

jest.mock("service");
jest.mock("next/dist/client/router", () => require("next-router-mock"));
// Mock next/dynamic to skip the dynamic part
// This works by extracting the require("path/to/component")
// It needs to be in the form dynamic(() => import("components/MarkdownNoSSR"))
// This is hacky. Really we need to just ditch any non-ssr components
/// TODO: Get an SSR-friendly markdown editor
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (...props: unknown[]) => {
    const matchedPath = /require\("(.*)"\)/.exec(`${props[0]}`);
    if (matchedPath) {
      const Component = require(matchedPath[1]).default; //eslint-disable-line
      return Component;
    } else throw Error(`Couldn't resolve dynamic component: ${matchedPath}`);
  },
}));
jest.mock("react-gtm-module");

jest.setTimeout(15000);

global.defaultUser = user;
global.localStorage = createWebStorageMock();
global.sessionStorage = createWebStorageMock();

// @ts-expect-error Only interested in mocking getRandomValues
global.crypto = {
  getRandomValues(array: Uint32Array) {
    return crypto.randomFillSync(array);
  },
};

//sentry testing was causing OOM for some reason
//const { testkit, sentryTransport } = sentryTestkit();
//global.testKit = testkit;

beforeAll(() => {
  /*Sentry.init({
    dsn: "https://testKey@o782870.ingest.sentry.io/0",
    transport: sentryTransport,
  });*/
});

beforeEach(async () => {
  global.localStorage.clear();
  global.sessionStorage.clear();
  jest.restoreAllMocks();
  //testkit.reset();
  await waitFor(() => {
    expect(i18n.isInitialized).toBe(true);
  });
});

Element.prototype.scroll = () => {};
Element.prototype.scrollIntoView = jest.fn();
window.scroll = jest.fn();
//below required by maplibre-gl
window.URL.createObjectURL = jest.fn();
window.matchMedia = createMatchMedia(window.innerWidth);

declare global {
  var defaultUser: typeof user; // eslint-disable-line
  var testKit: sentryTestkit.Testkit; // eslint-disable-line
}

function createWebStorageMock() {
  return {
    clear() {
      this.store = {};
    },

    getItem(key: string) {
      return this.store[key] || null;
    },

    key(index: number) {
      return this.store[Object.keys(this.store)[index]];
    },

    get length() {
      return Object.keys(this.store).length;
    },

    removeItem(key: string) {
      delete this.store[key];
    },

    setItem(key: string, value: string) {
      this.store[key] = value;
    },

    store: {} as Record<string, string>,
  };
}

function createMatchMedia(width: number) {
  return (query: string) => ({
    matches: mediaQuery.match(query, { width }),
    media: "screen",
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}
