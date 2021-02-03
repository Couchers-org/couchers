import * as auth from "./auth";
import * as search from "./search";
import * as user from "./user";
import * as conversations from "./conversations";
import * as communities from "./communities";
import * as groups from "./groups";
import * as api from "./api";
import * as pages from "./pages";
import * as requests from "./requests";
import * as jail from "./jail";

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
