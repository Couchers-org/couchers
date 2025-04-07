import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import {
  HostingStatusOptions,
  MapViewOptions,
  MapViews,
  SleepingArrangementOptions,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { useMemo, useRef, useState } from "react";
import { MapProvider, MapRef } from "react-map-gl/maplibre";
import { GeocodeResult } from "utils/hooks";

import { useUserSearch } from "./hooks/useUserSearch";
import MapSearchContent from "./MapSearchContent";
import SearchControls from "./SearchControls";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";

export type FilterOptions = {
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  acceptsLastMinRequests?: boolean;
  ageMin?: number | undefined;
  ageMax?: number | undefined;
  completeProfile?: boolean;
  drinkingAllowed?: boolean | undefined;
  hasReferences?: boolean;
  hasStrongVerification?: boolean;
  hostingStatus?: HostingStatusOptions[];
  numGuests?: number;
  lastActive?: number;
  lng?: number;
  lat?: number;
  selectedUserId?: number;
  sleepingArrangement?: SleepingArrangementOptions[];
  smokesAtHome?: boolean | undefined;
};

export type SearchOptions = {
  bbox?: GeocodeResult["bbox"];
  query?: string;
  keyword?: string;
  location?: GeocodeResult;
};

const SearchPageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

/**
 * Search page, creates the state, obtains the users, renders all its sub-components
 */
export default function SearchPage() {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const mapRef = useRef<MapRef | null>(null);

  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);

  const mapSearchState = useMapSearchState();
  const { setPageNumber } = useMapSearchActions();

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({
      ...mapSearchState.filters,
      ...mapSearchState.search,
      selectedUserId: mapSearchState.shouldSearchByUserId
        ? mapSearchState.selectedUserId
        : undefined,
    }),
    [mapSearchState.filters, mapSearchState.search, mapSearchState.selectedUserId, mapSearchState.shouldSearchByUserId],
  );

  const {
    fetchNextPage,
    fetchPreviousPage,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    numberOfTotal,
    totalItems,
    users,
  } = useUserSearch(searchParams, mapSearchState);

  const handleLoadPreviousPage = () => {
    fetchPreviousPage();
    setPageNumber(mapSearchState.pageNumber - 1);
  };

  const handleLoadNextPage = () => {
    fetchNextPage();
    setPageNumber(mapSearchState.pageNumber + 1);
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
        />
        <MapSearchContent
          drawerWidth={drawerWidth}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          mapRef={mapRef}
          mapView={mapView}
          numberOfTotal={numberOfTotal}
          onDrawerWidthChange={handleDrawerWidthChange}
          onLoadPreviousPage={handleLoadPreviousPage}
          onLoadNextPage={handleLoadNextPage}
          totalItems={totalItems}
          users={users}
        />
      </MapProvider>
    </SearchPageContainer>
  );
}
