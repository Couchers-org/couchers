import auth from "features/auth/locales/en.json";
import communities from "features/communities/locales/en.json";
import connections from "features/connections/locales/en.json";
import dashboard from "features/dashboard/locales/en.json";
import donations from "features/donations/locales/en.json";
import messages from "features/messages/locales/en.json";
import profile from "features/profile/locales/en.json";
import search from "features/search/locales/en.json";
import global from "resources/locales/en.json";

const resources = {
  auth,
  communities,
  connections,
  dashboard,
  donations,
  messages,
  profile,
  search,
  global,
} as const;

export const namespaceList = [
  "auth",
  "communities",
  "connections",
  "dashboard",
  "donations",
  "messages",
  "profile",
  "search",
  "global",
];

export default resources;
