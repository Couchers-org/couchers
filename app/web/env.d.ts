declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_COUCHERS_ENV: "prod" | "preview" | "dev";
    NEXT_PUBLIC_BASE_URL: string;
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_MEDIA_BASE_URL: string;
    NEXT_PUBLIC_CONSOLE_BASE_URL: string;
    NEXT_PUBLIC_GEOCODE_EARTH_KEY: string; // intentionally client-side and not a secret (must referrer restriction must be enabled)
    NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL: string;
    NEXT_PUBLIC_IS_POST_BETA_ENABLED?: "true";
    NEXT_PUBLIC_VERSION: string;
    NEXT_PUBLIC_DISPLAY_VERSION?: string;
    NEXT_PUBLIC_COMMIT_SHA?: string;
    NEXT_PUBLIC_COMMIT_TIMESTAMP?: string;
    NEXT_PUBLIC_IS_VERIFICATION_ENABLED?: "true";
    NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED?: "true";
    NEXT_PUBLIC_STRIPE_KEY: string;
    NEXT_PUBLIC_GLOBAL_MESSAGE_URL: string;
    SENTRY_RELEASE: string;
  }
}
