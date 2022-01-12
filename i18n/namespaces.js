/**
 * Namespaces single-source-of-truth
 *
 * This file must be kept in CommonJS syntax (not Typescript or ES6) because it
 * is imported from the next-i18next.config.js that is executed as plain
 * NodeJS code.
 */
const AUTH = "auth";
const COMMUNITIES = "communities";
const CONNECTIONS = "connections";
const DASHBOARD = "dashboard";
const DONATIONS = "donations";
const GLOBAL = "global";
const MESSAGES = "messages";
const PROFILE = "profile";
const SEARCH = "search";

const NAMESPACES = {
  AUTH,
  COMMUNITIES,
  CONNECTIONS,
  DASHBOARD,
  DONATIONS,
  GLOBAL,
  MESSAGES,
  PROFILE,
  SEARCH,
};

const NAMESPACES_VALUES = Object.values(NAMESPACES);

module.exports = {
  AUTH,
  COMMUNITIES,
  CONNECTIONS,
  DASHBOARD,
  DONATIONS,
  GLOBAL,
  MESSAGES,
  PROFILE,
  SEARCH,
  NAMESPACES,
  NAMESPACES_VALUES,
};
