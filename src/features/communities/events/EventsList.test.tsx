import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Switch } from "react-router-dom";
import { newEventRoute } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  CREATE_AN_EVENT,
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SEE_MORE_EVENTS_LABEL,
} from "./constants";
import EventsList from "./EventsList";

const listCommunityEventsMock = service.events
  .listCommunityEvents as jest.MockedFunction<
  typeof service.events.listCommunityEvents
>;
const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

describe("Events list", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listEventAttendeesMock.mockImplementation(async ({ eventId }) => {
      return {
        nextPageToken: "",
        attendeeUserIdsList: eventId < 3 ? [1, 2, 3, 4, 5] : [1, 2, 3],
      };
    });
    listCommunityEventsMock.mockResolvedValue({
      eventsList: events,
      nextPageToken: "",
    });
  });

  it("renders the events list successfully", async () => {
    render(<EventsList community={community} />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByRole("heading", { name: EVENTS_TITLE })).toBeVisible();
    expect(screen.getByRole("button", { name: CREATE_AN_EVENT })).toBeVisible();
    // High level check that there are 3 events cards
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders the empty state if there are no events", async () => {
    listCommunityEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
    });
    render(<EventsList community={community} />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(EVENTS_EMPTY_STATE)).toBeVisible();
  });

  it(`takes user to the page if the "${CREATE_AN_EVENT}" button is clicked`, async () => {
    render(
      <Switch>
        <Route exact path="/">
          <EventsList community={community} />
        </Route>
        <Route path={newEventRoute}>
          <h1 data-testid="create-event-page">Create event page</h1>
        </Route>
      </Switch>,
      { wrapper }
    );

    userEvent.click(screen.getByRole("button", { name: CREATE_AN_EVENT }));

    expect(await screen.findByTestId("create-event-page")).toBeInTheDocument();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error loading community events";
    listCommunityEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<EventsList community={community} />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(screen.queryByText(EVENTS_EMPTY_STATE)).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it("shows the next page of events when the 'See more events' button is clicked", async () => {
      listCommunityEventsMock.mockImplementation(async (_, pageToken) => {
        return {
          eventsList: pageToken ? events.slice(2) : events.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
        };
      });
      render(<EventsList community={community} />, { wrapper });

      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(screen.getAllByRole("link")).toHaveLength(2);

      const seeMoreEventsButton = screen.getByRole("button", {
        name: SEE_MORE_EVENTS_LABEL,
      });
      userEvent.click(seeMoreEventsButton);
      await waitForElementToBeRemoved(
        within(seeMoreEventsButton).getByRole("progressbar")
      );

      expect(screen.getAllByRole("link")).toHaveLength(3);
      expect(listCommunityEventsMock).toHaveBeenCalledTimes(2);
      expect(listCommunityEventsMock.mock.calls).toEqual([
        // [communityId, pageToken, pageSize]
        [2, undefined, 5],
        [2, "2", 5],
      ]);
    });
  });
});
