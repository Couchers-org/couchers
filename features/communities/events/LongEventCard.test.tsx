import { render, screen } from "@testing-library/react";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import timezoneMock from "timezone-mock";

import { ONLINE } from "../constants";
import LongEventCard from "./LongEventCard";

const [firstEvent, secondEvent, thirdEvent] = events;

const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

describe("Long event card", () => {
  beforeEach(() => {
    timezoneMock.register("UTC");
    getUserMock.mockImplementation(getUser);
    listEventAttendeesMock.mockResolvedValue({
      attendeeUserIdsList: [1, 2, 3, 4, 5],
      nextPageToken: "",
    });
  });

  afterEach(() => {
    timezoneMock.unregister();
  });

  it("renders an offline event with the same start and end day correctly", async () => {
    render(<LongEventCard event={firstEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: firstEvent.title })
    ).toBeVisible();
    expect(
      screen.getByText(firstEvent.offlineInformation?.address!)
    ).toBeVisible();
    expect(screen.getByText("Jun 29, 2021 2:37 AM")).toBeVisible();
    expect(screen.getByText("12 attendees")).toBeVisible();

    const eventImage = screen.getByRole("img", { name: "" });
    expect(eventImage).toBeVisible();
    expect(eventImage).toHaveAttribute(
      "src",
      "https://loremflickr.com/500/120/amsterdam"
    );
    expect(screen.getByText("Be there or be square!")).toBeVisible();
  });

  it("renders an online event correctly", async () => {
    render(<LongEventCard event={secondEvent} />, { wrapper });

    expect(
      screen.getByRole("heading", { name: secondEvent.title })
    ).toBeVisible();
    expect(screen.getByText("Jun 29, 2021 9:00 PM")).toBeVisible();
    expect(screen.getByText(ONLINE)).toBeVisible();
  });

  it("renders an event with no event image correctly", async () => {
    listEventAttendeesMock.mockResolvedValue({
      attendeeUserIdsList: [3, 4, 5],
      nextPageToken: "",
    });
    render(<LongEventCard event={thirdEvent} />, { wrapper });

    const eventImage = await screen.findByRole("img", { name: "" });
    expect(eventImage).toBeVisible();
    expect(eventImage).toHaveAttribute("src", "eventImagePlaceholder.svg");
  });
});
