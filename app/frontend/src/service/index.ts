import * as auth from "./auth";
import * as search from "./search";
import * as user from "./user";

export const service = {
  search,
  user,
  auth,
} as const;
