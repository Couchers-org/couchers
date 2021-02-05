import * as api from "./api";
import * as auth from "./auth";
import * as communities from "./communities";
import * as conversations from "./conversations";
import * as groups from "./groups";
import * as jail from "./jail";
import * as pages from "./pages";
import * as requests from "./requests";
import * as search from "./search";
import * as user from "./user";

export const service = {
  search,
  user,
  auth,
  conversations,
  communities,
  groups,
  api,
  jail,
  pages,
  requests,
} as const;

export type {
  HostingPreferenceData,
  SignupArguments,
  UpdateUserProfileData,
} from "./user";
