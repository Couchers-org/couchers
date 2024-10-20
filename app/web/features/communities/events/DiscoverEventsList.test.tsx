import { Pagination } from "@material-ui/lab";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { LngLat } from "maplibre-gl";
import React from "react";
import { useController, useForm } from "react-hook-form";
import mockEvents from "test/fixtures/events.json";
import { GeocodeResult } from "utils/hooks";

import DiscoverEventsList from "./DiscoverEventsList";
import { useEventSearch } from "./hooks";

jest.mock("react-hook-form", () => ({
  useForm: jest.fn(),
  useController: jest.fn(),
}));

jest.mock("i18n", () => ({
  useTranslation: jest.fn(),
}));

jest.mock("../events/hooks", () => ({
  useEventSearch: jest.fn(),
}));

jest.mock("features/auth/AuthProvider", () => ({
  ...jest.requireActual("features/auth/AuthProvider"),
  useAuthContext: jest.fn(),
}));

jest.mock("@material-ui/lab", () => ({
  ...jest.requireActual("@material-ui/lab"),
  Pagination: jest.fn(),
}));

jest.mock("utils/hooks", () => ({
  useGeocodeQuery: jest.fn(),
}));

jest.mock("components/LocationAutocomplete", () => {
  const LocationAutocomplete: React.FC<{
    value: GeocodeResult;
    onChange: (newLocationResult: GeocodeResult) => void;
  }> = (props) => (
    <input
      data-testid="location-autocomplete"
      value={props.value?.name}
      onChange={(e) => {
        props.onChange({
          simplifiedName: e.target.value,
          name: e.target.value,
          location: new LngLat(0, 0),
          bbox: [0, 0, 0, 0],
        });
      }}
    />
  );
  LocationAutocomplete.displayName = "LocationAutocomplete";
  return LocationAutocomplete;
});

describe("DiscoverEventsList", () => {
  const mockUseTranslation = useTranslation as jest.Mock;
  const mockUseForm = useForm as jest.Mock;
  const mockUseEventSearch = useEventSearch as jest.Mock;
  const mockUseAuthContext = useAuthContext as jest.Mock;
  const mockUseController = useController as jest.Mock;
  const mockPagination = Pagination as jest.Mock;

  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
    mockUseForm.mockReturnValue({
      control: {},
      errors: {},
    });
    mockUseController.mockReturnValue({
      field: {
        onChange: jest.fn(),
        onBlur: jest.fn(),
        value: "",
      },
    });

    // Mock the return value of useAuthContext to include authState with userId
    mockUseAuthContext.mockReturnValue({
      authState: { authenticated: true, userId: 1 },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the component correctly with empty state", () => {
    mockUseEventSearch.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });

    render(<DiscoverEventsList />);

    expect(
      screen.getByText("communities:discover_events_title")
    ).toBeInTheDocument();
    expect(screen.getByText("communities:my_communities")).toBeInTheDocument();
    expect(screen.getByText("communities:online")).toBeInTheDocument();
    expect(screen.getByTestId("location-autocomplete")).toBeInTheDocument();
    expect(
      screen.getByText("communities:events_empty_state")
    ).toBeInTheDocument();
  });

  it("Renders loading state", () => {
    mockUseEventSearch.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    });

    render(<DiscoverEventsList />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("Renders error message when there is an error", () => {
    mockUseEventSearch.mockReturnValue({
      data: null,
      error: { message: "Error occurred" },
      isLoading: false,
    });

    render(<DiscoverEventsList />);

    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("Renders events and pagination when data is available", () => {
    mockUseEventSearch.mockReturnValue({
      data: {
        eventsList: mockEvents.filter((event) => !event.isCancelled),
        totalItems: 4,
      },
      error: null,
      isLoading: false,
    });

    mockPagination.mockImplementation(({ onChange }) => (
      <button onClick={() => onChange({}, 1)}>Change Page</button>
    ));

    render(<DiscoverEventsList />);

    expect(screen.getByText("Weekly Meetup")).toBeInTheDocument();
    expect(screen.getByText("Planting Season Meetup")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cherry Blossom Bike Ride around the entire Amsterdam because I like to write long event titles"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Change Page")).toBeInTheDocument();
  });

  it("Handles pagination", async () => {
    mockUseEventSearch.mockReturnValue({
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

    render(<DiscoverEventsList />);

    const paginationButton = screen.getByText("Change Page");
    fireEvent.click(paginationButton);

    await waitFor(() =>
      expect(mockUseEventSearch).toHaveBeenCalledWith(
        expect.objectContaining({ pageNumber: 2 })
      )
    );
  });

  it("Handles communities and online filter clicks correctly", async () => {
    mockUseEventSearch.mockReturnValue({
      data: mockEvents,
      error: null,
      isLoading: false,
    });

    render(<DiscoverEventsList />);

    const communitiesFilter = screen.getByText("communities:my_communities");
    const onlineFilter = screen.getByText("communities:online");
    expect(communitiesFilter).toBeInTheDocument();
    expect(onlineFilter).toBeInTheDocument();

    fireEvent.click(communitiesFilter);

    await waitFor(() =>
      expect(mockUseEventSearch).toHaveBeenCalledWith(
        expect.objectContaining({ isMyCommunities: true })
      )
    );
    expect(communitiesFilter.className).toContain("selectedFilter");

    fireEvent.click(onlineFilter);
    await waitFor(() =>
      expect(mockUseEventSearch).toHaveBeenCalledWith(
        expect.objectContaining({ isOnlineOnly: true })
      )
    );
    expect(onlineFilter.className).toContain("selectedFilter");
  });

  it("Handles location autocomplete change correctly", async () => {
    mockUseEventSearch.mockReturnValue({
      data: mockEvents,
      error: null,
      isLoading: false,
    });

    render(<DiscoverEventsList />);

    const locationAutocomplete = screen.getByTestId("location-autocomplete");

    const newLocation = {
      simplifiedName: "New York, NY",
      name: "New York, NY",
      location: new LngLat(0, 0),
      bbox: [0, 0, 0, 0],
    };
    fireEvent.change(locationAutocomplete, {
      target: { value: "New York, NY" },
    });

    // Simulate the internal onChange handler of the autocomplete being triggered
    fireEvent.keyDown(locationAutocomplete, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockUseEventSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchLocation: newLocation,
        })
      );
    });
  });
});
