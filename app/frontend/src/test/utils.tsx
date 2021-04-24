import { screen } from "@testing-library/react";

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
