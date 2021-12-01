/** @type {import('next').NextConfig} */
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
};
