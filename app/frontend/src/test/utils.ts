import { createAction } from "@reduxjs/toolkit";

export function addDefaultUser() {
  window.localStorage.setItem("auth.authenticated", JSON.stringify(true));
  window.localStorage.setItem("auth.jailed", JSON.stringify(false));
  window.localStorage.setItem("auth.userId", JSON.stringify(defaultUser));
}

export const reset = createAction("reset");

export function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}
