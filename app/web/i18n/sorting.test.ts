import { getLocalizedListComparer } from "./sorting";

describe("getLocalizedListComparer", () => {
  it("uses pinyin collation for zh-Hans when supported", () => {
    const resolvedLocale = new Intl.Collator(
      "zh-Hans-u-co-pinyin",
    ).resolvedOptions().locale;

    if (resolvedLocale.includes("-pinyin")) {
      expect(
        ["中国", "法国", "德国", "阿富汗"].sort(
          getLocalizedListComparer("zh-Hans"),
        ),
      ).toEqual(["阿富汗", "德国", "法国", "中国"]);
    }
  });

  it("uses stroke collation for zh-Hant when supported", () => {
    const resolvedLocale = new Intl.Collator(
      "zh-Hant-u-co-stroke",
    ).resolvedOptions().locale;

    if (resolvedLocale.includes("-stroke")) {
      expect(
        ["德國", "法國", "中國", "加拿大"].sort(
          getLocalizedListComparer("zh-Hant"),
        ),
      ).toEqual(["中國", "加拿大", "法國", "德國"]);
    }
  });

  it("sorts other locales normally", () => {
    expect(
      ["Zulu", "Alpha", "Echo"].sort(getLocalizedListComparer("en")),
    ).toEqual(["Alpha", "Echo", "Zulu"]);
  });
});
