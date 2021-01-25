import * as api from "./api";
import * as auth from "./auth";
import * as conversations from "./conversations";
import * as jail from "./jail";
import * as requests from "./requests";
import * as search from "./search";
import * as user from "./user";

export const service = {
  search,
  user,
  auth,
  conversations,
  api,
  jail,
  requests,
} as const;

export type {
  HostingPreferenceData,
  SignupArguments,
  UpdateUserProfileData,
} from "./user";
