import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getDashboard } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import CommunityEvents from "./CommunityEvents";

const { t } = i18n;

const nonCancelledEvents = events.filter((event) => !event.isCancelled);

const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<typeof service.events.listMyEvents>;
const getDashboardMock = service.screens.getDashboard as jest.MockedFunction<typeof service.screens.getDashboard>;

describe("Community events", () => {
  beforeEach(() => {
    getDashboardMock.mockImplementation(() =>
      getDashboard({
        communityEvents: { eventsList: nonCancelledEvents, nextPageToken: "", totalItems: nonCancelledEvents.length },
      }),
    );
  });

  it("renders the section correctly", async () => {
    render(<CommunityEvents />, { wrapper });

    await screen.findByText(nonCancelledEvents[0].title);

    expect(
      screen.getByRole("heading", {
        name: t("dashboard:events.community_header"),
      }),
    ).toBeVisible();
    // 3 event row links (no "Browse all" link — navigation uses arrow buttons)
    expect(screen.getAllByRole("link")).toHaveLength(3);
    // the first page comes from the dashboard, not a separate request
    expect(listMyEventsMock).not.toHaveBeenCalled();
  });

  it("renders the empty state if there are no events", async () => {
    getDashboardMock.mockImplementation(() => getDashboard());
    render(<CommunityEvents />, { wrapper });

    expect(
      await screen.findByText(
        (_content, element) => {
          return element?.textContent === "No events at the moment. Why don't you create one ✨?";
        },
        { selector: "p" },
      ),
    ).toBeVisible();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing community events";
    getDashboardMock.mockRejectedValue(new Error(errorMessage));
    render(<CommunityEvents />, { wrapper });

    await assertErrorAlert(errorMessage);
  });

  it("pages through the dashboard's events without fetching more", async () => {
    // GetDashboard returns a few pages' worth; a fourth event spills onto a second page of 3
    const extraEvent = { ...nonCancelledEvents[0], eventId: 999, slug: "extra-event", title: "Extra event" };
    const allEvents = [...nonCancelledEvents, extraEvent];
    getDashboardMock.mockImplementation(() =>
      getDashboard({
        communityEvents: { eventsList: allEvents, nextPageToken: "", totalItems: allEvents.length },
      }),
    );

    render(<CommunityEvents />, { wrapper });

    await screen.findByText(allEvents[0].title);
    expect(screen.queryByText(extraEvent.title)).not.toBeInTheDocument();

    const user = userEvent.setup();
    const nextButton = screen.getByRole("button", { name: t("dashboard:next_page_button_a11y") });
    await user.click(nextButton);

    expect(await screen.findByText(extraEvent.title)).toBeVisible();
    expect(screen.queryByText(allEvents[0].title)).not.toBeInTheDocument();
    // the last page: nothing further to page to, and no extra request was made
    expect(nextButton).toBeDisabled();
    expect(getDashboardMock).toHaveBeenCalledTimes(1);
    expect(listMyEventsMock).not.toHaveBeenCalled();
  });
});
