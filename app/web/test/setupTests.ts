// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import { Value } from "@sinclair/typebox/value";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import crypto from "crypto";
import mediaQuery from "css-mediaquery";
import sentryTestkit from "sentry-testkit";
import "whatwg-fetch";

// eslint-disable-next-line no-restricted-imports
import { configUtils } from "@/config";
import i18n from "@/test/i18n";

import user from "./fixtures/defaultUser.json";

// TODO(FB) Remove redundancy with next.config.ts
const envVarPrefix = "NEXT_PUBLIC_";

const utils = configUtils(envVarPrefix);
const parsedEnv = Value.Parse(utils.schema, envVarPrefix);

Object.assign(Config, utils.getStringReplacements(parsedEnv));

jest.mock("service");
jest.mock("next/router", () => {
  const routerMock = jest.requireActual<{
    events: { on: () => unknown; off: () => unknown; emit: () => unknown };
  }>("next-router-mock");

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
// It needs to be in the form dynamic(() => import("@/components/MarkdownNoSSR"))
// This is hacky. Really we need to just ditch any non-ssr components
// / TODO: Get an SSR-friendly markdown editor
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (...props: unknown[]) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const matchedPath = /require\("(.*)"\)/.exec(`${props[0]}`);
    if (matchedPath) {
      return require(matchedPath[1]).default; //eslint-disable-line
    } else throw Error(`Couldn't resolve dynamic component`);
  },
}));
jest.mock("react-gtm-module");

jest.setTimeout(10000);

const createMatchMedia = (width: number) => {
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
};

/* eslint-disable no-restricted-syntax */
const createWebStorageMock = function () {
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
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.store[key];
    },

    setItem(key: string, value: string) {
      this.store[key] = value;
    },

    store: {} as Record<string, string>,
  };
};
/* eslint-enable no-restricted-syntax */

global.defaultUser = user;
global.localStorage = createWebStorageMock();
global.sessionStorage = createWebStorageMock();

// @ts-expect-error Only interested in mocking getRandomValues
global.crypto = {
  getRandomValues: (array: Uint32Array) => {
    return crypto.randomFillSync(array);
  },
};

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
// below required by maplibre-gl
window.URL.createObjectURL = jest.fn();
window.matchMedia = createMatchMedia(window.innerWidth);

declare global {
  /* eslint-disable no-var */
  var defaultUser: typeof user;
  var testKit: ReturnType<typeof sentryTestkit>["testkit"];
  /* eslint-enable no-var*/
}
