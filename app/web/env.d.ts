declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_COUCHERS_ENV: "prod" | "preview" | "dev";
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_MEDIA_BASE_URL: string;
    NEXT_PUBLIC_IS_POST_BETA_ENABLED?: "true";
    NEXT_PUBLIC_VERSION: string;
    NEXT_PUBLIC_IS_VERIFICATION_ENABLED?: "true";
    NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED?: "true";
    NEXT_PUBLIC_STRIPE_KEY: string;
  }
}
