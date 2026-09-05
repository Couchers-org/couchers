// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "whatwg-fetch";

import { waitFor } from "@testing-library/react";
import crypto from "crypto";
import mediaQuery from "css-mediaquery";
import sentryTestkit from "sentry-testkit";
import i18n from "test/i18n";
import { TextDecoder, TextEncoder } from "util";

import user from "./fixtures/defaultUser.json";

jest.mock("service");
jest.mock("next/router", () => {
  const routerMock = jest.requireActual("next-router-mock");
  return {
    ...routerMock,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };
});
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
jest.mock("i18n/useLocaleInfos", () => ({
  __esModule: true,
  useLocaleInfos: () => ({
    data: [
      { code: "en", autonym: "English", stringAvailabilityPercent: 100 },
      { code: "es", autonym: "Español (España)", stringAvailabilityPercent: 85 },
      { code: "fr", autonym: "Français", stringAvailabilityPercent: 75 },
      { code: "de", autonym: "Deutsch", stringAvailabilityPercent: 60 },
      { code: "it", autonym: "Italiano", stringAvailabilityPercent: 45 },
      { code: "pt", autonym: "Português (Portugal)", stringAvailabilityPercent: 30 },
      { code: "ru", autonym: "Русский", stringAvailabilityPercent: 15 },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.setTimeout(10000);

global.defaultUser = user;
global.localStorage = createWebStorageMock();
global.sessionStorage = createWebStorageMock();

// @ts-expect-error Only interested in mocking getRandomValues
global.crypto = {
  getRandomValues(array: Uint32Array) {
    return crypto.randomFillSync(array);
  },
};

// Polyfill TextDecoder and TextEncoder for maplibre-gl
// @ts-expect-error Polyfilling for test environment
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const { testkit } = sentryTestkit();
global.testKit = testkit;

beforeEach(async () => {
  global.localStorage.clear();
  global.sessionStorage.clear();
  jest.restoreAllMocks();
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

// Mock ResizeObserver for Navigation height tracking and MUI components
// Using class pattern as recommended by Jest for constructor-based APIs
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

declare global {
  // Disable the rule for this block
  var defaultUser: typeof user;
  var testKit: ReturnType<typeof sentryTestkit>["testkit"];
  // Re-enable the rule
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
