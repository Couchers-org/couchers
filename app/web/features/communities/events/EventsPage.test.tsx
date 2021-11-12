import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToNewEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  CREATE_AN_EVENT,
  DISCOVER_EVENTS_SUBTITLE,
  DISCOVER_EVENTS_TITLE,
  EVENTS_EMPTY_STATE,
  PAST,
  SEE_MORE_EVENTS_LABEL,
  UPCOMING,
} from "./constants";
import EventsPage from "./EventsPage";

const listAllEventsMock = service.events.listAllEvents as jest.MockedFunction<
  typeof service.events.listAllEvents
>;

describe("Events page", () => {
  beforeEach(() => {
    listAllEventsMock.mockResolvedValue({
      eventsList: events,
      nextPageToken: "",
    });
  });

  it("shows the 'Upcoming' tab by default", async () => {
    render(<EventsPage />, { wrapper });

    expect(
      screen.getByRole("heading", { name: DISCOVER_EVENTS_TITLE })
    ).toBeVisible();
    expect(screen.getByText(DISCOVER_EVENTS_SUBTITLE)).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: UPCOMING })
    ).toBeVisible();

    // Check that there are 3 events cards in success case
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders the empty state if there are no events", async () => {
    listAllEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
    });
    render(<EventsPage />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(EVENTS_EMPTY_STATE)).toBeVisible();
    // Check that there are no events card, in addition to empty state
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it('switches to the "Past" tab when clicked', async () => {
    render(<EventsPage />, { wrapper });

    userEvent.click(screen.getByRole("tab", { name: PAST }));

    expect(await screen.findByRole("heading", { name: PAST })).toBeVisible();
  });

  it(`takes user to the page if the "${CREATE_AN_EVENT}" button is clicked`, async () => {
    render(<EventsPage />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: CREATE_AN_EVENT }));

    await waitFor(() => {
      expect(mockRouter.pathname).toBe(routeToNewEvent(1));
    });
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing all events";
    listAllEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<EventsPage />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(screen.queryByText(EVENTS_EMPTY_STATE)).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it(`shows the next page of events when the "${SEE_MORE_EVENTS_LABEL}" button is clicked`, async () => {
      listAllEventsMock.mockImplementation(async ({ pageToken }) => {
        return {
          eventsList: pageToken ? events.slice(2) : events.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
        };
      });
      render(<EventsPage />, { wrapper });
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
      expect(listAllEventsMock).toHaveBeenCalledTimes(2);
      expect(listAllEventsMock.mock.calls).toEqual([
        [{ pastEvents: false }],
        [{ pastEvents: false, pageToken: "2" }],
      ]);
    });
  });
});
