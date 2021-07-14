import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Switch } from "react-router-dom";
import { eventBaseRoute, eventRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import {
  getEventAttendees,
  getEventOrganisers,
  getUser,
} from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";
import timezoneMock from "timezone-mock";

import { PREVIOUS_PAGE } from "../constants";
import { ATTENDEES, details, ORGANISERS } from "./constants";
import EventPage from "./EventPage";

const getEventMock = service.events.getEvent as jest.MockedFunction<
  typeof service.events.getEvent
>;
const listEventOrganisersMock = service.events
  .listEventOrganisers as jest.MockedFunction<
  typeof service.events.listEventOrganisers
>;
const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

function renderEventPage(
  initialRouterEntries: string[] = [
    "/previous-page",
    `${eventBaseRoute}/1/weekly-meetup`,
  ],
  initialIndex: number = 1
) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries,
    initialIndex,
  });
  render(
    <Switch>
      <Route exact path={eventRoute}>
        <EventPage />
      </Route>
      <Route exact path="/previous-page">
        <h1 data-testid="previous-page">Previous page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
}

describe("Event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(events[0]);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
    listEventOrganisersMock.mockImplementation(getEventOrganisers);
    getUserMock.mockImplementation(getUser);
    timezoneMock.register("UTC");
  });

  afterEach(() => {
    timezoneMock.unregister();
  });

  it("renders the event successfully", async () => {
    renderEventPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByRole("heading", { name: events[0].title })
    ).toBeVisible();
    expect(
      screen.getByText(events[0].offlineInformation?.address!)
    ).toBeVisible();
    expect(
      screen.getByText("Tuesday, June 29, 2021 2:37 AM to 3:37 AM")
    ).toBeVisible();
    // Event image
    expect(screen.getByRole("img", { name: "" })).toBeVisible();

    // Event details
    expect(screen.getByRole("heading", { name: details() })).toBeVisible();
    expect(screen.getByText("Be there")).toBeVisible();
    expect(screen.getByText("or be square!")).toBeVisible();

    // Basic checks that the organisers and attendees sections are rendered
    expect(screen.getByRole("heading", { name: ORGANISERS })).toBeVisible();
    expect(screen.getByRole("heading", { name: ATTENDEES })).toBeVisible();
  });

  it("goes back to the previous page when the back button is clicked", async () => {
    renderEventPage();
    await screen.findByRole("heading", { name: events[0].title });

    userEvent.click(screen.getByRole("button", { name: PREVIOUS_PAGE }));

    expect(screen.getByTestId("previous-page")).toBeInTheDocument();
  });

  it("shows the not found page if the user tries to find an event with an invalid ID in the URL", async () => {
    renderEventPage([`${eventBaseRoute}/xyz/event`], 0);
    expect(
      await screen.findByRole("img", { name: "404 Error: Resource Not Found" })
    ).toBeVisible();
  });

  it("shows an error alert if the event failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error fetching event";
    getEventMock.mockRejectedValue(new Error(errorMessage));

    renderEventPage();

    await assertErrorAlert(errorMessage);
  });
});
