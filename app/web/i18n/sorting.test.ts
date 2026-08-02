import { getLocaleCollator, getLocalizedListComparer } from "./sorting";

describe("getLocalizedListComparer", () => {
  it("uses pinyin collation for zh-Hans when supported", () => {
    const collator = getLocaleCollator("zh-Hans");

    if (collator.resolvedOptions().locale.includes("-pinyin")) {
      expect(["中国", "法国", "德国", "阿富汗"].sort(collator.compare)).toEqual(["阿富汗", "德国", "法国", "中国"]);
    }
  });

  it("uses stroke collation for zh-Hant when supported", () => {
    const collator = getLocaleCollator("zh-Hant");

    if (collator.resolvedOptions().locale.includes("-stroke")) {
      expect(["德國", "法國", "中國", "加拿大"].sort(collator.compare)).toEqual(["中國", "加拿大", "法國", "德國"]);
    }
  });

  it("sorts other locales normally", () => {
    expect(["Zulu", "Alpha", "Echo"].sort(getLocalizedListComparer("en"))).toEqual(["Alpha", "Echo", "Zulu"]);
  });
});
