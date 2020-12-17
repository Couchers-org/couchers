import { createAction } from "@reduxjs/toolkit";

export function addDefaultUser() {
  window.localStorage.setItem("auth.authenticated", JSON.stringify(true));
  window.localStorage.setItem("auth.jailed", JSON.stringify(false));
  window.localStorage.setItem("auth.user", JSON.stringify(defaultUser));
}

export const reset = createAction("reset");
