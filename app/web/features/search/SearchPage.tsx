import { useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { MapProvider, MapRef } from "react-map-gl/maplibre";
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

export interface FlyToLocationProps {
  longitude: number;
  latitude: number;
  zoom?: number;
}

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

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    filters: {
      ...initialState.filters,
      bbox,
      query: locationName,
    },
  });

  const flyToLocation = useCallback(
    ({ longitude, latitude, zoom }: FlyToLocationProps) => {
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: zoom || 12,
        duration: 2000,
      });
    },
    [],
  );

  useEffect(() => {
    if (bbox) {
      flyToLocation({
        longitude: (bbox[0] + bbox[2]) / 2,
        latitude: (bbox[1] + bbox[3]) / 2,
      });
    }
  }, [bbox, flyToLocation, locationName]);

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

      flyToLocation({
        longitude: geojson.location.lng,
        latitude: geojson.location.lat,
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

    flyToLocation({
      longitude: 0,
      latitude: 0,
      zoom: 1,
    });
  };

  return (
    <MapProvider>
      <QueryClientProvider client={queryClient}>
        <HtmlMeta title={t("global:nav.map_search")} />
        {isMobile && <MobileMapView />}

        {!isMobile && (
          <DesktopMapView
            flyToLocation={flyToLocation}
            isLoading={isLoading || isFetching}
            mapRef={mapRef}
            onClearFilters={handleClearFilters}
            onFilterChange={handleFiltersChange}
            onSelectedUserIdClick={handleSelectedUserIdClick}
            query={mapSearchState.filters.query}
            selectedUserIds={mapSearchState.selectedUserIds}
            users={formattedResults}
          />
        )}
      </QueryClientProvider>
    </MapProvider>
  );
}

export type { FilterKey, FilterValue };
