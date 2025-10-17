import { camelCase } from "change-case";
import z from "zod";

import { SnakeToCamelCase } from "./utils/types.ts";

type ObjectWithPrefixedProperties<
  O extends Record<string, z.ZodType>,
  P extends string,
> = {
  [K in Extract<keyof O, string> as `${P}${K}`]: O[K];
};

export type CamelCaseConfigWithoutPrefix<
  PrefixedConfig extends Record<string, unknown>,
  Prefix extends string,
> = {
  [K in Extract<
    keyof PrefixedConfig,
    string
  > as `${K extends `${Prefix}${infer PK}` ? SnakeToCamelCase<PK> : SnakeToCamelCase<K>}`]: PrefixedConfig[K];
};

const objectWithPrefixedProperties = <
  const O extends Record<string, z.ZodType>,
  const P extends string,
>(
  object: O,
  prefix: P,
): ObjectWithPrefixedProperties<O, P> => {
  const prefixedObject = Object.fromEntries(
    Object.entries(object).map((entry) => [`${prefix}${entry[0]}`, entry[1]]),
  );

  return prefixedObject as unknown as ObjectWithPrefixedProperties<O, P>;
};

const envSchema = z.enum(["development", "test", "production"]);

const couchersEnvSchema = z.enum(["dev", "preview", "prod"]);

const boolStringSchema = z.preprocess((val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}, z.boolean());

/* eslint-disable @typescript-eslint/naming-convention */
export const configUtils = <const P extends string>(prefix: P) => {
  const schema = z.object({
    NODE_ENV: envSchema,
    ...objectWithPrefixedProperties(
      {
        API_BASE_URL: z.string(),
        COUCHERS_ENV: couchersEnvSchema,
        CONSOLE_BASE_URL: z.string(),
        DISPLAY_VERSION: z.string().default("dev"),
        COMMIT_TIMESTAMP: z.iso.datetime().optional(),
        COMMIT_SHA: z.string().optional(),
        NOMINATIM_URL: z.string(),
        VERSION: z.string().default("unknown"),
        IS_COMMUNITIES_PART2_ENABLED: boolStringSchema.default(false),
        RECAPTCHA_SITE_KEY: z.string().optional(),
        IS_VERIFICATION_ENABLED: boolStringSchema.default(false),
        STRIPE_KEY: z.string(),
        IS_POST_BETA_ENABLED: boolStringSchema.default(false),
        MEDIA_BASE_URL: z.string(),
        GLOBAL_MESSAGE_URL: z.string(),
        CDN_BASE_URL: z.string(),
      },
      prefix,
    ),
  });

  const getStringReplacements = (encoded: z.infer<typeof schema>) => ({
    Config: Object.fromEntries(
      Object.entries(encoded).map(([key, value]) => {
        const keyWithoutPrefix = key.startsWith(prefix)
          ? key.substring(prefix.length)
          : key;

        const newKey: [string, string] = [
          camelCase(keyWithoutPrefix),
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `"${value}"`,
        ];

        return newKey;
      }),
    ) as Record<string, string>,
  });

  return { schema, getStringReplacements };
};
