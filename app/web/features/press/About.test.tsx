import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import About from "./About";

const { t } = i18n;

describe("About", () => {
  it("renders all 3 cards", () => {
    render(<About />, { wrapper });
    expect(
      screen.getByText(t("press:about_mission_heading")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("press:about_blog_heading")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("press:about_foundation_heading")),
    ).toBeInTheDocument();
  });

  it("card headings render as h3", () => {
    render(<About />, { wrapper });
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);
  });

  it("each Read more link has a unique aria-label", () => {
    render(<About />, { wrapper });
    const headings = [
      t("press:about_mission_heading"),
      t("press:about_blog_heading"),
      t("press:about_foundation_heading"),
    ];
    headings.forEach((heading) => {
      expect(
        screen.getByRole("link", {
          name: `${t("press:read_more")}: ${heading}`,
        }),
      ).toBeInTheDocument();
    });
  });
});
