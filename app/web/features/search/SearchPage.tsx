import { styled, useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import {
  Coordinates,
  HostingStatusOptions,
  MapSearchTypes,
  SleepingArrangementOptions,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { MapProvider, MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import DesktopMapView from "./DesktopMapView";
import FilterDialog from "./FilterDialog";
import { useUserSearch } from "./hooks/useUserSearch";
import MobileMapView from "./MobileMapView";
import {
  MapSearchContext,
  MapSearchDispatchContext,
} from "./state/MapSearchContext";
import {
  initialState,
  mapSearchActionTypes,
  mapSearchReducer,
} from "./state/mapSearchReducers";
import { getMapBounds, mapFlyToLocation } from "./utils/mapUtils";

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

export interface FlyToLocationProps {
  longitude: number;
  latitude: number;
  zoom?: number;
}

export interface InitialSearchLocation {
  locationName: string | undefined;
  bbox: Coordinates | undefined;
}

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
export default function SearchPage({
  bbox,
  locationName,
}: {
  bbox: GeocodeResult["bbox"] | undefined;
  locationName: string | undefined;
}) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const mapRef = useRef<MapRef | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");

  // This is the pattern of using Reducer with Context we're using here:
  // https://react.dev/learn/scaling-up-with-reducer-and-context

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: { query: locationName, bbox },
    hasSearchInputValue: Boolean(locationName),
    hasSearchBounds: Boolean(bbox),
  });

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

  const flyToLocation = useCallback(
    ({ longitude, latitude, zoom }: FlyToLocationProps) => {
      mapFlyToLocation({
        longitude,
        latitude,
        zoom,
        mapRef,
      });
    },
    [mapRef],
  );

  const handleSetSearch = (search: SearchOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH,
      payload: search,
    });
    if (search.location) {
      const geojson = search.location as GeocodeResult;

      flyToLocation({
        longitude: geojson.location.lng,
        latitude: geojson.location.lat,
      });
    }
  };

  const handleSetFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTERS,
      payload: newFilters,
    });
  };

  const handleClearSearchInputValue = () => {
    const currentBbox = getMapBounds(mapRef);

    dispatch({
      type: mapSearchActionTypes.CLEAR_SEARCH_INPUT_VALUE,
      payload: { bbox: currentBbox },
    });
  };

  const handleSelectedUserIdClick = (userId: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS,
      payload: {
        userId,
      },
    });

    // scroll selected user card into view when pin is clicked
    document
      .getElementById(`search-result-${userId}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
  };

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

  const handleSetZoom = (newZoom: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_ZOOM,
      payload: { zoom: newZoom },
    });
  };

  return (
    <MapSearchContext.Provider value={mapSearchState}>
      <MapSearchDispatchContext.Provider value={dispatch}>
        <SearchPageContainer>
          <MapProvider>
            <HtmlMeta title={t("global:nav.map_search")} />
            {isMobile && (
              <MobileMapView
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                isLoading={isLoading}
                locationName={locationName}
                onClearSearchInputValue={handleClearSearchInputValue}
                onLoadPreviousPage={handleLoadPreviousPage}
                onLoadNextPage={handleLoadNextPage}
                onOpenFilters={handleOpenFiltersDialog}
                onSetSearch={handleSetSearch}
                onSetSearchType={handleSetSearchType}
                searchType={searchType}
                totalItems={totalItems}
                users={users}
              />
            )}

            {!isMobile && (
              <DesktopMapView
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                initialLocation={{ bbox, locationName }}
                isLoading={isLoading}
                mapRef={mapRef}
                onClearFilters={handleClearFilters}
                onClearSearchInputValue={handleClearSearchInputValue}
                onLoadPreviousPage={handleLoadPreviousPage}
                onLoadNextPage={handleLoadNextPage}
                onOpenFilters={handleOpenFiltersDialog}
                onSetSearch={handleSetSearch}
                onSetSearchType={handleSetSearchType}
                onSetZoom={handleSetZoom}
                onSelectedUserIdClick={handleSelectedUserIdClick}
                searchType={searchType}
                totalItems={totalItems}
                users={users}
              />
            )}
          </MapProvider>
          <FilterDialog
            isOpen={isFiltersOpen}
            onCloseDialog={handleCloseFiltersDialog}
            onSetFilters={handleSetFilters}
          />
        </SearchPageContainer>
      </MapSearchDispatchContext.Provider>
    </MapSearchContext.Provider>
  );
}
