import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { useLogEvent } from "features/analytics/hooks";
import { SearchAnalyticsProvider } from "features/analytics/searchAnalyticsContext";
import { getOrCreateSearchSessionId } from "features/analytics/searchAttribution";
import {
  MapViewOptions,
  MapViews,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
  SleepingArrangementOptions,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import { useEffect, useMemo, useRef, useState } from "react";
import { LngLatLike, MapProvider, MapRef } from "react-map-gl/maplibre";

import { useUserSearch } from "./hooks/useUserSearch";
import MapSearchContent from "./MapSearchContent";
import SearchControls from "./SearchControls";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { getMapBounds } from "./utils/mapUtils";

/**
 * See map search architecture diagram and a description of the main concepts here:
 * docs/architecture/frontend/map-search.md
 */

export type FilterOptions = {
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  acceptsLastMinRequests?: boolean;
  ageMin?: number | undefined;
  ageMax?: number | undefined;
  showEmptyProfile?: boolean;
  drinkingAllowed?: boolean | undefined;
  hasReferences?: boolean;
  hasStrongVerification?: boolean;
  hostingStatus?: HostingStatus[];
  meetupStatus?: MeetupStatus[];
  numGuests?: number;
  lastActive?: number;
  lng?: number;
  lat?: number;
  selectedUserId?: number;
  sleepingArrangement?: SleepingArrangementOptions[];
  smokesAtHome?: boolean | undefined;
  sameGenderOnly?: boolean;
};

const SearchPageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  position: "relative",

  [theme.breakpoints.down("md")]: {
    display: "grid",
    gridTemplateRows: "auto 1fr",
  },
}));

const SearchControlsWrapper = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
  },
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
  const {
    setPageNumber,
    setMapQueryArea,
    setMoveMapUIOnly,
    setShowSearchThisAreaButton,
    setSelectedUserId,
  } = useMapSearchActions();

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({
      ...mapSearchState.filters,
      ...mapSearchState.search,
      // Don't send query when bbox is present (location search vs keyword search)
      query: mapSearchState.search.bbox
        ? undefined
        : mapSearchState.search.query,
      selectedUserId: mapSearchState.shouldSearchByUserId
        ? mapSearchState.selectedUserId
        : undefined,
    }),
    [
      mapSearchState.filters,
      mapSearchState.search,
      mapSearchState.selectedUserId,
      mapSearchState.shouldSearchByUserId,
    ],
  );

  const {
    error,
    fetchNextPage,
    fetchPreviousPage,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    currentRange,
    totalItems,
    users,
    searchQueryId,
  } = useUserSearch(searchParams, mapSearchState);

  const logEvent = useLogEvent();
  const lastRenderedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!users || isLoading) return;
    const key = `${searchQueryId}:${mapSearchState.pageNumber}`;
    if (lastRenderedKeyRef.current === key) return;
    lastRenderedKeyRef.current = key;
    logEvent("search.results_rendered", {
      search_session_id: getOrCreateSearchSessionId(),
      search_query_id: searchQueryId,
      page_number: mapSearchState.pageNumber,
      num_results: users.length,
      total_items: totalItems,
      has_next_page: hasNextPage,
      has_previous_page: hasPreviousPage,
      map_view: mapView,
      query: mapSearchState.search.query ?? null,
      bbox: mapSearchState.search.bbox ?? null,
      zoom: mapSearchState.uiOnly.zoom,
      filters: mapSearchState.filters,
    });
  }, [
    users,
    isLoading,
    searchQueryId,
    mapSearchState.pageNumber,
    mapSearchState.search.query,
    mapSearchState.search.bbox,
    mapSearchState.uiOnly.zoom,
    mapSearchState.filters,
    hasNextPage,
    hasPreviousPage,
    totalItems,
    mapView,
    logEvent,
  ]);

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

  const handleZoomIn = (
    newZoom: number,
    center?: LngLatLike,
    isLocationSearch: boolean = false,
  ) => {
    const didCrossSearchThreshold =
      newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH &&
      mapSearchState.uiOnly.zoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

    // If it's the first zoom within threshold, set the map bounds so the user pins load
    if (
      didCrossSearchThreshold &&
      !isLocationSearch && // need to pass since it's zoomed before state is set
      !mapSearchState.search.query // not keyword search bc already has filter then
    ) {
      const bbox = getMapBounds(mapRef);
      setMapQueryArea(bbox, newZoom, didCrossSearchThreshold);
    } else {
      setMoveMapUIOnly({ zoom: newZoom });
    }

    mapRef.current?.easeTo({
      center,
      zoom: newZoom,
      duration: 2000,
    });
  };

  const handleZoomOut = (newZoom: number) => {
    const didZoomOutWithinThreshold = newZoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;
    const didZoomBelowThreshold = newZoom < MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

    setSelectedUserId(undefined);

    if (didZoomBelowThreshold) {
      setMapQueryArea(undefined, newZoom);
    } else if (didZoomOutWithinThreshold) {
      setShowSearchThisAreaButton(true);
    }

    mapRef.current?.easeTo({
      zoom: newZoom,
      duration: 2000,
    });
  };

  return (
    <SearchPageContainer>
      <MapProvider>
        <HtmlMeta title={t("global:nav.map_search")} />
        <SearchControlsWrapper>
          <SearchControls
            drawerWidth={drawerWidth}
            mapRef={mapRef}
            mapView={mapView}
            onSetMapView={handleSetMapView}
            onZoomIn={handleZoomIn}
          />
        </SearchControlsWrapper>
        <SearchAnalyticsProvider
          searchQueryId={searchQueryId}
          pageNumber={mapSearchState.pageNumber}
        >
          <MapSearchContent
            error={error}
            drawerWidth={drawerWidth}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            mapRef={mapRef}
            mapView={mapView}
            currentRange={currentRange}
            onDrawerWidthChange={handleDrawerWidthChange}
            onLoadPreviousPage={handleLoadPreviousPage}
            onLoadNextPage={handleLoadNextPage}
            onSetMapView={handleSetMapView}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            totalItems={totalItems}
            users={users}
          />
        </SearchAnalyticsProvider>
      </MapProvider>
    </SearchPageContainer>
  );
}
