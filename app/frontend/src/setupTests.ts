// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

import user from "./test/fixtures/defaultUser.json";

jest.mock("./service");

global.defaultUser = user;
global.localStorage = createLocalStorageMock();

afterEach(() => {
  global.localStorage.clear();
  jest.restoreAllMocks();
});

Element.prototype.scroll = () => {};

declare global {
  var defaultUser: typeof user;
}

function createLocalStorageMock() {
  return {
    store: {} as Record<string, string>,

    clear() {
      this.store = {};
    },

    getItem(key: string) {
      return this.store[key] || null;
    },

    setItem(key: string, value: string) {
      this.store[key] = value;
    },

    removeItem(key: string) {
      delete this.store[key];
    },

    get length() {
      return Object.keys(this.store).length;
    },

    key(index: number) {
      return this.store[Object.keys(this.store)[index]];
    },
  };
}
