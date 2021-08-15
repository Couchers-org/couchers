import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CREATE, TITLE } from "features/constants";
import { Route, Switch } from "react-router-dom";
import { eventRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";

import { EVENT_LINK, VIRTUAL_EVENT } from "./constants";
import CreateEventPage from "./CreateEventPage";

const createEventMock = service.events.createEvent as jest.MockedFunction<
  typeof service.events.createEvent
>;

describe("Create event page", () => {
  beforeEach(() => {
    createEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders and submits the form successfully", async () => {
    render(
      <Switch>
        <Route exact path="/">
          <CreateEventPage />
        </Route>
        <Route path={eventRoute}>
          <h1 data-testid="event-page">Event page</h1>
        </Route>
      </Switch>,
      { wrapper }
    );

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.type(
      screen.getByLabelText(EVENT_LINK),
      "https://couchers.org/social"
    );
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });
    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: true,
      title: "Test event",
      content: "",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00"),
      endTime: new Date("2021-08-01 02:00"),
      parentCommunityId: 1,
      link: "https://couchers.org/social",
    });
    // Verifies that success re-directs user
    expect(screen.getByTestId("event-page")).toBeInTheDocument();
  });
});
