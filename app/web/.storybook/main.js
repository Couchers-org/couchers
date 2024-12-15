const path = require("path");
const toPath = (filePath) => path.join(process.cwd(), filePath);

module.exports = {
  core: {
    builder: "webpack5",
  },
  stories: ["../**/*.stories.mdx", "../**/*.stories.@(js|jsx|ts|tsx)"],
  typescript: {
    reactDocgen: false,
  },
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  framework: "@storybook/react",
  webpackFinal: (config) => {
    config.resolve.alias["service$"] = require.resolve(
      "../stories/serviceMocks.ts"
    );
    config.resolve.alias["fs"] = require.resolve("./fsMock.js");
    config.resolve.alias["@emotion/core"] = toPath(
      "node_modules/@emotion/react"
    );
    config.resolve.alias["emotion-theming"] = toPath(
      "node_modules/@emotion/react"
    );
    config.resolve.modules = [".", ...(config.resolve.modules || [])];

    console.log(
      "⚠️  Note: filtering out CaseSensitivePathsPlugin to avoid issues with libraries that use import paths with wrong case"
    );
    // @see https://github.com/Urthen/case-sensitive-paths-webpack-plugin
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== "CaseSensitivePathsPlugin"
    );

    return config;
  },
};
