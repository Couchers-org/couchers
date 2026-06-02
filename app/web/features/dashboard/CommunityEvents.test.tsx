import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import CommunityEvents from "./CommunityEvents";

const { t } = i18n;

const nonCancelledEvents = events.filter((event) => !event.isCancelled);

const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<
  typeof service.events.listMyEvents
>;

describe("Community events", () => {
  beforeEach(() => {
    listMyEventsMock.mockResolvedValue({
      eventsList: nonCancelledEvents,
      nextPageToken: "",
      totalItems: nonCancelledEvents.length,
    });
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
    expect(listMyEventsMock).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 5,
      myCommunities: true,
      myCommunitiesExcludeGlobal: true,
    });
  });

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
      totalItems: 0,
    });
    render(<CommunityEvents />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:events.community_empty_message")),
    ).toBeVisible();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing community events";
    listMyEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<CommunityEvents />, { wrapper });

    await assertErrorAlert(errorMessage);
  });

  it("navigates to the next page when the next arrow is clicked", async () => {
    const firstPage = nonCancelledEvents.slice(0, 2);
    const secondPage = nonCancelledEvents.slice(2);

    listMyEventsMock.mockImplementation(async ({ pageNumber }) => ({
      eventsList: pageNumber === 2 ? secondPage : firstPage,
      nextPageToken: "",
      // totalItems > PAGE_SIZE so the next arrow is enabled on page 1
      totalItems: 8,
    }));

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
      pageNumber: 2,
      pageSize: 5,
      myCommunities: true,
      myCommunitiesExcludeGlobal: true,
    });
  });
});
