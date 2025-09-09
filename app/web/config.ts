import { Static, TObject, TSchema, Type } from "@sinclair/typebox";
import { camelCase } from "change-case";

import { SnakeToCamelCase } from "./utils/types";

type SchemaWithPrefix<
  S extends TObject<Record<string, TSchema>>,
  P extends string,
> = TObject<{
  [K in Extract<
    keyof S["properties"],
    string
  > as `${P}${K}`]: S["properties"][K];
}>;

export type CamelCaseConfigWithoutPrefix<
  PrefixedConfig extends Record<string, unknown>,
  Prefix extends string,
> = {
  [K in Extract<
    keyof PrefixedConfig,
    string
  > as `${K extends `${Prefix}${infer PK}` ? SnakeToCamelCase<PK> : SnakeToCamelCase<K>}`]: PrefixedConfig[K];
};

const schemaWithPrefix = <
  const S extends TObject<Record<string, TSchema>>,
  const P extends string,
>(
  schema: S,
  prefix: P,
): SchemaWithPrefix<S, P> => {
  schema.properties = Object.fromEntries(
    Object.entries(schema.properties).map((entry) => [
      `${prefix}${entry[0]}`,
      entry[1],
    ]),
  );

  return schema as unknown as SchemaWithPrefix<S, P>;
};

const envSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("test"),
  Type.Literal("production"),
]);

const couchersEnvSchema = Type.Union([
  Type.Literal("dev"),
  Type.Literal("preview"),
  Type.Literal("prod"),
]);

/* eslint-disable @typescript-eslint/naming-convention */
export const configUtils = <const P extends string>(prefix: P) => {
  const schema = Type.Intersect([
    Type.Object({
      NODE_ENV: envSchema,
    }),
    schemaWithPrefix(
      Type.Object({
        API_BASE_URL: Type.String(),
        COUCHERS_ENV: couchersEnvSchema,
        CONSOLE_BASE_URL: Type.String(),
        DISPLAY_VERSION: Type.String({ default: "dev" }),
        COMMIT_TIMESTAMP: Type.Optional(Type.Date()),
        NOMINATIM_URL: Type.String(),
        VERSION: Type.String(),
        IS_COMMUNITIES_PART2_ENABLED: Type.Boolean(),
      }),
      prefix,
    ),
  ]);

  const getStringReplacements = (encoded: Static<typeof schema>) =>
    Object.fromEntries(
      Object.entries(encoded).map(([key, value]) => {
        const keyWithoutPrefix = key.startsWith(prefix)
          ? key.substring(prefix.length)
          : key;

        const newKey: [string, string] = [
          `Config.${camelCase(keyWithoutPrefix)}`,
          `"${value}"`,
        ];

        return newKey;
      }),
    ) as Record<string, string>;

  return { schema, getStringReplacements };
};
