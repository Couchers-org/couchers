import { render, screen } from "@testing-library/react";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import EventCard from "./EventCard";

const { t } = i18n;

const [firstEvent, secondEvent] = events;
const cancelledEvent = events[3];

describe("Event card", () => {
  it("renders an event card details correctly with the same start and end day", async () => {
    render(<EventCard event={firstEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: firstEvent.title }),
    ).toBeVisible();
    expect(screen.getByText(firstEvent.location!.address)).toBeVisible();
    expect(
      screen.getByText("Tue, Jun 29, 2021, 2:37 – 3:37 AM", {
        normalizer: (x) => x, // Match non-breaking spaces and en dashes exactly
      }),
    ).toBeVisible();
    expect(screen.getByText(String(firstEvent.goingCount))).toBeVisible();
    expect(
      screen.getByText(
        t("communities:comments_count", {
          count: firstEvent.thread?.numResponses,
        }),
      ),
    ).toBeVisible();
    expect(screen.getByText("Be there or be square!")).toBeVisible();
  });

  it("renders an event card details correctly with a different start and end day", async () => {
    render(<EventCard event={secondEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: secondEvent.title }),
    ).toBeVisible();
    expect(screen.getByText(secondEvent.location!.address)).toBeVisible();
    expect(
      screen.getByText(
        "Tue, Jun 29, 2021, 9:00 PM – Wed, Jun 30, 2021, 2:00 AM",
        {
          normalizer: (x) => x, // Match non-breaking spaces and en dashes exactly
        },
      ),
    ).toBeVisible();
    expect(screen.getByText(String(secondEvent.goingCount))).toBeVisible();
    expect(
      screen.getByText(
        t("communities:comments_count", {
          count: secondEvent.thread?.numResponses,
        }),
      ),
    ).toBeVisible();
    expect(screen.getByText(secondEvent.content)).toBeVisible();
  });

  it("does not render a badge for if the event is not cancelled", () => {
    const { container } = render(<EventCard event={firstEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: firstEvent.title }),
    ).toBeVisible();

    expect(container.getElementsByClassName("MuiChip-root")).toHaveLength(0);
  });

  it("renders a badge for cancelled event card", () => {
    const { container } = render(<EventCard event={cancelledEvent} />, {
      wrapper,
    });

    expect(
      screen.getByRole("heading", { name: cancelledEvent.title }),
    ).toBeVisible();

    const chip = container.getElementsByClassName("MuiChip-root")[0];
    expect(chip).toBeVisible();
    expect(chip).toHaveTextContent(t("communities:cancelled"));
  });
});
