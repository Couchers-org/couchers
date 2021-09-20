import { render, screen } from "@testing-library/react";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import timezoneMock from "timezone-mock";

import { getAttendeesCount } from "../constants";
import { VIEW_DETAILS_FOR_LINK } from "./constants";
import EventCard from "./EventCard";

const [firstEvent, secondEvent, thirdEvent] = events;

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
      screen.getByRole("heading", { name: firstEvent.title })
    ).toBeVisible();
    expect(
      screen.getByText(firstEvent.offlineInformation?.address!)
    ).toBeVisible();
    expect(screen.getByText("June 29, 2021 2:37 AM - 3:37 AM")).toBeVisible();
    expect(
      screen.getByText(
        getAttendeesCount(firstEvent.goingCount + firstEvent.maybeCount)
      )
    ).toBeVisible();
    expect(screen.getByText("Be there or be square!")).toBeVisible();
  });

  it("renders an event card details correctly with a different start and end day", async () => {
    render(<EventCard event={thirdEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: thirdEvent.title })
    ).toBeVisible();
    expect(
      screen.getByText(thirdEvent.offlineInformation?.address!)
    ).toBeVisible();
    expect(
      screen.getByText("June 29, 2021 9:00 PM - June 30, 2021 2:00 AM")
    ).toBeVisible();
    expect(
      screen.getByText(
        getAttendeesCount(thirdEvent.goingCount + thirdEvent.maybeCount)
      )
    ).toBeVisible();
    expect(screen.getByText(thirdEvent.content)).toBeVisible();
  });

  it("renders an online event card details correctly", () => {
    render(<EventCard event={secondEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: secondEvent.title })
    ).toBeVisible();
    expect(screen.getByText(VIEW_DETAILS_FOR_LINK)).toBeVisible();
    expect(screen.getByText("June 29, 2021 9:00 PM - 10:00 PM")).toBeVisible();
    expect(
      screen.getByText(
        getAttendeesCount(secondEvent.goingCount + secondEvent.maybeCount)
      )
    ).toBeVisible();
    expect(screen.getByText(secondEvent.content)).toBeVisible();
  });
});
