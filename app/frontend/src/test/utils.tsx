export function addDefaultUser(userId?: number) {
  window.localStorage.setItem("auth.authenticated", JSON.stringify(true));
  window.localStorage.setItem("auth.jailed", JSON.stringify(false));
  window.localStorage.setItem(
    "auth.userId",
    JSON.stringify(userId ?? defaultUser.userId)
  );
}

export function wait(milliSeconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliSeconds));
}

export type MockedService<T extends (...args: any) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;
