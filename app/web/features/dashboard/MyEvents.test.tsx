import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockIsIntersecting } from "react-intersection-observer/test-utils";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import {
  assertErrorAlert,
  createMatchMedia,
  mockConsoleError,
  t,
} from "test/utils";

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

    expect(
      screen.getByRole("heading", { name: t("dashboard:my_events") })
    ).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
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
      screen.queryByText(t("communities:events_empty_state"))
    ).not.toBeInTheDocument();
  });

  describe("when there are more than one page of events", () => {
    it('shows the the next page of events when the "See more events" button is clicked', async () => {
      listMyEventsMock.mockImplementation(async ({ pageToken }) => {
        return {
          eventsList: pageToken ? events.slice(2) : events.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
        };
      });
      render(<MyEvents />, { wrapper });
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
      expect(listMyEventsMock).toHaveBeenCalledTimes(2);
      expect(listMyEventsMock.mock.calls).toEqual([
        [{ pageSize: 3 }],
        [{ pageToken: "2", pageSize: 3 }],
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
          eventsList: pageToken ? events.slice(2) : events.slice(0, 2),
          nextPageToken: pageToken ? "" : "2",
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
        })
      ).not.toBeInTheDocument();

      // Simulates scrolling horizontally to the end
      mockIsIntersecting(screen.getByRole("progressbar"), true);

      await waitFor(() => {
        expect(screen.getAllByRole("link")).toHaveLength(3);
      });
      expect(listMyEventsMock).toHaveBeenCalledTimes(2);
      expect(listMyEventsMock.mock.calls).toEqual([
        [{ pageSize: 3 }],
        [{ pageToken: "2", pageSize: 3 }],
      ]);
    });
  });
});
