import { fireEvent, screen } from "@testing-library/react";
import mediaQuery from "css-mediaquery";

export function addDefaultUser(userId?: number) {
  window.localStorage.setItem("auth.authenticated", JSON.stringify(true));
  window.localStorage.setItem("auth.jailed", JSON.stringify(false));
  window.localStorage.setItem(
    "auth.userId",
    JSON.stringify(userId ?? defaultUser.userId)
  );
}

export async function assertErrorAlert(message: string) {
  const errorAlert = await screen.findByRole("alert");
  expect(errorAlert).toBeVisible();
  expect(errorAlert).toHaveTextContent(message);
}

export function assertFieldVisibleWithValue(field: HTMLElement, value: string) {
  expect(field).toBeVisible();
  expect(field).toHaveValue(value);
}

export function mockConsoleError() {
  jest.spyOn(console, "error").mockReturnValue(undefined);
}

export function wait(milliSeconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliSeconds));
}

export type MockedService<T extends (...args: any) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

export function keyPress(
  element: Window | Document | Node | Element,
  keyEvent: { code: string; key: string }
) {
  fireEvent.keyDown(element, keyEvent);
  fireEvent.keyUp(element, keyEvent);
}

export function createMatchMedia(width: number) {
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
