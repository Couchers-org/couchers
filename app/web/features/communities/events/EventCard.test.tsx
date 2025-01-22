import { render, screen } from "@testing-library/react";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import timezoneMock from "timezone-mock";

import EventCard from "./EventCard";

const { t } = i18n;

const [firstEvent, secondEvent, thirdEvent, cancelledEvent] = events;

describe("Event card", () => {
  beforeEach(() => {
    timezoneMock.register("UTC");
  });

  afterEach(() => {
    timezoneMock.unregister();
  });

  it("renders an offline event card details correctly with the same start and end day", async () => {
    render(<EventCard event={firstEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: firstEvent.title }),
    ).toBeVisible();
    expect(
      screen.getByText(firstEvent.offlineInformation!.address),
    ).toBeVisible();
    expect(
      screen.getByText("Tue, Jun 29, 2021 2:37 AM - 3:37 AM"),
    ).toBeVisible();
    expect(
      screen.getByText(
        t("communities:attendees_count", {
          count: firstEvent.goingCount + firstEvent.maybeCount,
        }),
      ),
    ).toBeVisible();
    expect(screen.getByText("Be there or be square!")).toBeVisible();
  });

  it("renders an event card details correctly with a different start and end day", async () => {
    render(<EventCard event={thirdEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: thirdEvent.title }),
    ).toBeVisible();
    expect(
      screen.getByText(thirdEvent.offlineInformation!.address),
    ).toBeVisible();
    expect(
      screen.getByText("Tue, Jun 29, 2021 9:00 PM - Wed, Jun 30, 2021 2:00 AM"),
    ).toBeVisible();
    expect(
      screen.getByText(
        t("communities:attendees_count", {
          count: thirdEvent.goingCount + thirdEvent.maybeCount,
        }),
      ),
    ).toBeVisible();
    expect(screen.getByText(thirdEvent.content)).toBeVisible();
  });

  it("renders an online event card details correctly", () => {
    render(<EventCard event={secondEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: secondEvent.title }),
    ).toBeVisible();
    expect(
      screen.getByText(t("communities:virtual_event_location_placeholder")),
    ).toBeVisible();
    expect(
      screen.getByText("Tue, Jun 29, 2021 9:00 PM - 10:00 PM"),
    ).toBeVisible();
    expect(
      screen.getByText(
        t("communities:attendees_count", {
          count: secondEvent.goingCount + secondEvent.maybeCount,
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
