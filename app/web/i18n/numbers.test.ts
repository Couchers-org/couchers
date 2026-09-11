import { localizeUSD } from "i18n/numbers";

describe("localizeUSD", () => {
  it("formats for different locales", () => {
    expect(localizeUSD(99.99, "en")).toBe("US$99.99");
    expect(localizeUSD(99.99, "en-US")).toBe("$99.99");
    // es uses a non-breaking space ( ) before the currency symbol
    expect(localizeUSD(99.99, "es")).toBe("99,99 US$");
  });

  it("shows cents only when present", () => {
    expect(localizeUSD(1, "en")).toBe("US$1");
    expect(localizeUSD(1.1, "en")).toBe("US$1.10");
    expect(localizeUSD(1.11, "en")).toBe("US$1.11");
  });
});
