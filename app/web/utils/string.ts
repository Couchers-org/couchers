import { RecursiveCamelToSnakeCase, RecursiveSnakeToCamelCase } from "./types";

export const toCamelCase = (str: string) => {
  return str.replace(/(?:^\w|[A-Z]|_.|\b\w|\s+)/g, function (match, index) {
    if (match.startsWith("_")) {
      match = match.substring(1);
    }
    if (/\s+/g.test(match)) return "";
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
};

export const toSnakeCase = (input: string) =>
  input.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const recursiveCamelToSnakeCase = <T extends object>(
  input: T,
): RecursiveCamelToSnakeCase<T> => {
  // TODO(FB) Make less sketchy
  return (Object.keys(input) as (keyof T)[]).reduce<
    RecursiveCamelToSnakeCase<T>
  >((prev, key) => {
    const newKey = toSnakeCase(
      key as string,
    ) as keyof RecursiveCamelToSnakeCase<T>;

    if (typeof input[key] === "object") {
      prev[newKey] = recursiveCamelToSnakeCase<object>(
        input[key] as unknown as object,
      );
    } else {
      prev[newKey] = input[key];
    }

    return prev;
  }, {} as RecursiveCamelToSnakeCase<T>);
};

export const recursiveSnakeToCamelCase = <T extends object>(
  input: T,
): RecursiveSnakeToCamelCase<T> => {
  // TODO(FB) Make less sketchy
  return (Object.keys(input) as (keyof T)[]).reduce<
    RecursiveSnakeToCamelCase<T>
  >((prev, key) => {
    const newKey = toCamelCase(
      key as string,
    ) as keyof RecursiveSnakeToCamelCase<T>;

    if (typeof input[key] === "object") {
      prev[newKey] = recursiveSnakeToCamelCase<object>(
        input[key] as unknown as object,
      );
    } else {
      prev[newKey] = input[key];
    }

    return prev;
  }, {} as RecursiveSnakeToCamelCase<T>);
};
