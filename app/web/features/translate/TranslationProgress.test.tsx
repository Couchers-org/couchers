import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";

import TranslationProgress from "./TranslationProgress";

jest.mock("i18n/weblate", () => ({
  __esModule: true,
  useWeblateLanguages: () => ({
    data: [
      { code: "en", translationProgress: 100 },
      { code: "de", translationProgress: 90 },
      { code: "zh-Hans", translationProgress: 70 },
      { code: "zh-Hant", translationProgress: 65 },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe("TranslationProgress", () => {
  it("lists languages by their autonym (name in their own language)", async () => {
    render(<TranslationProgress />, { wrapper });

    expect(await screen.findByText("English")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
    // The two Chinese variants are distinct, not conflated under one flag.
    expect(screen.getByText("中文（简体）")).toBeInTheDocument();
    expect(screen.getByText("中文（繁體）")).toBeInTheDocument();
  });
});
