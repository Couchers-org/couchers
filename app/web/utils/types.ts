export type SnakeToCamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<SnakeToCamelCase<Tail>>}`
    : Lowercase<S>;

export type RecursiveSnakeToCamelCase<T> = T extends object
  ? T extends unknown[]
    ? T
    : {
        [K in keyof T as SnakeToCamelCase<
          string & K
        >]: RecursiveSnakeToCamelCase<T[K]>;
      }
  : T;

export type CamelToSnakeCase<S extends string> =
  S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
    : S;

export type RecursiveCamelToSnakeCase<T> = T extends object
  ? T extends unknown[]
    ? T
    : {
        [K in keyof T as CamelToSnakeCase<
          string & K
        >]: RecursiveCamelToSnakeCase<T[K]>;
      }
  : T;
