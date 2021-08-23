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

import { EVENT_DETAILS, EVENT_LINK, VIRTUAL_EVENT } from "./constants";
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
    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });
    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: true,
      title: "Weekly Meetup in the dam",
      content: "We are going virtual this week!",
      photoKey: "",
      startTime: new Date("2021-06-29 02:37"),
      endTime: new Date("2021-06-29 03:37"),
      link: "https://couchers.org/amsterdam-social",
    });

    // Verifies that success re-directs user
    expect(screen.getByTestId("event-page")).toBeInTheDocument();
  });
});
