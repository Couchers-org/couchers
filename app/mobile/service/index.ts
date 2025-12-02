import * as auth from "./auth";
import * as notifications from "./notifications";

export const service = {
  auth,
  notifications,
} as const;
