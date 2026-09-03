import { render, screen } from "@testing-library/react";
import { localizeDateOnly } from "i18n/datetimes";
import { Temporal } from "temporal-polyfill";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import PressCoverage from "./PressCoverage";

const { t } = i18n;

describe("PressCoverage", () => {
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
          name: t("press:read_more_link_aria", { headline }),
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

  it("article dates are localized and have correct datetime attributes", () => {
    render(<PressCoverage />, { wrapper });

    const dates = ["2025-04-01", "2022-10-06", "2021-09-15"];

    dates.forEach((date) => {
      const text = localizeDateOnly(Temporal.PlainDate.from(date), i18n.language);
      expect(screen.getByText(text)).toHaveAttribute("datetime", date);
    });
  });
});
