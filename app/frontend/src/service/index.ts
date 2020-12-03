import * as auth from "./auth";
import * as search from "./search";
import * as user from "./user";
import * as conversations from "./conversations";
import * as api from "./api";
import * as jail from "./jail";

export const service = {
  search,
  user,
  auth,
  conversations,
  api,
  jail,
} as const;

export type {
  HostingPreferenceData,
  SignupArguments,
  UpdateUserProfileData,
} from "./user";
