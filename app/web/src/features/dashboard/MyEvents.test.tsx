import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EVENTS_EMPTY_STATE } from "features/communities/constants";
import { Route, Switch } from "react-router";
import { eventsRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import { MY_EVENTS, SHOW_ALL_UPCOMING_EVENTS } from "./constants";
import MyEvents from "./MyEvents";

const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<
  typeof service.events.listMyEvents
>;

describe("My events", () => {
  beforeEach(() => {
    listMyEventsMock.mockResolvedValue({
      eventsList: events,
      nextPageToken: "",
    });
  });

  it("renders the section correctly", async () => {
    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByRole("heading", { name: MY_EVENTS })).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
    });
    render(<MyEvents />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(EVENTS_EMPTY_STATE)).toBeVisible();
    // Check that there are no events card, in addition to empty state
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing all events";
    listMyEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(screen.queryByText(EVENTS_EMPTY_STATE)).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it('shows the "show all upcoming events" link and takes user to the right page when clicked', async () => {
      listMyEventsMock.mockImplementation(async ({ pageToken }) => {
        return {
          eventsList: pageToken ? events.slice(2) : events.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
        };
      });
      render(
        <Switch>
          <Route exact path="/">
            <MyEvents />
          </Route>
          <Route path={eventsRoute}>
            <h1 data-testid="all-events">All events</h1>
          </Route>
        </Switch>,
        { wrapper }
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(
        screen.getByRole("link", { name: SHOW_ALL_UPCOMING_EVENTS })
      );

      expect(await screen.findByTestId("all-events")).toBeInTheDocument();
    });
  });
});
