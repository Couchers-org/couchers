import { act, render } from "@testing-library/react";
import { MapSearchProvider } from "features/search/state/mapSearchContext";
import { ComponentProps } from "react";
import { MapRef } from "react-map-gl/maplibre";
import wrapper from "test/hookWrapper";

import { useUserSearch } from "./hooks/useUserSearch";
import MapSearchContent from "./MapSearchContent";
import SearchPage from "./SearchPage";

// Tests for the onZoomIn/onZoomOut guards in SearchPage.tsx (Sentry FRONTEND-6E3/6E4). They check when
// easeTo is called or skipped against a mocked map; they cannot reproduce the freeze itself, which
// needs real maplibre.

jest.mock("./MapSearchContent", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./SearchControls", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("./hooks/useUserSearch", () => ({
  useUserSearch: jest.fn(),
}));

type CapturedMapSearchContentProps = Pick<ComponentProps<typeof MapSearchContent>, "mapRef" | "onZoomIn" | "onZoomOut">;

type FakeMapRef = Pick<MapRef, "getZoom" | "easeTo" | "getMap">;

const MapSearchContentMock = MapSearchContent as jest.Mock;
const useUserSearchMock = useUserSearch as jest.Mock;

describe("SearchPage map zoom handlers", () => {
  let onZoomIn: CapturedMapSearchContentProps["onZoomIn"];
  let onZoomOut: CapturedMapSearchContentProps["onZoomOut"];
  let fakeMapRef: FakeMapRef;

  beforeEach(() => {
    useUserSearchMock.mockReturnValue({
      error: null,
      users: [],
      isLoading: false,
      hasNextPage: false,
      hasPreviousPage: false,
      fetchNextPage: jest.fn(),
      fetchPreviousPage: jest.fn(),
      currentRange: "0",
      totalItems: 0,
      searchQueryId: "test-query-id",
    });

    fakeMapRef = {
      getZoom: jest.fn(),
      easeTo: jest.fn(),
      getMap: jest.fn().mockReturnValue({
        getBounds: () => ({
          getNorthEast: () => ({ lng: 1, lat: 2 }),
          getSouthWest: () => ({ lng: 3, lat: 4 }),
        }),
      }),
    };

    MapSearchContentMock.mockImplementation(
      ({ mapRef, onZoomIn: zoomIn, onZoomOut: zoomOut }: CapturedMapSearchContentProps) => {
        mapRef.current = fakeMapRef as unknown as MapRef;
        onZoomIn = zoomIn;
        onZoomOut = zoomOut;
        return <div>map search content</div>;
      },
    );
  });

  const renderSearchPage = () =>
    render(
      <MapSearchProvider initialBbox={undefined} initialLocationName={undefined} initialFilters={{}}>
        <SearchPage />
      </MapSearchProvider>,
      { wrapper },
    );

  it("does not re-trigger easeTo when the map's own zoomend echoes the already-applied zoom with no center", () => {
    renderSearchPage();
    (fakeMapRef.getZoom as jest.Mock).mockReturnValue(9);

    act(() => {
      onZoomOut(9);
    });

    expect(fakeMapRef.easeTo).not.toHaveBeenCalled();
  });

  it("still animates to a new center when a search result card is clicked, even at the map's current zoom", () => {
    renderSearchPage();
    (fakeMapRef.getZoom as jest.Mock).mockReturnValue(15);

    act(() => {
      onZoomIn(15, [2.35, 48.85]);
    });

    expect(fakeMapRef.easeTo).toHaveBeenCalledWith({
      center: [2.35, 48.85],
      zoom: 15,
      duration: 2000,
    });
  });

  it("does not call easeTo for a zoom-in echo with no center and no zoom change", () => {
    renderSearchPage();
    (fakeMapRef.getZoom as jest.Mock).mockReturnValue(10);

    act(() => {
      onZoomIn(10);
    });

    expect(fakeMapRef.easeTo).not.toHaveBeenCalled();
  });

  it("still animates a real zoom-out with no center, e.g. the zoom-control minus button", () => {
    renderSearchPage();
    (fakeMapRef.getZoom as jest.Mock).mockReturnValue(9);

    act(() => {
      onZoomOut(7);
    });

    expect(fakeMapRef.easeTo).toHaveBeenCalledWith({
      zoom: 7,
      duration: 2000,
    });
  });

  it("still animates a real zoom-in with no center, e.g. the zoom-control plus button", () => {
    renderSearchPage();
    (fakeMapRef.getZoom as jest.Mock).mockReturnValue(9);

    act(() => {
      onZoomIn(11);
    });

    expect(fakeMapRef.easeTo).toHaveBeenCalledWith({
      center: undefined,
      zoom: 11,
      duration: 2000,
    });
  });
});
