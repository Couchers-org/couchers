import { useMediaQuery } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { HostingStatus } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useReducer, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "react-query";
import { service } from "service";
import { theme } from "theme";

import DesktopMapView from "./DesktopMapView";
import { mapSearchReducer } from "./mapSearchReducers";
import MobileMapView from "./MobileMapView";

export type TypeHostingStatusOptions = Exclude<
  HostingStatus,
  | HostingStatus.HOSTING_STATUS_UNKNOWN
  | HostingStatus.HOSTING_STATUS_UNSPECIFIED
>[];

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
    locationName,
    bbox,
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

  return (
    <QueryClientProvider client={queryClient}>
      <HtmlMeta title={t("global:nav.map_search")} />
      {isMobile ? <MobileMapView /> : <DesktopMapView />}
    </QueryClientProvider>
  );
}
