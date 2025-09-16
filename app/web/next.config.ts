/* eslint-disable n/no-process-env */
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import webpack from "webpack";
import z from "zod";

import { CamelCaseConfigWithoutPrefix, configUtils } from "./config";
import nextI18NextConfig from "./next-i18next.config";
import { redirects } from "./redirects";

const envVarPrefix = "NEXT_PUBLIC_";

const utils = configUtils(envVarPrefix);

type RawConfig = z.infer<typeof utils.schema>;

type Config = CamelCaseConfigWithoutPrefix<RawConfig, typeof envVarPrefix>;

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const Config: Config;
}

let stringReplacements: Record<string, string> = {};

const isNextJS = !!process.env.NEXT_RUNTIME;

// Only parse env variables if we're running with Next.js, so we don't fail when running tests etc.
if (isNextJS) {
  const processedEnvVariables: Record<string, string | undefined> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    // Treat empty strings as undefined
    if (value === "") {
      processedEnvVariables[key] = undefined;
    } else {
      processedEnvVariables[key] = value;
    }
  });

  const parsedEnv = utils.schema.parse(processedEnvVariables);

  stringReplacements = utils.getStringReplacements(parsedEnv);
}

const nextConfig: NextConfig = {
  assetPrefix: process.env.ASSET_PREFIX,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  webpack: (config: webpack.Configuration) => {
    if (!config.plugins) {
      config.plugins = [];
    }

    config.plugins.push(new webpack.DefinePlugin(stringReplacements));

    config.module?.rules?.push({
      test: /\.md$/,
      loader: "frontmatter-markdown-loader",
    });

    return config;
  },
  i18n: nextI18NextConfig.i18n,
  /* eslint-disable @typescript-eslint/require-await */
  redirects: async () => redirects,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "x-help-wanted",
          value:
            "Come help build the next generation platform for couch surfers at https://github.com/Couchers-org",
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
  /* eslint-enable @typescript-eslint/require-await */
  output: "standalone",
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
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
