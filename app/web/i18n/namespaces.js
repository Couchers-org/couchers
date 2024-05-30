/**
 * Namespaces single-source-of-truth
 *
 * This file must be kept in CommonJS syntax (not Typescript or ES6) because it
 * is imported from the next-i18next.config.js that is executed as plain
 * NodeJS code.
 */
const AUTH = "auth";
const BADGES = "badges";
const COMMUNITIES = "communities";
const CONNECTIONS = "connections";
const DASHBOARD = "dashboard";
const DONATIONS = "donations";
const GLOBAL = "global";
const LANDING = "landing";
const MESSAGES = "messages";
const PROFILE = "profile";
const SEARCH = "search";

const NAMESPACES = [
  AUTH,
  BADGES,
  COMMUNITIES,
  CONNECTIONS,
  DASHBOARD,
  DONATIONS,
  GLOBAL,
  LANDING,
  MESSAGES,
  PROFILE,
  SEARCH,
];

module.exports = {
  AUTH,
  BADGES,
  COMMUNITIES,
  CONNECTIONS,
  DASHBOARD,
  DONATIONS,
  GLOBAL,
  LANDING,
  MESSAGES,
  PROFILE,
  SEARCH,
  NAMESPACES,
};
