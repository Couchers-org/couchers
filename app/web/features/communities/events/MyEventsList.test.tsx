import { Pagination } from "@material-ui/lab";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import mockEvents from "test/fixtures/events.json";

import { useListMyEvents } from "./hooks";
import MyEventsList from "./MyEventsList";

jest.mock("i18n", () => ({
  useTranslation: jest.fn(),
}));

jest.mock("../events/hooks", () => ({
  useListMyEvents: jest.fn(),
}));

jest.mock("features/auth/AuthProvider", () => ({
  ...jest.requireActual("features/auth/AuthProvider"),
  useAuthContext: jest.fn(),
}));

jest.mock("@material-ui/lab", () => ({
  ...jest.requireActual("@material-ui/lab"),
  Pagination: jest.fn(),
}));

describe("MyEventsList", () => {
  const mockUseTranslation = useTranslation as jest.Mock;
  const mockUseListMyEvents = useListMyEvents as jest.Mock;
  const mockPagination = Pagination as jest.Mock;

  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });

    // Mock the return value of useAuthContext to include authState with userId
    (useAuthContext as jest.Mock).mockReturnValue({
      authState: { authenticated: true, userId: 1 },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Renders loading state", () => {
    mockUseListMyEvents.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    });

    render(<MyEventsList />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("Renders error state", () => {
    mockUseListMyEvents.mockReturnValue({
      data: null,
      error: { message: "Error loading events" },
      isLoading: false,
    });

    render(<MyEventsList />);

    expect(screen.getByText("Error loading events")).toBeInTheDocument();
  });

  it("Renders empty state when no events", () => {
    mockUseListMyEvents.mockReturnValue({
      data: { eventsList: [], totalItems: 0 },
      error: null,
      isLoading: false,
    });

    render(<MyEventsList />);

    expect(
      screen.getByText("communities:events_empty_state")
    ).toBeInTheDocument();
  });

  it("Renders events list when events are available", () => {
    mockUseListMyEvents.mockReturnValue({
      data: {
        eventsList: mockEvents.filter((event) => !event.isCancelled),
        totalItems: 3,
      },
      error: null,
      isLoading: false,
    });

    mockPagination.mockImplementation(({ onChange }) => (
      <button onClick={() => onChange({}, 1)}>Change Page</button>
    ));

    render(<MyEventsList />);

    expect(screen.getByText("Planting Season Meetup")).toBeInTheDocument();

    // check that EventItem component appears 3 times
    expect(screen.getAllByTestId("event-item")).toHaveLength(3);
  });

  it("Can toggle past events filter", async () => {
    mockUseListMyEvents.mockReturnValue({
      data: { eventsList: mockEvents, totalItems: 0 },
      error: null,
      isLoading: false,
    });

    mockPagination.mockImplementation(({ onChange }) => (
      <button onClick={() => onChange({}, 1)}>Change Page</button>
    ));

    render(<MyEventsList />);

    const pastFilter = screen.getByText("communities:past");
    expect(pastFilter).toBeInTheDocument();

    fireEvent.click(pastFilter);

    await waitFor(() =>
      expect(mockUseListMyEvents).toHaveBeenCalledWith(
        expect.objectContaining({ pastEvents: true })
      )
    );
  });

  it("Can toggle show cancelled filter", async () => {
    mockUseListMyEvents.mockReturnValue({
      data: { eventsList: mockEvents, totalItems: 0 },
      error: null,
      isLoading: false,
    });

    mockPagination.mockImplementation(({ onChange }) => (
      <button onClick={() => onChange({}, 1)}>Change Page</button>
    ));

    render(<MyEventsList />);

    const cancelledFilter = screen.getByText(
      "communities:show_cancelled_events"
    );
    expect(cancelledFilter).toBeInTheDocument();

    fireEvent.click(cancelledFilter);

    await waitFor(() =>
      expect(mockUseListMyEvents).toHaveBeenCalledWith(
        expect.objectContaining({ showCancelled: true })
      )
    );
  });

  it("Handles pagination", async () => {
    mockUseListMyEvents.mockReturnValue({
      data: {
        eventsList: [
          ...mockEvents,
          ...mockEvents.map((event) => ({
            ...event,
            eventId: event.eventId + 4,
          })),
          ...mockEvents.map((event) => ({
            ...event,
            eventId: event.eventId + 8,
          })),
          ...mockEvents.map((event) => ({
            ...event,
            eventId: event.eventId + 16,
          })),
        ],
        totalItems: 12,
      },
      error: null,
      isLoading: false,
    });

    mockPagination.mockImplementation(({ onChange }) => (
      <button onClick={() => onChange({}, 2)}>Change Page</button>
    ));

    render(<MyEventsList />);

    const paginationButton = screen.getByText("Change Page");
    fireEvent.click(paginationButton);

    await waitFor(() =>
      expect(mockUseListMyEvents).toHaveBeenCalledWith(
        expect.objectContaining({ pageNumber: 2 })
      )
    );
  });
});
