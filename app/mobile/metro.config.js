const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Configure path aliases
config.resolver.extraNodeModules = {
  "@": __dirname,
};

module.exports = config;
