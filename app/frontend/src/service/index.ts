import * as auth from "./auth";
import * as search from "./search";
import * as user from "./user";
import * as conversations from "./conversations";
import * as api from "./api";
import * as requests from "./requests";

export const service = {
  search,
  user,
  auth,
  conversations,
  api,
  requests,
} as const;

export type {
  HostingPreferenceData,
  SignupArguments,
  UpdateUserProfileData,
} from "./user";
