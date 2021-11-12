/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: [
      "components",
      "features",
      "pages",
      "service",
      "stories",
      "test",
      "types",
      "utils",
    ],
  },
};
