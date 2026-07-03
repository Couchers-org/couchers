import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import Hero from "./Hero";

const { t } = i18n;

jest.mock("../dashboard/Hero/HeroImageAttribution", () => () => null);

describe("Hero", () => {
  it("renders the page title as h1", () => {
    render(<Hero />, { wrapper });
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: t("press:hero_title"),
      }),
    ).toBeInTheDocument();
  });
});
