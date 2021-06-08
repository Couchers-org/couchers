module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
  ],
  typescript: {
    reactDocgen: false
  },
  webpackFinal: (config) => {
    config.resolve.alias["service$"] = require.resolve(
      "../src/stories/serviceMocks.ts"
    );
    return config;
  },
};
