import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import PressCoverage from "./PressCoverage";

const { t } = i18n;

describe("PressCoverage", () => {
  it("renders all 3 articles", () => {
    render(<PressCoverage />, { wrapper });
    expect(screen.getByAltText("Travel Noir")).toBeInTheDocument();
    expect(screen.getByAltText("Adventure Uncovered")).toBeInTheDocument();
    expect(screen.getByAltText("Input")).toBeInTheDocument();
  });

  it("each article link has a unique aria-label including the headline and new tab notice", () => {
    render(<PressCoverage />, { wrapper });

    const articles = [
      "Couchsurfing vs. house sitting: how to stay for free around the world",
      "The couchsurfing crossroads",
      "Paradise lost: The rise and ruin of Couchsurfing.com",
    ];

    articles.forEach((headline) => {
      expect(
        screen.getByRole("link", {
          name: `${t("press:read_more")}: ${headline} ${t("press:opens_in_a_new_tab")}`,
        }),
      ).toBeInTheDocument();
    });
  });

  it("article links open in a new tab with proper rel", () => {
    render(<PressCoverage />, { wrapper });
    screen.getAllByRole("link", { name: /read more/i }).forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("article dates have correct datetime attributes", () => {
    render(<PressCoverage />, { wrapper });

    const dates = [
      { text: "April 1, 2025", dateTime: "2025-04-01" },
      { text: "October 6, 2022", dateTime: "2022-10-06" },
      { text: "September 15, 2021", dateTime: "2021-09-15" },
    ];

    dates.forEach(({ text, dateTime }) => {
      expect(screen.getByText(text)).toHaveAttribute("datetime", dateTime);
    });
  });
});
