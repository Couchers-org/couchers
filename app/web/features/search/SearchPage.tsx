import { useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useReducer, useRef, useState } from "react";
import { MapProvider, MapRef, ViewState } from "react-map-gl/maplibre";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "react-query";
import { service } from "service";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import DesktopMapView from "./DesktopMapView";
import {
  initialState,
  mapSearchActionTypes,
  mapSearchReducer,
} from "./mapSearchReducers";
import MobileMapView from "./MobileMapView";

type FilterKey = "location" | "query" | "lng" | "lat" | "selectedUserId";
type FilterValue = string | GeocodeResult | number | null;

/**
 * Search page, creates the state, obtains the users, renders all its sub-components
 */
export default function SearchPage({
  locationName,
  bbox,
}: {
  locationName: string;
  bbox: Coordinates;
}) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const queryClient = new QueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const mapRef = useRef<MapRef | null>(null);

  const [viewState, setViewState] = useState<ViewState>({
    latitude: 0,
    longitude: 0,
    zoom: 1,
    pitch: 0,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    filters: {
      ...initialState.filters,
      bbox,
      query: locationName,
    },
  });

  const { data, isLoading, isFetching } = useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    ["userSearch", mapSearchState.filters],
    ({ pageParam }) => {
      return service.search.userSearch(mapSearchState.filters, pageParam);
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    },
  );

  const formattedResults = data?.pages
    .flatMap((page) => page.resultsList)
    .map((result) => result.user)
    .filter((user): user is User.AsObject => Boolean(user)); // Type guard to remove undefined

  const handleFiltersChange = (key: FilterKey, newValue: FilterValue): void => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTER,
      payload: {
        key,
        value: newValue,
      },
    });

    if (key === "location") {
      const geojson = newValue as GeocodeResult;

      setViewState({
        ...viewState,
        longitude: geojson.location.lng,
        latitude: geojson.location.lat,
        zoom: 10,
      });
    }
  };

  const handleSelectedUserIdClick = (userId: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS,
      payload: {
        userId,
      },
    });
  };

  const handleClearFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
    setViewState({
      latitude: 0,
      longitude: 0,
      zoom: 1,
      pitch: 0,
      bearing: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  };

  const handleViewStateChange = (newViewState: ViewState) => {
    setViewState(newViewState);
  };

  return (
    <MapProvider>
      <QueryClientProvider client={queryClient}>
        <HtmlMeta title={t("global:nav.map_search")} />
        {isMobile && <MobileMapView />}

        {!isMobile && (
          <DesktopMapView
            isLoading={isLoading || isFetching}
            mapRef={mapRef}
            onClearFilters={handleClearFilters}
            onFilterChange={handleFiltersChange}
            onSelectedUserIdClick={handleSelectedUserIdClick}
            onViewStateChange={handleViewStateChange}
            query={mapSearchState.filters.query}
            selectedUserIds={mapSearchState.selectedUserIds}
            users={formattedResults}
            viewState={viewState}
          />
        )}
      </QueryClientProvider>
    </MapProvider>
  );
}

export type { FilterKey, FilterValue };
