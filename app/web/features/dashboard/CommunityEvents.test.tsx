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
const getDashboardMock = service.dashboard.getDashboard as jest.MockedFunction<typeof service.dashboard.getDashboard>;

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

  it("navigates to the next page when the next arrow is clicked", async () => {
    const firstPage = nonCancelledEvents.slice(0, 2);
    const secondPage = nonCancelledEvents.slice(2);

    // the first page comes with the dashboard, later pages from the widget's own RPC
    getDashboardMock.mockImplementation(() =>
      getDashboard({
        communityEvents: {
          eventsList: firstPage,
          nextPageToken: "page2_token",
          totalItems: firstPage.length + secondPage.length,
        },
      }),
    );
    listMyEventsMock.mockResolvedValue({
      eventsList: secondPage,
      nextPageToken: "",
      totalItems: firstPage.length + secondPage.length,
    });

    render(<CommunityEvents />, { wrapper });

    await screen.findByText(firstPage[0].title);
    expect(screen.getByText(firstPage[1].title)).toBeVisible();
    expect(screen.queryByText(secondPage[0].title)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("dashboard:next_page_button_a11y"),
      }),
    );

    await screen.findByText(secondPage[0].title);
    expect(screen.queryByText(firstPage[0].title)).not.toBeInTheDocument();
    expect(listMyEventsMock).toHaveBeenCalledWith({
      pageToken: "page2_token",
      pageSize: 3,
      myCommunities: true,
      myCommunitiesExcludeGlobal: true,
      excludeAttending: true,
    });
  });
});
