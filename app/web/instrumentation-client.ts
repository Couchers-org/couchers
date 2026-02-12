import * as Sentry from "@sentry/nextjs";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const projectId = 5887585;

Sentry.init({
  dsn: `https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/${projectId}`,

  // Ad-blockers prevent events from being sent to Sentry. This is a workaround.
  // See https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
  // Note that nginx removes /sentry-tunnel, and forwards the rest untouched.
  tunnel: `${baseUrl}/sentry-tunnel/api/${projectId}/envelope/`,

  environment: process.env.NEXT_PUBLIC_COUCHERS_ENV,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  integrations: [],
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
