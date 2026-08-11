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
  productionBrowserSourceMaps: true,
  // ESM-only packages with no CommonJS entry point - Next.js (and next/jest) need to
  // transpile these themselves rather than treating them as pre-built node_modules.
  transpilePackages: ["temporal-polyfill", "temporal-utils"],
  experimental: {
    // Trades slightly slower compiles for a lower webpack memory ceiling.
    webpackMemoryOptimizations: true,
  },
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
    // The auth token is only present in the deploy builds, and it's what the upload needs.
    disable: !process.env.SENTRY_AUTH_TOKEN,
    // productionBrowserSourceMaps serves them from the CDN too; don't pull them out from
    // under the sourceMappingURL comments webpack leaves in the bundles.
    deleteSourcemapsAfterUpload: false,
  },

  org: "couchers",
  project: "frontend",

  telemetry: false,

  // Also cover the shared chunks, which is where most of our code ends up
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
