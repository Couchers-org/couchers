import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";

import TranslationProgress from "./TranslationProgress";

jest.mock("i18n/useLocaleInfos", () => ({
  __esModule: true,
  useLocaleInfos: () => ({
    data: [
      { code: "en", autonym: "English", stringAvailabilityPercent: 100 },
      { code: "de", autonym: "Deutsch", stringAvailabilityPercent: 90 },
      // Both Chinese variants (issue #8523: they must be distinctly named and
      // must NOT render the China flag).
      { code: "zh-Hans", autonym: "中文（简体）", stringAvailabilityPercent: 70 },
      { code: "zh-Hant", autonym: "中文（繁體）", stringAvailabilityPercent: 65 },
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

  it("renders no flag images (issue #8523)", async () => {
    render(<TranslationProgress />, { wrapper });

    // Wait for the list to render.
    await screen.findByText("English");

    // Flags were <img> elements with an alt of "<code> flag"; none should remain.
    expect(screen.queryByAltText(/flag/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
