/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config"); // eslint-disable-line
const { redirects } = require("./redirects"); // eslint-disable-line

module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: [
      "components",
      "features",
      "i18n",
      "markdown",
      "pages",
      "resources",
      "service",
      "stories",
      "test",
      "types",
      "utils",
    ],
  },
  i18n,
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      loader: "frontmatter-markdown-loader",
    });
    return config;
  },
  redirects: async () => redirects,
};
