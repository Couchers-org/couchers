import { useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { Result, UserSearchRes } from "proto/search_pb";
import { useReducer, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "react-query";
import { service } from "service";
import { theme } from "theme";

import DesktopMapView from "./DesktopMapView";
import {
  initialState,
  mapSearchActionTypes,
  mapSearchReducer,
} from "./mapSearchReducers";
import MobileMapView from "./MobileMapView";
import { GeocodeResult } from "utils/hooks";
import { User } from "proto/api_pb";

type FilterKey = "location" | "query";
type FilterValue = string | GeocodeResult | null;

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

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, dispatch] = useReducer(mapSearchReducer, {
    ...initialState,
    bbox,
    query: locationName,
  });

  const { data, error, isLoading, isFetching, hasNextPage } = useInfiniteQuery<
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

  console.log("formattedResults", formattedResults);

  const handleFiltersChange = (key: FilterKey, newValue: FilterValue): void => {
    dispatch({
      type: mapSearchActionTypes.SET_FILTER,
      payload: {
        key,
        value: newValue,
      },
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HtmlMeta title={t("global:nav.map_search")} />
      {isMobile ? (
        <MobileMapView />
      ) : (
        <DesktopMapView
          onFilterChange={handleFiltersChange}
          query={filters.query}
          users={formattedResults}
        />
      )}
    </QueryClientProvider>
  );
}

export type { FilterKey, FilterValue };
