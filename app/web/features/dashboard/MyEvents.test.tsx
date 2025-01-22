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

// ListMyEvents by default does not return cancelled events
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

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
      totalItems: 0,
    });
    render(<MyEvents />, { wrapper });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(t("communities:events_empty_state"))).toBeVisible();
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

      const seeMoreEventsButton = screen.getByRole("button", {
        name: t("communities:see_more_events_label"),
      });

      const user = userEvent.setup();

      await user.click(seeMoreEventsButton);

      expect(await screen.findAllByRole("link")).toHaveLength(3);
      expect(listMyEventsMock).toHaveBeenCalledTimes(2);

      const eventCardPerRow = 2;
      expect(listMyEventsMock.mock.calls).toEqual([
        [{ pageSize: eventCardPerRow }],
        [{ pageToken: "2", pageSize: eventCardPerRow }],
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
        [{ pageSize: eventCardPerRow }],
        [{ pageToken: "2", pageSize: eventCardPerRow }],
      ]);
    });
  });
});
