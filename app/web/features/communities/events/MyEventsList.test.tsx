import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import mockEvents from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getMyEvents } from "test/serviceMockDefaults";

import MyEventsList from "./MyEventsList";

const { t } = i18n;

const mockListMyEvents = service.events.listMyEvents as jest.MockedFunction<typeof service.events.listMyEvents>;

describe("MyEventsList", () => {
  const creatorUserId = 4;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Renders loading state", () => {
    render(<MyEventsList />, { wrapper });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("Renders error state", async () => {
    mockListMyEvents.mockRejectedValue(new Error("Error loading events"));

    render(<MyEventsList />, { wrapper });

    expect(await screen.findByText("Error loading events")).toBeInTheDocument();
  });

  it("Renders empty state when no events", async () => {
    mockListMyEvents.mockResolvedValue({
      eventsList: [],
      totalItems: 0,
      nextPageToken: "",
    });

    render(<MyEventsList />, { wrapper });

    expect(
      await screen.findByText((content, element) => {
        // Match text split across multiple elements by checking the full text content
        return element?.textContent === "No events at the moment. Why don't you create one ✨?";
      }),
    ).toBeInTheDocument();
    // Check that there's a link to create a new event
    expect(screen.getByRole("link", { name: "create" })).toBeInTheDocument();
  });

  it("Renders events list when events are available", async () => {
    mockListMyEvents.mockResolvedValue(getMyEvents(creatorUserId));

    render(<MyEventsList />, { wrapper });

    expect(await screen.findByText(mockEvents[1].title)).toBeVisible();
    expect(await screen.findByText(mockEvents[3].title)).toBeVisible();

    expect(screen.getAllByTestId("event-item")).toHaveLength(2);
  });

  it("Can toggle past events filter", async () => {
    mockListMyEvents.mockResolvedValue(getMyEvents(creatorUserId));

    render(<MyEventsList />, { wrapper });

    const pastFilter = await screen.findByText(t("communities:past"));
    expect(pastFilter).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(pastFilter);

    expect(mockListMyEvents).toHaveBeenCalledWith(expect.objectContaining({ pastEvents: true }));
  });

  it("Can toggle show cancelled filter", async () => {
    mockListMyEvents.mockResolvedValue(getMyEvents(creatorUserId));

    render(<MyEventsList />, { wrapper });

    const cancelledFilter = await screen.findByText(t("communities:show_cancelled_events"));
    expect(cancelledFilter).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(cancelledFilter);

    expect(mockListMyEvents).toHaveBeenCalledWith(expect.objectContaining({ showCancelled: true }));
  });

  it("Handles pagination", async () => {
    mockListMyEvents.mockResolvedValue({
      eventsList: mockEvents,
      totalItems: 25,
      nextPageToken: "2",
    });

    render(<MyEventsList />, { wrapper });

    const paginationButton = await screen.findByLabelText("Go to next page");

    const user = userEvent.setup();
    await user.click(paginationButton);

    expect(mockListMyEvents).toHaveBeenCalledWith(expect.objectContaining({ pageNumber: 2 }));
  });
});
