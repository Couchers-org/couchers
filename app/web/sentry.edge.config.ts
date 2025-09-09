// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/5887585",
  // eslint-disable-next-line n/no-process-env
  environment: process.env.NEXT_PUBLIC_COUCHERS_ENV,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
