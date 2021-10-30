import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TITLE, UPDATE } from "features/constants";
import { Route, Switch } from "react-router-dom";
import { editEventRoute, eventRoute, routeToEditEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  END_DATE,
  EVENT_DETAILS,
  EVENT_LINK,
  START_DATE,
  START_TIME,
  VIRTUAL_EVENT,
} from "./constants";
import EditEventPage from "./EditEventPage";

jest.mock("components/MarkdownInput");

const getEventMock = service.events.getEvent as jest.MockedFunction<
  typeof service.events.getEvent
>;
const updateEventMock = service.events.updateEvent as jest.MockedFunction<
  typeof service.events.updateEvent
>;

function renderPage() {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [routeToEditEvent(1, "weekly-meetup")],
  });

  render(
    <Switch>
      <Route path={editEventRoute}>
        <EditEventPage />
      </Route>
      <Route path={eventRoute}>
        <h1 data-testid="event-page">Event page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
}

describe("Edit event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(events[0]);
    updateEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders with the existing event and updates it successfully", async () => {
    renderPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Brief sanity check that the form has existing data
    const titleField = screen.getByLabelText(TITLE);
    expect(titleField).toHaveValue("Weekly Meetup");

    userEvent.type(titleField, " in the dam");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.type(
      screen.getByLabelText(EVENT_LINK),
      "https://couchers.org/amsterdam-social"
    );
    const eventDetails = screen.getByLabelText(EVENT_DETAILS);
    userEvent.clear(eventDetails);
    userEvent.type(eventDetails, "We are going virtual this week!");
    const endDateField = await screen.findByLabelText(END_DATE);
    userEvent.clear(endDateField);
    userEvent.type(endDateField, "07012021");
    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });
    // Check it only sends the updated field to the backend
    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: true,
      title: "Weekly Meetup in the dam",
      content: "We are going virtual this week!",
      link: "https://couchers.org/amsterdam-social",
      endTime: new Date("2021-07-01 03:37"),
    });

    // Verifies that success re-directs user
    expect(screen.getByTestId("event-page")).toBeInTheDocument();
  });

  it("should submit both the start and end date if the start date field is touched", async () => {
    renderPage();

    const startDateField = await screen.findByLabelText(START_DATE);
    userEvent.clear(startDateField);
    userEvent.type(startDateField, "08012021");
    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-08-01 02:37"),
      endTime: new Date("2021-08-01 03:37"),
    });
  });

  it("should submit both the start and end date if the start time field is touched", async () => {
    renderPage();

    const startTimeField = await screen.findByLabelText(START_TIME);
    userEvent.clear(startTimeField);
    userEvent.type(startTimeField, "0000");
    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-06-29 00:00"),
      endTime: new Date("2021-06-29 01:00"),
    });
  });

  it("shows an error message if the event to be edited cannot be found", async () => {
    mockConsoleError();
    const errorMessage = "Event not found.";
    getEventMock.mockRejectedValue(new Error(errorMessage));
    renderPage();

    await assertErrorAlert(errorMessage);
    expect(screen.queryByLabelText(TITLE)).not.toBeInTheDocument();
  });
});
