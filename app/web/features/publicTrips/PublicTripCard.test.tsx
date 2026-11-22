import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import publicTrips from "test/fixtures/publicTrips";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser } from "test/utils";

import PublicTripCard from "./PublicTripCard";

const { t } = i18n;

beforeEach(() => {
  addDefaultUser();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("PublicTripCard description", () => {
  // Descriptions are written in a plain textarea, so the card has to render the
  // author's line breaks rather than collapsing them into spaces.
  it("keeps the author's line breaks", () => {
    const trip = { ...publicTrips[0], description: "Line one\nLine two\nLine three" };
    render(<PublicTripCard trip={trip} />, { wrapper });

    const description = screen.getByText(/Line one/);
    expect(description.textContent).toBe("Line one\nLine two\nLine three");
    expect(window.getComputedStyle(description).whiteSpace).toBe("pre-line");
  });

  it("toggles a long description with a Show more button", async () => {
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
    const trip = { ...publicTrips[0], description: "A long description." };
    render(<PublicTripCard trip={trip} />, { wrapper });

    const toggle = await screen.findByRole("button", { name: t("publicTrips:trip_card.show_more_action") });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(screen.getByRole("button", { name: t("publicTrips:trip_card.show_less_action") })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
