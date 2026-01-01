import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const eventSearchMock = service.search.EventSearch as jest.MockedFunction<
  typeof service.search.EventSearch
>;

describe("My events", () => {
  beforeEach(() => {
    eventSearchMock.mockResolvedValue({
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
    eventSearchMock.mockResolvedValue({
      eventsList: [communityEvent],
      nextPageToken: "",
      totalItems: 1,
    });

    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Should display the event even though user is not attending
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(eventSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isMyCommunities: true,
        attending: true,
        organizing: true,
        pastEvents: false,
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
    eventSearchMock.mockResolvedValue({
      eventsList: [attendingEvent],
      nextPageToken: "",
      totalItems: 1,
    });

    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Should display the event because user is attending
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(eventSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attending: true,
        organizing: true,
        isMyCommunities: true,
      }),
    );
  });

  it("renders the empty state if there are no events", async () => {
    eventSearchMock.mockResolvedValue({
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
    eventSearchMock.mockRejectedValue(new Error(errorMessage));
    render(<MyEvents />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await assertErrorAlert(errorMessage);
    expect(
      screen.queryByText(t("communities:events_empty_state")),
    ).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it("shows pagination controls and switches pages", async () => {
      const pageSize = 4;
      const totalEvents = 10; // More than one page worth
      eventSearchMock.mockImplementation(async ({ pageNumber }) => {
        const startIdx = ((pageNumber || 1) - 1) * pageSize;
        return {
          eventsList: nonCancelledEvents.slice(startIdx, startIdx + pageSize),
          nextPageToken: "",
          totalItems: totalEvents, // Return totalItems > pageSize to show pagination
        };
      });

      render(<MyEvents />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      // Should show pagination if more than one page
      expect(
        screen.getByRole("button", { name: "Go to page 2" }),
      ).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Go to page 2" }));

      await waitFor(() => {
        expect(eventSearchMock).toHaveBeenCalledWith(
          expect.objectContaining({
            pageNumber: 2,
            pageSize,
          }),
        );
      });
    });
  });

  describe("when displayed on a small screen", () => {
    beforeEach(() => {
      // @ts-ignore
      window.innerWidth = 425;
      window.matchMedia = createMatchMedia(window.innerWidth);
    });

    afterEach(() => {
      // @ts-ignore
      window.innerWidth = 1024;
      window.matchMedia = createMatchMedia(window.innerWidth);
    });

    it("should show pagination controls on small screens", async () => {
      const totalEvents = 10;
      eventSearchMock.mockResolvedValue({
        eventsList: nonCancelledEvents.slice(0, 4),
        nextPageToken: "",
        totalItems: totalEvents, // More than one page
      });

      render(<MyEvents />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      // Pagination should be visible on small screens when multiple pages exist
      expect(
        screen.getByRole("button", { name: "Go to page 2" }),
      ).toBeInTheDocument();
    });
  });
});
