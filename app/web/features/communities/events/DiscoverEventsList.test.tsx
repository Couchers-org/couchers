import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import mockRouter from "next-router-mock";
import React from "react";
import { service } from "service";
import mockEvents from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getEvents } from "test/serviceMockDefaults";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import DiscoverEventsList from "./DiscoverEventsList";

const { t } = i18n;

const mockEventSearch = service.search.EventSearch as jest.MockedFunction<
  typeof service.search.EventSearch
>;

jest.mock("utils/hooks", () => ({
  ...jest.requireActual("utils/hooks"),
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
  beforeEach(() => {
    mockRouter.setCurrentUrl("/events");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the component correctly with empty state", async () => {
    mockEventSearch.mockResolvedValue({
      eventsList: [],
      totalItems: 0,
      nextPageToken: "",
    });

    render(<DiscoverEventsList />, { wrapper });

    expect(
      await screen.findByText(t("communities:discover_events_title")),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t("communities:my_communities")),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("location-autocomplete"),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        // Match text split across multiple elements by checking the full text content
        return (
          element?.textContent ===
          "No events at the moment. Why don't you create one ✨?"
        );
      }),
    ).toBeInTheDocument();
    // Check that there's a link to create a new event
    expect(screen.getByRole("link", { name: "create" })).toBeInTheDocument();
  });

  it("Excludes events the user is already attending or organizing", async () => {
    mockEventSearch.mockResolvedValue({
      eventsList: [],
      totalItems: 0,
      nextPageToken: "",
    });

    render(<DiscoverEventsList />, { wrapper });

    await waitFor(() => {
      expect(mockEventSearch).toHaveBeenCalledWith(
        expect.objectContaining({ excludeAttending: true }),
      );
    });
  });

  it("Renders error message when there is an error", async () => {
    mockEventSearch.mockRejectedValue(new Error("Error occurred"));

    render(<DiscoverEventsList />, { wrapper });

    expect(await screen.findByText("Error occurred")).toBeInTheDocument();
  });

  it("Renders events and pagination when data is available", async () => {
    mockEventSearch.mockImplementation(getEvents);

    render(<DiscoverEventsList />, { wrapper });

    expect(await screen.findByText(mockEvents[0].title)).toBeInTheDocument();
    expect(await screen.findByText(mockEvents[1].title)).toBeInTheDocument();
    expect(await screen.findByText(mockEvents[2].title)).toBeInTheDocument();
  });

  it("Handles pagination", async () => {
    mockEventSearch.mockResolvedValue({
      eventsList: mockEvents,
      totalItems: 25,
      nextPageToken: "2",
    });

    render(<DiscoverEventsList />, { wrapper });

    const user = userEvent.setup();

    const paginationButton = await screen.findByLabelText("Go to next page");
    await user.click(paginationButton);
  });

  it("Handles communities filter", async () => {
    mockEventSearch.mockImplementation(getEvents);

    render(<DiscoverEventsList />, { wrapper });

    const communitiesFilter = await screen.getByText(
      t("communities:my_communities"),
    );
    expect(communitiesFilter).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(communitiesFilter);

    expect(communitiesFilter).toHaveStyle({
      backgroundColor: theme.palette.secondary.main,
    });
  });

  it("Updates location autocomplete value on change", async () => {
    mockEventSearch.mockImplementation(getEvents);

    render(<DiscoverEventsList />, { wrapper });

    const locationInput = screen.getByTestId("location-autocomplete");
    expect(locationInput).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(locationInput, "New York, New York, United States{enter}");

    await waitFor(() => {
      expect(locationInput).toHaveValue("New York, New York, United States");
    });

    const newLocation = {
      name: "New York, New York, United States",
      simplifiedName: "New York, New York, United States",
      location: new LngLat(0, 0),
      bbox: [0, 0, 0, 0],
    };

    expect(mockEventSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchLocation: newLocation,
      }),
    );
  });
});
