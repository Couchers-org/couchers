import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import {
  HostingStatusOptions,
  MapSearchTypes,
  MapViewOptions,
  MapViews,
  SleepingArrangementOptions,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { useMemo, useRef, useState } from "react";
import { MapProvider, MapRef } from "react-map-gl/maplibre";
import { GeocodeResult } from "utils/hooks";

import FilterDialog from "./FilterDialog";
import { useUserSearch } from "./hooks/useUserSearch";
import MapSearchContent from "./MapSearchContent";
import SearchControls from "./SearchControls";
import { useMapSearchState } from "./state/mapSearchContext";

export type FilterOptions = {
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  acceptsLastMinRequests?: boolean;
  ageMin?: number | undefined;
  ageMax?: number | undefined;
  completeProfile?: boolean;
  drinkingAllowed?: boolean;
  hasReferences?: boolean;
  hasStrongVerification?: boolean;
  hostingStatus?: HostingStatusOptions[];
  numGuests?: number;
  lastActive?: number;
  lng?: number;
  lat?: number;
  selectedUserId?: number;
  sleepingArrangement?: SleepingArrangementOptions[];
  smokingAllowed?: boolean;
};

export type SearchOptions = {
  bbox?: GeocodeResult["bbox"];
  query?: string;
  keyword?: string;
  location?: GeocodeResult;
};

const SearchPageContainer = styled("div")(({ theme }) => ({
  height: `calc(100vh - 10px - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.up("sm")]: {
    height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
  },

  overflow: "hidden",
  paddingLeft: `-${theme.spacing(2)}`,
  paddingRight: `-${theme.spacing(2)}`,
}));

/**
 * Search page, creates the state, obtains the users, renders all its sub-components
 */
export default function SearchPage() {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const mapRef = useRef<MapRef | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);

  const mapSearchState = useMapSearchState();

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({ ...mapSearchState.filters, ...mapSearchState.search }),
    [mapSearchState.filters, mapSearchState.search],
  );

  const {
    fetchNextPage,
    fetchPreviousPage,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    setPageNumber,
    totalItems,
    users,
  } = useUserSearch(searchParams, mapSearchState);

  const handleSetSearchType = (type: MapSearchTypes) => {
    setSearchType(type);
  };

  const handleOpenFiltersDialog = () => {
    setIsFiltersOpen(true);
  };

  const handleCloseFiltersDialog = () => {
    setIsFiltersOpen(false);
  };

  const handleLoadPreviousPage = () => {
    fetchPreviousPage();
    setPageNumber((prev) => prev - 1);
  };

  const handleLoadNextPage = () => {
    fetchNextPage();
    setPageNumber((prev) => prev + 1);
  };

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
  };

  const handleSetMapView = (view: MapViewOptions) => {
    setMapView(view);
  };

  return (
    <SearchPageContainer>
      <MapProvider>
        <HtmlMeta title={t("global:nav.map_search")} />
        <SearchControls
          drawerWidth={drawerWidth}
          mapRef={mapRef}
          mapView={mapView}
          onSetMapView={handleSetMapView}
          onOpenFilters={handleOpenFiltersDialog}
          onSetSearchType={handleSetSearchType}
          searchType={searchType}
        />
        <MapSearchContent
          drawerWidth={drawerWidth}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          mapRef={mapRef}
          mapView={mapView}
          onDrawerWidthChange={handleDrawerWidthChange}
          onLoadPreviousPage={handleLoadPreviousPage}
          onLoadNextPage={handleLoadNextPage}
          onOpenFilters={handleOpenFiltersDialog}
          onSetSearchType={handleSetSearchType}
          searchType={searchType}
          totalItems={totalItems}
          users={users}
        />
      </MapProvider>
      <FilterDialog
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseFiltersDialog}
      />
    </SearchPageContainer>
  );
}
