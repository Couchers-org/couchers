import {
  recursiveCamelToSnakeCase,
  recursiveSnakeToCamelCase,
  toCamelCase,
  toSnakeCase,
} from "./string";

describe("string case conversions", () => {
  const camelCaseNames = ["test", "anotherString", "thisIsAString"];
  const snakeCaseNames = ["test", "another_string", "this_is_a_string"];

  it.each(
    camelCaseNames.map<[string, string]>((camelCase, index) => [
      camelCase,
      snakeCaseNames[index],
    ]),
  )("should convert '%s' to snake case", (a, b) => {
    expect(toSnakeCase(a)).toBe(b);
  });

  it.each(
    snakeCaseNames.map<[string, string]>((snakeCase, index) => [
      snakeCase,
      camelCaseNames[index],
    ]),
  )("should convert '%s' to camel case", (a, b) => {
    expect(toCamelCase(a)).toBe(b);
  });

  const camelCaseObject = {
    property: "hello, world",
    anotherProperty: true,
    objectProperty: {
      nestedProperty: 42,
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    1: "1",
  };

  const snakeCaseObject = {
    property: "hello, world",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    another_property: true,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    object_property: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      nested_property: 42,
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    1: "1",
  };

  it("should recursively convert property names to camel case", () => {
    expect(recursiveCamelToSnakeCase(camelCaseObject)).toEqual(snakeCaseObject);
  });

  it("should recursively convert property names to snake case", () => {
    expect(recursiveSnakeToCamelCase(snakeCaseObject)).toEqual(camelCaseObject);
  });
});
