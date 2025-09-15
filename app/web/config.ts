import { camelCase } from "change-case";
import z from "zod";

import { SnakeToCamelCase } from "./utils/types";

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

const dateStringSchema = z
  .string()
  .refine((val) => !val || !isNaN(new Date(val).getTime()), {
    message: "Invalid date time string",
  })
  .transform((val) => (val ? new Date(val) : undefined));

const boolStringSchema = z
  .enum(["true", "false", ""])
  .transform((value) => value === "true");

// TODO(FB) Fix schema allowing undefined
const nonEmptyStringSchema = z
  .string()
  .transform((val) => (val === "" ? undefined : val));

/* eslint-disable @typescript-eslint/naming-convention */
export const configUtils = <const P extends string>(prefix: P) => {
  const schema = z.object({
    NODE_ENV: envSchema,
    ...objectWithPrefixedProperties(
      {
        API_BASE_URL: nonEmptyStringSchema,
        COUCHERS_ENV: couchersEnvSchema,
        CONSOLE_BASE_URL: nonEmptyStringSchema,
        DISPLAY_VERSION: nonEmptyStringSchema.default("dev"),
        COMMIT_TIMESTAMP: dateStringSchema.optional(),
        COMMIT_SHA: nonEmptyStringSchema.optional(),
        NOMINATIM_URL: nonEmptyStringSchema,
        VERSION: nonEmptyStringSchema.optional(),
        IS_COMMUNITIES_PART2_ENABLED: boolStringSchema.default(false),
        RECAPTCHA_SITE_KEY: nonEmptyStringSchema.optional(),
        IS_VERIFICATION_ENABLED: boolStringSchema.default(false),
        STRIPE_KEY: nonEmptyStringSchema,
        IS_POST_BETA_ENABLED: boolStringSchema.default(false),
        MEDIA_BASE_URL: nonEmptyStringSchema,
        GLOBAL_MESSAGE_URL: nonEmptyStringSchema,
      },
      prefix,
    ),
  });

  const getStringReplacements = (encoded: z.infer<typeof schema>) =>
    Object.fromEntries(
      Object.entries(encoded).map(([key, value]) => {
        const keyWithoutPrefix = key.startsWith(prefix)
          ? key.substring(prefix.length)
          : key;

        const newKey: [string, string] = [
          `Config.${camelCase(keyWithoutPrefix)}`,
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `"${value}"`,
        ];

        return newKey;
      }),
    ) as Record<string, string>;

  return { schema, getStringReplacements };
};
