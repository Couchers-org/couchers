import { render, screen } from "@testing-library/react";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import MyEvents from "./MyEvents";

const { t } = i18n;

// EventSearch by default does not return cancelled events
const nonCancelledEvents = events.filter((event) => !event.isCancelled);

const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<typeof service.events.listMyEvents>;

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

    await screen.findByText(nonCancelledEvents[0].title);

    expect(
      screen.getByRole("heading", {
        name: t("dashboard:events.your_upcoming_header"),
      }),
    ).toBeVisible();
    // 3 event row links (no "See all" link — navigation uses arrow buttons)
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(listMyEventsMock).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 3 }));
  });

  it("renders the empty state if there are no events", async () => {
    listMyEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
      totalItems: 0,
    });
    render(<MyEvents />, { wrapper });

    expect(
      await screen.findByText(
        (_content, element) => {
          return element?.textContent === "No events at the moment. Why don't you create one ✨?";
        },
        { selector: "p" },
      ),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "create" })).toBeInTheDocument();
  });

  it("shows an error alert if the events failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing all events";
    listMyEventsMock.mockRejectedValue(new Error(errorMessage));
    render(<MyEvents />, { wrapper });

    await assertErrorAlert(errorMessage);
  });
});
