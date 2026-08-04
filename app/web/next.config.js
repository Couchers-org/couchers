/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config"); // eslint-disable-line
const { redirects } = require("./redirects"); // eslint-disable-line

const generateBlogIndex = require("./scripts/generate-blog-index"); // eslint-disable-line

const nextConfig = {
  assetPrefix: process.env.ASSET_PREFIX,
  reactStrictMode: true,
  eslint: {
    dirs: ["components", "features", "i18n", "markdown", "pages", "resources", "service", "test", "types", "utils"],
  },
  i18n,
  // Locale JSON is read from disk at request time (next-i18next uses i18next-fs-backend and our
  // pages are fallback: "blocking"), and Dockerfile.prod's runner stage copies no locale dir - so
  // they reach the image only via .next/standalone. File tracing already infers this from
  // localePath's template literal; listing it makes the dependency explicit so a refactor of that
  // path can't silently ship an image with no translations.
  outputFileTracingIncludes: {
    "*": ["features/*/locales/*.json", "resources/locales/*.json"],
  },
  productionBrowserSourceMaps: true,
  // ESM-only packages with no CommonJS entry point - Next.js (and next/jest) need to
  // transpile these themselves rather than treating them as pre-built node_modules.
  transpilePackages: ["temporal-polyfill", "temporal-utils"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      generateBlogIndex();
    }
    config.module.rules.push({
      test: /\.md$/,
      loader: "frontmatter-markdown-loader",
    });
    return config;
  },
  redirects: async () => redirects,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "x-help-wanted",
          value: "Come help build the next generation platform for couch surfers at https://github.com/Couchers-org",
        },
        {
          key: "strict-transport-security",
          value: "max-age=31536000; includeSubdomains; preload",
        },
        {
          key: "referrer-policy",
          value: "origin-when-cross-origin",
        },
        {
          key: "x-content-type-options",
          value: "nosniff",
        },
        {
          key: "x-frame-options",
          value: "DENY",
        },
        {
          key: "x-xss-protection",
          value: "1; mode=block",
        },
        {
          key: "x-fact",
          value: "Kilroy was here.",
        },
      ],
    },
    {
      source: "/static/:path*",
      headers: [
        {
          key: "access-control-allow-origin",
          value: "*",
        },
      ],
    },
    {
      source: "/service-worker.js",
      headers: [
        {
          key: "service-worker-allowed",
          value: "/",
        },
      ],
    },
  ],
  output: "standalone",
};

// Injected content via Sentry wizard below

// eslint-disable-next-line
const { withSentryConfig } = require("@sentry/nextjs");
// eslint-disable-next-line
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  sourcemaps: {
    disable: process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod",
  },

  org: "couchers",
  project: "frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
