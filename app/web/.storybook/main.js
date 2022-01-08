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
    config.resolve.modules = [".", ...(config.resolve.modules || [])];
    return config;
  },
};
