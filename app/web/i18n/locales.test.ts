import { allLanguages } from "i18n/allLanguages";

import { LOCALE_AUTONYMS } from "./locales";

describe("LOCALE_AUTONYMS", () => {
  it("has an autonym for every language in allLanguages.js", () => {
    for (const locale of allLanguages) {
      expect(LOCALE_AUTONYMS[locale]).toBeDefined();
    }
  });
});
