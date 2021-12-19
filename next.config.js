/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config"); // eslint-disable-line
module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: [
      "components",
      "features",
      "i18n",
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
};
