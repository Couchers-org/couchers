import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";

import TranslationProgress from "./TranslationProgress";

jest.mock("i18n/weblate", () => ({
  __esModule: true,
  useWeblateLanguages: () => ({
    data: [
      { locale: "en", translationProgress: 1 },
      { locale: "de", translationProgress: 0.9 },
      { locale: "zh-Hans", translationProgress: 0.7 },
      { locale: "zh-Hant", translationProgress: 0.65 },
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
