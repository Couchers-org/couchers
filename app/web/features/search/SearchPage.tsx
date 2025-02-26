import { styled, useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import {
  Coordinates,
  HostingStatusOptions,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useCallback, useMemo, useReducer, useRef } from "react";
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
import { getMapBounds } from "./utils/mapUtils";

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
  const queryClient = new QueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const mapRef = useRef<MapRef | null>(null);

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: {
      query: locationName,
      bbox,
    },
    hasSearchInputValue: Boolean(locationName),
    hasSearchBounds: Boolean(bbox),
  });

  const zoom = mapRef.current?.getZoom() || 1;

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

  const { data, isLoading, isFetching } = useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    [
      "userSearch",
      { ...mapSearchState.filters, ...mapSearchState.search }, // @TODO(NA): is it inefficient to pass the whole object?
    ],
    ({ pageParam }) => {
      return service.search.userSearch(
        { ...mapSearchState.filters, ...mapSearchState.search },
        pageParam,
      );
    },
    {
      enabled:
        mapSearchState.hasActiveFilters ||
        zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH ||
        mapSearchState.hasSearchInputValue, // only fetch when zoomed in or filters
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    },
  );

  const formattedUsers = data?.pages
    .flatMap((page) => page.resultsList)
    .map((result) => result?.user)
    .filter((user): user is User.AsObject => Boolean(user)); // Type guard to remove undefined

  const memoizedUsers = useMemo(() => formattedUsers, [formattedUsers]);

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
              hasActiveFilters={mapSearchState.hasActiveFilters}
              hasSearchInputValue={mapSearchState.hasSearchInputValue}
              initialLocation={{ bbox, locationName }}
              isLoading={isLoading || isFetching}
              mapRef={mapRef}
              onClearFilters={handleClearFilters}
              onClearSearchInputValue={handleClearSearchInputValue}
              onSetFilters={handleSetFilters}
              onSetSearch={handleSetSearch}
              onSelectedUserIdClick={handleSelectedUserIdClick}
              selectedUserIds={mapSearchState.selectedUserIds}
              users={memoizedUsers}
            />
          )}
        </QueryClientProvider>
      </MapProvider>
    </SearchPageContainer>
  );
}
