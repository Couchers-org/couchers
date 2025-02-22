import { styled, useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { HostingStatusOptions } from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
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
  smokingAllowed?: boolean;
};

export type SearchQueryOptions = {
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
export default function SearchPage({ locationName }: { locationName: string }) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const queryClient = new QueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const mapRef = useRef<MapRef | null>(null);

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    searchQuery: {
      ...initialState.searchQuery,
      query: locationName,
    },
    hasSearchQuery: Boolean(locationName),
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
    const bbox = initialState.searchQuery.bbox!;
    flyToLocation({
      longitude: (bbox[0] + bbox[2]) / 2,
      latitude: (bbox[1] + bbox[3]) / 2,
      zoom: 1,
    });
  }, [flyToLocation]);

  const { data, isLoading, isFetching } = useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    [
      "userSearch",
      { ...mapSearchState.filters, ...mapSearchState.searchQuery },
    ],
    ({ pageParam }) => {
      return service.search.userSearch(
        { ...mapSearchState.filters, ...mapSearchState.searchQuery },
        pageParam,
      );
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    },
  );

  const formattedUsers = data?.pages
    .flatMap((page) => page.resultsList)
    .map((result) => result.user)
    .filter((user): user is User.AsObject => Boolean(user)); // Type guard to remove undefined

  const memoizedUsers = useMemo(() => formattedUsers, [formattedUsers]);

  const handleSetSearchQuery = (searchQuery: SearchQueryOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_SEARCH_QUERY,
      payload: searchQuery,
    });
    if (searchQuery.location) {
      const geojson = searchQuery.location as GeocodeResult;

      flyToLocation({
        longitude: geojson.location.lng,
        latitude: geojson.location.lat,
      });
    }

    // Indicates field was cleared
    if (searchQuery.keyword === "") {
      flyToLocation({
        longitude: 0,
        latitude: 0,
        zoom: 1,
      });
    }
  };

  const handleSetFilters = (newFilters: FilterOptions) => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTERS,
      payload: newFilters,
    });
  };

  const handleClearSearchQuery = () => {
    dispatch({ type: mapSearchActionTypes.CLEAR_SEARCH_QUERY });
    flyToLocation({
      longitude: 0,
      latitude: 0,
      zoom: 1,
    });
  };

  const handleSelectedUserIdClick = (userId: number) => {
    dispatch({
      type: mapSearchActionTypes.SET_SELECTED_USER_IDS,
      payload: {
        userId,
      },
    });

    //update result list
    document
      .getElementById(`search-result-${userId}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
  };

  return (
    <SearchPageContainer>
      <MapProvider>
        <QueryClientProvider client={queryClient}>
          <HtmlMeta title={t("global:nav.map_search")} />
          {isMobile && <MobileMapView />}

          {!isMobile && (
            <DesktopMapView
              flyToLocation={flyToLocation}
              hasActiveFilters={mapSearchState.hasActiveFilters}
              isLoading={isLoading || isFetching}
              mapRef={mapRef}
              onClearFilters={handleClearFilters}
              onClearSearchQuery={handleClearSearchQuery}
              onSetFilters={handleSetFilters}
              onSetSearchQuery={handleSetSearchQuery}
              onSelectedUserIdClick={handleSelectedUserIdClick}
              searchQuery={mapSearchState.searchQuery.query}
              selectedUserIds={mapSearchState.selectedUserIds}
              users={memoizedUsers}
            />
          )}
        </QueryClientProvider>
      </MapProvider>
    </SearchPageContainer>
  );
}
