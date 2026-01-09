import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockIsIntersecting } from "react-intersection-observer/test-utils";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import {
  assertErrorAlert,
  createMatchMedia,
  mockConsoleError,
} from "test/utils";

import MyEvents from "./MyEvents";

const { t } = i18n;

// EventSearch by default does not return cancelled events
const nonCancelledEvents = events.filter((event) => !event.isCancelled);

const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<
  typeof service.events.listMyEvents
>;

describe("My events", () => {
  beforeEach(() => {
    listMyEventsMock.mockResolvedValue({
      eventsList: nonCancelledEvents,
      nextPageToken: "",
      totalItems: nonCancelledEvents.length,
    });
  });

  it("renders the section correctly", async () => {
    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByRole("heading", { name: t("dashboard:upcoming_events") }),
    ).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("shows events from user's communities (not attending)", async () => {
    const communityEvent = {
      ...nonCancelledEvents[0],
      attendanceState: 0, // NOT_GOING
      organizer: false,
      ownerCommunityId: 123,
    };
    listMyEventsMock.mockResolvedValue({
      eventsList: [communityEvent],
      nextPageToken: "",
      totalItems: 1,
    });

    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Should display the event even though user is not attending
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(listMyEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        myCommunities: true,
        myCommunitiesExcludeGlobal: true,
      }),
    );
  });

  it("shows events user is attending from any community", async () => {
    const attendingEvent = {
      ...nonCancelledEvents[0],
      attendanceState: 2, // GOING
      organizer: false,
      ownerCommunityId: 456, // Different community
    };
    listMyEventsMock.mockResolvedValue({
      eventsList: [attendingEvent],
      nextPageToken: "",
      totalItems: 1,
    });

    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Should display the event because user is attending
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(listMyEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        myCommunities: true,
        myCommunitiesExcludeGlobal: true,
      }),
    );
  });

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
      totalItems: 0,
    });
    render(<MyEvents />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByText((content, element) => {
        // Match text split across multiple elements by checking the full text content
        return (
          element?.textContent ===
          "No events at the moment. Why don't you create one ✨?"
        );
      }),
    ).toBeVisible();
    // Check that there's a link to create a new event
    expect(screen.getByRole("link", { name: "create" })).toBeInTheDocument();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing all events";
    listMyEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(
      screen.queryByText(t("communities:events_empty_state")),
    ).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it('shows the the next page of events when the "See more events" button is clicked', async () => {
      listMyEventsMock.mockImplementation(async ({ pageToken }) => {
        return {
          eventsList: pageToken
            ? nonCancelledEvents.slice(2)
            : nonCancelledEvents.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
          totalItems: nonCancelledEvents.length,
        };
      });

      render(<MyEvents />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(screen.getAllByRole("link")).toHaveLength(2);

      const loadMoreButton = screen.getByRole("button", {
        name: t("dashboard:load_more"),
      });

      const user = userEvent.setup();

      await user.click(loadMoreButton);

      expect(await screen.findAllByRole("link")).toHaveLength(3);
      expect(listMyEventsMock).toHaveBeenCalledTimes(2);

      const eventCardPerRow = 2;
      expect(listMyEventsMock.mock.calls).toEqual([
        [
          {
            pageSize: eventCardPerRow,
            myCommunities: true,
            myCommunitiesExcludeGlobal: true,
          },
        ],
        [
          {
            pageToken: "2",
            pageSize: eventCardPerRow,
            myCommunities: true,
            myCommunitiesExcludeGlobal: true,
          },
        ],
      ]);
    });
  });

  describe("when displayed on a small screen", () => {
    beforeEach(() => {
      // @ts-ignore
      window.innerWidth = 425;
      window.matchMedia = createMatchMedia(window.innerWidth);
      listMyEventsMock.mockImplementation(async ({ pageToken }) => {
        return {
          eventsList: pageToken
            ? nonCancelledEvents.slice(2)
            : nonCancelledEvents.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
          totalItems: nonCancelledEvents.length,
        };
      });
    });

    afterEach(() => {
      // @ts-ignore
      window.innerWidth = 1024;
      window.matchMedia = createMatchMedia(window.innerWidth);
    });

    it("should load the next page of events when scrolled", async () => {
      render(<MyEvents />, { wrapper });
      expect(await screen.findAllByRole("link")).toHaveLength(2);
      expect(
        screen.queryByRole("button", {
          name: t("communities:see_more_events_label"),
        }),
      ).not.toBeInTheDocument();

      // Simulates scrolling horizontally to the end
      mockIsIntersecting(screen.getByRole("progressbar"), true);

      await waitFor(() => {
        expect(screen.getAllByRole("link")).toHaveLength(3);
      });
      expect(listMyEventsMock).toHaveBeenCalledTimes(2);

      const eventCardPerRow = 2;
      expect(listMyEventsMock.mock.calls).toEqual([
        [
          {
            pageSize: eventCardPerRow,
            myCommunities: true,
            myCommunitiesExcludeGlobal: true,
          },
        ],
        [
          {
            pageToken: "2",
            pageSize: eventCardPerRow,
            myCommunities: true,
            myCommunitiesExcludeGlobal: true,
          },
        ],
      ]);
    });
  });
});
