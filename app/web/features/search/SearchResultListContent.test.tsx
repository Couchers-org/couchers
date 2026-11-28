import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostingStatus } from "proto/api_pb";
import { SearchUser } from "proto/search_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import SearchResultListContent from "./SearchResultListContent";
import { MapSearchProvider } from "./state/mapSearchContext";
import { Coordinates, MapViews } from "./utils/constants";

jest.mock("./SeachResultUserCard", () => ({
  __esModule: true,
  default: () => null,
}));

const { t } = i18n;

const BERLIN_BBOX: Coordinates = [13.0, 52.3, 13.8, 52.7];
const HOSTS_ONLY = [HostingStatus.HOSTING_STATUS_CAN_HOST, HostingStatus.HOSTING_STATUS_MAYBE];

const someUsers = (n: number) => Array.from({ length: n }, (_, i) => ({ userId: i + 1 }) as SearchUser.AsObject);

function renderResults({
  totalFilteredItems,
  totalUnfilteredItems,
  users = someUsers(3),
  locationName = "Berlin",
  keyword,
  hostingStatus,
  onOpenFilters = () => {},
}: {
  totalFilteredItems: number;
  totalUnfilteredItems: number;
  users?: SearchUser.AsObject[];
  locationName?: string;
  keyword?: string;
  hostingStatus?: HostingStatus[];
  onOpenFilters?: () => void;
}) {
  // a keyword search has a query but no area
  render(
    <MapSearchProvider
      initialBbox={keyword ? undefined : BERLIN_BBOX}
      initialLocationName={keyword ?? locationName}
      initialFilters={hostingStatus ? { hostingStatus } : {}}
    >
      <SearchResultListContent
        error={null}
        mapView={MapViews.MAP_AND_LIST}
        currentRange={{ firstResultNumber: 1, lastResultNumber: 3 }}
        onOpenFilters={onOpenFilters}
        onSetMapView={() => {}}
        onUserCardClick={() => {}}
        showAlert={false}
        totalFilteredItems={totalFilteredItems}
        totalUnfilteredItems={totalUnfilteredItems}
        users={users}
      />
    </MapSearchProvider>,
    { wrapper },
  );
}

describe("SearchResultListContent results line", () => {
  it("says hosts when only hosts are shown, with everyone in the area underneath", () => {
    renderResults({ totalFilteredItems: 250, totalUnfilteredItems: 1450, hostingStatus: HOSTS_ONLY });

    expect(screen.getByRole("heading", { name: "250 hosts in Berlin" })).toBeVisible();
    expect(screen.getByText("of 1,450 members in this area")).toBeVisible();
    // the area total replaces the page position
    expect(screen.queryByText(/Results/)).not.toBeInTheDocument();
  });

  it("names the active filters and opens them", async () => {
    const onOpenFilters = jest.fn();
    renderResults({
      totalFilteredItems: 250,
      totalUnfilteredItems: 1450,
      hostingStatus: HOSTS_ONLY,
      onOpenFilters,
    });

    await userEvent.click(screen.getByRole("button", { name: "1 filter" }));

    expect(onOpenFilters).toHaveBeenCalled();
  });

  it("doesn't mention filters when none are on", () => {
    renderResults({ totalFilteredItems: 5090, totalUnfilteredItems: 5090 });

    expect(screen.queryByRole("button", { name: /filter/ })).not.toBeInTheDocument();
  });

  it("says members when everyone can show", () => {
    renderResults({ totalFilteredItems: 1240, totalUnfilteredItems: 5090 });

    expect(screen.getByRole("heading", { name: "1,240 members in Berlin" })).toBeVisible();
    expect(screen.getByText("of 5,090 members in this area")).toBeVisible();
  });

  it("leaves out the area total when the filters hide nobody", () => {
    renderResults({ totalFilteredItems: 5090, totalUnfilteredItems: 5090 });

    expect(screen.getByRole("heading", { name: "5,090 members in Berlin" })).toBeVisible();
    expect(screen.queryByText(/of 5,090/)).not.toBeInTheDocument();
  });

  it("says 'this area' when the area isn't a searched place", () => {
    renderResults({ totalFilteredItems: 1240, totalUnfilteredItems: 5090, locationName: "" });

    expect(screen.getByRole("heading", { name: "1,240 members in this area" })).toBeVisible();
  });

  it("leaves out the area total when it isn't known", () => {
    renderResults({ totalFilteredItems: 3, totalUnfilteredItems: 0 });

    expect(screen.getByRole("heading", { name: "3 members in Berlin" })).toBeVisible();
    expect(screen.queryByText(/in this area/)).not.toBeInTheDocument();
  });

  it("counts keyword matches", () => {
    renderResults({ totalFilteredItems: 12, totalUnfilteredItems: 0, keyword: "climbing" });

    expect(screen.getByRole("heading", { name: "12 members match “climbing”" })).toBeVisible();
  });

  it("points out the area's members when the filters match nobody", () => {
    renderResults({ totalFilteredItems: 0, totalUnfilteredItems: 5090, users: [], hostingStatus: HOSTS_ONLY });

    expect(screen.getByRole("heading", { name: "No hosts match your filters" })).toBeVisible();
    expect(screen.getByText("5,090 members are in Berlin")).toBeVisible();
  });

  it("keeps the generic message when nothing matches and the area total isn't known", () => {
    renderResults({ totalFilteredItems: 0, totalUnfilteredItems: 0, users: [] });

    expect(screen.getByRole("heading", { name: t("search:search_result.no_user_result_message") })).toBeVisible();
  });

  it("shows the page position when the area total isn't known", () => {
    renderResults({ totalFilteredItems: 3, totalUnfilteredItems: 0 });

    expect(screen.getByText("Results 1–3")).toBeVisible();
  });

  it("leaves out the page position when nothing matches", () => {
    renderResults({ totalFilteredItems: 0, totalUnfilteredItems: 5090, users: [] });

    expect(screen.queryByText(/Results/)).not.toBeInTheDocument();
  });
});
