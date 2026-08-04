import global from "@couchers/client-shared/locales/global/en.json";
import auth from "features/auth/locales/en.json";
import communities from "features/communities/locales/en.json";
import connections from "features/connections/locales/en.json";
import dashboard from "features/dashboard/locales/en.json";
import donations from "features/donations/locales/en.json";
import landing from "features/landing/locales/en.json";
import messages from "features/messages/locales/en.json";
import mod from "features/mod/locales/en.json";
import notifications from "features/notifications/locales/en.json";
import press from "features/press/locales/en.json";
import profile from "features/profile/locales/en.json";
import publicTrips from "features/publicTrips/locales/en.json";
import search from "features/search/locales/en.json";

const resources = {
  auth,
  communities,
  connections,
  dashboard,
  donations,
  landing,
  messages,
  mod,
  notifications,
  press,
  profile,
  publicTrips,
  search,
  global,
} as const;

export default resources;
