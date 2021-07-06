// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

import mediaQuery from "css-mediaquery";

import user from "./test/fixtures/defaultUser.json";

jest.mock("./service");

global.defaultUser = user;
global.localStorage = createLocalStorageMock();

afterEach(() => {
  global.localStorage.clear();
  jest.restoreAllMocks();
});

Element.prototype.scroll = () => {};
Element.prototype.scrollIntoView = jest.fn();
window.scroll = jest.fn();
//below required by maplibre-gl
window.URL.createObjectURL = jest.fn();
window.matchMedia = createMatchMedia(window.innerWidth);

declare global {
  var defaultUser: typeof user;
}

function createLocalStorageMock() {
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
