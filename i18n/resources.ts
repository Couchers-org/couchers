import auth from "features/auth/locales/en.json";
import communities from "features/communities/locales/en.json";
import connections from "features/connections/locales/en.json";
import dashboard from "features/dashboard/locales/en.json";
import donations from "features/donations/locales/en.json";
import messages from "features/messages/locales/en.json";
import profile from "features/profile/locales/en.json";
import search from "features/search/locales/en.json";
import global from "resources/locales/en.json";

import { NAMESPACES } from "./namespaces";

const resources = {
  [NAMESPACES.AUTH]: auth,
  [NAMESPACES.COMMUNITIES]: communities,
  [NAMESPACES.CONNECTIONS]: connections,
  [NAMESPACES.DASHBOARD]: dashboard,
  [NAMESPACES.DONATIONS]: donations,
  [NAMESPACES.MESSAGES]: messages,
  [NAMESPACES.PROFILE]: profile,
  [NAMESPACES.SEARCH]: search,
  [NAMESPACES.GLOBAL]: global,
} as const;

export default resources;
