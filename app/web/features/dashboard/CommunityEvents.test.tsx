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
        name: t("dashboard:events_in_your_communities"),
      }),
    ).toBeVisible();
    // 3 event rows + "Browse all →" link
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(listMyEventsMock).toHaveBeenCalledWith({
      pageToken: undefined,
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
      await screen.findByText(t("dashboard:events_in_your_communities_empty")),
    ).toBeVisible();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing community events";
    listMyEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<CommunityEvents />, { wrapper });

    await assertErrorAlert(errorMessage);
  });

  it("loads more events when the load more button is clicked", async () => {
    listMyEventsMock.mockImplementation(async ({ pageToken }) => ({
      eventsList: pageToken
        ? nonCancelledEvents.slice(2)
        : nonCancelledEvents.slice(0, 2),
      nextPageToken: pageToken ? "" : "2",
      totalItems: nonCancelledEvents.length,
    }));

    render(<CommunityEvents />, { wrapper });

    await screen.findByText(nonCancelledEvents[0].title);
    // 2 event rows + "Browse all →" link
    expect(screen.getAllByRole("link")).toHaveLength(3);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("dashboard:load_more") }),
    );

    // 3 event rows + "Browse all →" link
    expect(await screen.findAllByRole("link")).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: t("dashboard:load_more") }),
    ).not.toBeInTheDocument();
    expect(listMyEventsMock).toHaveBeenCalledTimes(2);
  });
});
