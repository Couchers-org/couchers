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
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";

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

    expect(
      screen.getByRole("heading", { name: t("communities:events_title") })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("communities:create_an_event") })
    ).toBeVisible();
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

    expect(screen.getByText(t("communities:events_empty_state"))).toBeVisible();
  });

  it(`takes user to the page if the "${t(
    "communities:create_an_event"
  )}" button is clicked`, async () => {
    render(<EventsList community={community} />, { wrapper });

    await userEvent.click(
      screen.getByRole("button", { name: t("communities:create_an_event") })
    );

    await waitFor(() => {
      expect(mockRouter.asPath).toBe(routeToNewEvent(2));
    });
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error loading community events";
    listCommunityEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<EventsList community={community} />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(
      screen.queryByText(t("communities:events_empty_state"))
    ).not.toBeInTheDocument();
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
        name: t("communities:see_more_events_label"),
      });
      await userEvent.click(seeMoreEventsButton);
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
