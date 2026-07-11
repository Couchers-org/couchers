import { getLabelSortLocales } from "./ProfileTagInput";

describe("getLabelSortLocales", () => {
  it("uses pinyin collation for zh-Hans", () => {
    const locales = getLabelSortLocales("zh-Hans");

    expect(locales).toEqual([
      "zh-Hans-u-co-pinyin",
      "zh-CN-u-co-pinyin",
      "zh-u-co-pinyin",
    ]);
    expect(
      ["中国", "法国", "德国", "阿富汗"].sort(
        new Intl.Collator(locales).compare,
      ),
    ).toEqual(["阿富汗", "德国", "法国", "中国"]);
  });

  it("uses stroke collation for zh-Hant", () => {
    const locales = getLabelSortLocales("zh-Hant");

    expect(locales).toEqual([
      "zh-Hant-u-co-stroke",
      "zh-TW-u-co-stroke",
      "zh-u-co-stroke",
    ]);
    expect(
      ["德國", "法國", "中國", "加拿大"].sort(
        new Intl.Collator(locales).compare,
      ),
    ).toEqual(["中國", "加拿大", "法國", "德國"]);
  });

  it("keeps locale suffixes on the same Chinese script family", () => {
    expect(getLabelSortLocales("zh-Hant-HK")).toEqual([
      "zh-Hant-u-co-stroke",
      "zh-TW-u-co-stroke",
      "zh-u-co-stroke",
    ]);
    expect(getLabelSortLocales("zh-Hans-SG")).toEqual([
      "zh-Hans-u-co-pinyin",
      "zh-CN-u-co-pinyin",
      "zh-u-co-pinyin",
    ]);
  });

  it("leaves other locales unchanged", () => {
    expect(getLabelSortLocales("en")).toEqual(["en"]);
  });
});
