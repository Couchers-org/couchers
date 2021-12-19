import auth from "public/locales/en/auth.json";
import communities from "public/locales/en/communities.json";
import connections from "public/locales/en/connections.json";
import dashboard from "public/locales/en/dashboard.json";
import donations from "public/locales/en/donations.json";
import global from "public/locales/en/global.json";
import messages from "public/locales/en/messages.json";
import profile from "public/locales/en/profile.json";
import search from "public/locales/en/search.json";

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

export default resources;
