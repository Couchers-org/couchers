import { styled, useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import {
  Coordinates,
  HostingStatusOptions,
  MapSearchTypes,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
} from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
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
import FilterDialog from "./FilterDialog";
import {
  initialState,
  mapSearchActionTypes,
  mapSearchReducer,
} from "./mapSearchReducers";
import MobileMapView from "./MobileMapView";
import {
  getMapBounds,
  mapFlyToLocation,
  meetsApiSearchCriteria,
} from "./utils/mapUtils";

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

  const [zoom, setZoom] = useState(1);

  // Keep track of zoom, i.e. when zooming in to clusters
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on("zoomend", handleZoom);
    map.on("moveend", handleZoom);

    return () => {
      map.off("zoomend", handleZoom);
      map.off("moveend", handleZoom);
    };
  }, [mapRef.current]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");

  const [mapSearchState, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    search: {
      query: locationName,
      bbox,
    },
    hasSearchInputValue: Boolean(locationName),
    hasSearchBounds: Boolean(bbox),
  });

  // useMemo to avoid unnecessary object reference changes - causing unnecessary rerenders
  const searchParams = useMemo(
    () => ({ ...mapSearchState.filters, ...mapSearchState.search }),
    [mapSearchState.filters, mapSearchState.search],
  );

  const { data, fetchNextPage, isLoading, hasNextPage, isFetching } =
    useInfiniteQuery<UserSearchRes.AsObject, Error>(
      ["userSearch", searchParams],
      ({ pageParam }) => {
        return service.search.userSearch(searchParams, pageParam);
      },
      {
        enabled:
          mapSearchState.hasActiveFilters ||
          zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH ||
          mapSearchState.hasSearchInputValue, // only fetch when zoomed in, filters or input has value
        getNextPageParam: (lastPage) =>
          lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
      },
    );

  const totalItems = data?.pages[0]?.totalItems ?? 0;

  const formattedUsers = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.resultsList)
        .map((result) => result?.user)
        .filter((user): user is User.AsObject => Boolean(user)) || [],
    [data], // Only recompute if `data` changes
  );

  const meetsSearchCriteria = meetsApiSearchCriteria({
    hasActiveFilters: mapSearchState.hasActiveFilters,
    hasSearchInputValue: mapSearchState.hasSearchInputValue,
    zoom,
  });

  const flyToLocation = useCallback(
    ({ longitude, latitude, zoom }: FlyToLocationProps) => {
      mapFlyToLocation({
        longitude,
        latitude,
        zoom,
        mapRef,
      });
    },
    [],
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

  const handleLoadNextPage = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SearchPageContainer>
      <MapProvider>
        <QueryClientProvider client={queryClient}>
          <HtmlMeta title={t("global:nav.map_search")} />
          {isMobile && (
            <MobileMapView
              hasActiveFilters={mapSearchState.hasActiveFilters}
              isLoading={isLoading || isFetching}
              locationName={locationName}
              meetsSearchCriteria={meetsSearchCriteria}
              onClearSearchInputValue={handleClearSearchInputValue}
              onOpenFilters={handleOpenFiltersDialog}
              onSetSearch={handleSetSearch}
              onSetSearchType={handleSetSearchType}
              searchType={searchType}
              users={formattedUsers}
            />
          )}

          {!isMobile && (
            <DesktopMapView
              hasActiveFilters={mapSearchState.hasActiveFilters}
              hasNextPage={hasNextPage}
              hasSearchInputValue={mapSearchState.hasSearchInputValue}
              initialLocation={{ bbox, locationName }}
              isLoading={isLoading || isFetching}
              meetsSearchCriteria={meetsSearchCriteria}
              mapRef={mapRef}
              onClearFilters={handleClearFilters}
              onClearSearchInputValue={handleClearSearchInputValue}
              onLoadNextPage={handleLoadNextPage}
              onOpenFilters={handleOpenFiltersDialog}
              onSetSearch={handleSetSearch}
              onSetSearchType={handleSetSearchType}
              onSelectedUserIdClick={handleSelectedUserIdClick}
              searchType={searchType}
              selectedUserIds={mapSearchState.selectedUserIds}
              totalItems={totalItems}
              users={formattedUsers}
            />
          )}
        </QueryClientProvider>
      </MapProvider>
      <FilterDialog
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseFiltersDialog}
        onSetFilters={handleSetFilters}
      />
    </SearchPageContainer>
  );
}
