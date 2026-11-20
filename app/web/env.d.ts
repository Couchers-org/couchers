declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_COUCHERS_ENV: "prod" | "preview" | "dev";
    NEXT_PUBLIC_BASE_URL: string;
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_MEDIA_BASE_URL: string;
    NEXT_PUBLIC_CONSOLE_BASE_URL: string;
    NEXT_PUBLIC_IS_POST_BETA_ENABLED?: "true";
    NEXT_PUBLIC_VERSION: string;
    NEXT_PUBLIC_DISPLAY_VERSION?: string;
    NEXT_PUBLIC_COMMIT_SHA?: string;
    NEXT_PUBLIC_COMMIT_TIMESTAMP?: string;
    NEXT_PUBLIC_IS_VERIFICATION_ENABLED?: "true";
    NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED?: "true";
    NEXT_PUBLIC_STRIPE_KEY: string;
    // set by app/mobile/scripts/store-screenshots to hide dev-only UI and the report button
    NEXT_PUBLIC_STORE_SCREENSHOTS?: "1";
    // JSON object of feature flag values to force in store screenshots
    NEXT_PUBLIC_STORE_SCREENSHOTS_FORCED_FLAGS?: string;
    SENTRY_RELEASE: string;
  }
}
