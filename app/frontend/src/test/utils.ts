import { createAction } from "@reduxjs/toolkit";

export function addDefaultUser() {
  store.dispatch({
    type: "auth/passwordLogin/fulfilled",
    payload: {
      token: "9hhiwXCaCzmTM6ZB7rfaJ0yZIlSsXTOQUZagihbcrAw=",
      user: defaultUser,
    },
  });
}

export const reset = createAction("reset");
