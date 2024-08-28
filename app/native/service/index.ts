import * as account from "./account";
import * as api from "./api";
import * as auth from "./auth";
import * as bugs from "./bugs";
import * as communities from "./communities";
import * as conversations from "./conversations";
import * as discussions from "./discussions";
import * as donations from "./donations";
import * as events from "./events";
import * as groups from "./groups";
import * as jail from "./jail";
import * as notifications from "./notifications";
import * as pages from "./pages";
import * as references from "./references";
import * as reporting from "./reporting";
import * as requests from "./requests";
import * as resources from "./resources";
import * as search from "./search";
import * as threads from "./threads";
import * as user from "./user";
import * as version from "./version";

export const service = {
  account,
  api,
  auth,
  bugs,
  communities,
  conversations,
  discussions,
  donations,
  events,
  groups,
  jail,
  notifications,
  pages,
  references,
  reporting,
  requests,
  resources,
  search,
  threads,
  user,
  version,
} as const;

export type { HostingPreferenceData, UpdateUserProfileData } from "./user";
