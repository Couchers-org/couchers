import { renderHook, waitFor } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import { disambiguateDuplicateNames, useLanguages } from "./useLanguages";

const getLanguagesMock = service.resources.getLanguages as jest.MockedFunction<typeof service.resources.getLanguages>;

const collidingLanguages = {
  languagesList: [
    { code: "aka", name: "Akan" },
    { code: "fat", name: "Akan" },
    { code: "twi", name: "Akan" },
    { code: "fil", name: "Filipino" },
    { code: "tgl", name: "Filipino" },
    { code: "eng", name: "English" },
  ],
};

describe("disambiguateDuplicateNames", () => {
  it("appends the language code only when the display name is shared", () => {
    const format = (name: string, code: string) => `${name} (${code})`;

    expect(
      disambiguateDuplicateNames(
        {
          aka: "Akan",
          fat: "Akan",
          twi: "Akan",
          fil: "Filipino",
          tgl: "Filipino",
          eng: "English",
        },
        format,
      ),
    ).toEqual({
      aka: "Akan (aka)",
      fat: "Akan (fat)",
      twi: "Akan (twi)",
      fil: "Filipino (fil)",
      tgl: "Filipino (tgl)",
      eng: "English",
    });
  });
});

describe("useLanguages", () => {
  it("disambiguates colliding localized names with a localizable template", async () => {
    getLanguagesMock.mockResolvedValue(collidingLanguages);

    const { result } = renderHook(() => useLanguages(), { wrapper });

    await waitFor(() => expect(result.current.languages).toBeDefined());

    const format = (name: string, code: string) => i18n.t("global:ambiguous_language_name", { name, code });

    expect(result.current.languages).toEqual({
      aka: format("Akan", "aka"),
      fat: format("Akan", "fat"),
      twi: format("Akan", "twi"),
      fil: format("Filipino", "fil"),
      tgl: format("Filipino", "tgl"),
      eng: "English",
    });
  });
});
