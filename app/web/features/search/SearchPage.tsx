import { useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/utils/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useReducer } from "react";
import { MapProvider } from "react-map-gl/maplibre";
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

  const [filters, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    bbox,
    query: locationName,
  });

  const { data, isLoading, isFetching } = useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    ["userSearch", filters],
    ({ pageParam }) => {
      return service.search.userSearch(filters, pageParam);
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
  };

  const handleClearFilters = () => {
    dispatch({ type: mapSearchActionTypes.RESET_FILTERS });
  };

  return (
    <MapProvider>
      <QueryClientProvider client={queryClient}>
        <HtmlMeta title={t("global:nav.map_search")} />
        {isMobile && <MobileMapView />}

        {!isMobile && (
          <DesktopMapView
            bbox={filters.bbox}
            isLoading={isLoading || isFetching}
            onClearFilters={handleClearFilters}
            onFilterChange={handleFiltersChange}
            query={filters.query}
            selectedUserId={filters.selectedUserId}
            users={formattedResults}
            wasSearchPerformed={filters.wasSearchPerformed}
          />
        )}
      </QueryClientProvider>
    </MapProvider>
  );
}

export type { FilterKey, FilterValue };
