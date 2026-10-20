import { render, screen } from "@testing-library/react";
import publicTrips from "test/fixtures/publicTrips";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

import PublicTripCard from "./PublicTripCard";

beforeEach(() => {
  addDefaultUser();
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
});
