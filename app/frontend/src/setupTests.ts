// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

import { store as reduxStore } from "./store";
import { reset } from "./test/utils";
import user from "./test/fixtures/defaultUser.json";

jest.mock("./service");

global.store = reduxStore;
global.defaultUser = user;

afterEach(() => {
  reduxStore.dispatch(reset());
});

declare global {
  var store: typeof reduxStore;
  var defaultUser: typeof user;
}
