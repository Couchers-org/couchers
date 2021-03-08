import * as account from "./account";
import * as api from "./api";
import * as auth from "./auth";
import * as bugs from "./bugs";
import * as communities from "./communities";
import * as conversations from "./conversations";
import * as discussions from "./discussions";
import * as groups from "./groups";
import * as jail from "./jail";
import * as pages from "./pages";
import * as requests from "./requests";
import * as search from "./search";
import * as threads from "./threads";
import * as user from "./user";

export const service = {
  account,
  api,
  auth,
  bugs,
  communities,
  conversations,
  discussions,
  groups,
  jail,
  pages,
  requests,
  search,
  threads,
  user,
} as const;

export type {
  HostingPreferenceData,
  SignupArguments,
  UpdateUserProfileData,
} from "./user";
