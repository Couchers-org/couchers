import { listSeparatorForLocale } from "i18n/lists";

describe("listSeparatorForLocale", () => {
  it("works with known locales", () => {
    expect(listSeparatorForLocale("en")).toEqual(", ");
    expect(listSeparatorForLocale("fr")).toEqual(", ");
    expect(listSeparatorForLocale("zh")).toEqual("、");
  });

  it("defaults to commas for unknown locales", () => {
    expect(listSeparatorForLocale("xx")).toEqual(", ");
  });
});
