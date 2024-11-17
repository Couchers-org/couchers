import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { HostingStatus, User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "react-query";
import { service } from "service";
import { GeocodeResult } from "utils/hooks";

import FilterDialog from "./FilterDialog";
import MapWrapper from "./MapWrapper";
import SearchResultsList from "./SearchResultsList";

export type TypeHostingStatusOptions = Exclude<
  HostingStatus,
  | HostingStatus.HOSTING_STATUS_UNKNOWN
  | HostingStatus.HOSTING_STATUS_UNSPECIFIED
>[];

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    alignContent: "stretch",
    flexDirection: "column-reverse",
    position: "fixed",
    top: theme.shape.navPaddingXs,
    left: 0,
    right: 0,
    bottom: 0,
    [theme.breakpoints.up("sm")]: {
      top: theme.shape.navPaddingSmUp,
    },
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
    },
  },
  mapContainer: {
    flexGrow: 1,
    position: "relative",
  },
  mobileCollapse: {
    flexShrink: 0,
    overflowY: "hidden",
  },
  searchMobile: {
    position: "absolute",
    top: theme.spacing(1.5),
    left: "auto",
    right: 52,
    display: "flex",
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  },
}));

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
  const classes = useStyles();
  const theme = useTheme();
  const map = useRef<MaplibreMap>();

  // State
  const [wasSearchPerformed, setWasSearchPerformed] = useState(false);
  const [locationResult, setLocationResult] = useState<GeocodeResult>({
    bbox: bbox,
    isRegion: false,
    location: new LngLat(0, 0),
    name: locationName,
    simplifiedName: locationName,
  });
  const [queryName, setQueryName] = useState<string>("");
  const [searchType, setSearchType] = useState<"location" | "keyword">(
    "location"
  );
  const [lastActiveFilter, setLastActiveFilter] = useState(0);
  const [hostingStatusFilter, setHostingStatusFilter] =
    useState<TypeHostingStatusOptions>([]);
  const [numberOfGuestFilter, setNumberOfGuestFilter] = useState<
    number | undefined
  >(undefined);
  const [completeProfileFilter, setCompleteProfileFilter] = useState(false);
  const [selectedResult, setSelectedResult] = useState<
    Pick<User.AsObject, "userId" | "lng" | "lat"> | undefined
  >();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Loads the list of users
  const { data, error, isLoading, isFetching, hasNextPage } = useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    [
      "userSearch",
      queryName,
      locationResult?.name,
      locationResult?.bbox,
      lastActiveFilter,
      hostingStatusFilter,
      numberOfGuestFilter,
      completeProfileFilter,
    ],
    ({ pageParam }) => {
      return service.search.userSearch(
        {
          query: queryName,
          bbox: locationResult.bbox,
          lastActive: lastActiveFilter === 0 ? undefined : lastActiveFilter,
          hostingStatusOptions:
            hostingStatusFilter.length === 0 ? undefined : hostingStatusFilter,
          numGuests: numberOfGuestFilter,
          completeProfile:
            completeProfileFilter === false ? undefined : completeProfileFilter,
        },
        pageParam
      );
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

  // Relocate map everytime boundingbox changes
  useEffect(() => {
    map.current?.fitBounds(locationResult.bbox);
  }, [locationResult?.bbox]);

  /**
   * Tracks whether a search was perform after the first render (always show all the users of the platform on the first render)
   */
  useEffect(() => {
    if (!wasSearchPerformed) {
      if (
        lastActiveFilter !== 0 ||
        hostingStatusFilter.length !== 0 ||
        numberOfGuestFilter !== undefined ||
        completeProfileFilter !== false
      ) {
        setWasSearchPerformed(true);
      }
    }
  }, [
    lastActiveFilter,
    hostingStatusFilter,
    numberOfGuestFilter,
    completeProfileFilter,
    wasSearchPerformed,
  ]);

  const errorMessage = error?.message;

  return (
    <QueryClientProvider client={queryClient}>
      <HtmlMeta title={t("global:nav.map_search")} />
      <div className={classes.container}>
        {/* Desktop */}
        <Hidden smDown>
          <SearchResultsList
            searchType={searchType}
            setSearchType={setSearchType}
            locationResult={locationResult}
            setLocationResult={setLocationResult}
            queryName={queryName}
            setQueryName={setQueryName}
            results={data}
            error={errorMessage}
            hasNext={hasNextPage}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            isLoading={isLoading || isFetching}
          />
        </Hidden>
        {/* Mobile */}
        <Hidden mdUp>
          <Collapse
            in={!!selectedResult}
            timeout={theme.transitions.duration.standard}
            className={classes.mobileCollapse}
          >
            <SearchResultsList
              searchType={searchType}
              setSearchType={setSearchType}
              locationResult={locationResult}
              setLocationResult={setLocationResult}
              queryName={queryName}
              setQueryName={setQueryName}
              results={data}
              error={errorMessage}
              hasNext={hasNextPage}
              selectedResult={selectedResult}
              setSelectedResult={setSelectedResult}
              isLoading={isLoading || isFetching}
            />
          </Collapse>
        </Hidden>
        <FilterDialog
          isOpen={isFiltersOpen}
          queryName={queryName}
          setQueryName={setQueryName}
          onClose={() => setIsFiltersOpen(false)}
          setLocationResult={setLocationResult}
          lastActiveFilter={lastActiveFilter}
          setLastActiveFilter={setLastActiveFilter}
          hostingStatusFilter={hostingStatusFilter}
          setHostingStatusFilter={setHostingStatusFilter}
          completeProfileFilter={completeProfileFilter}
          setCompleteProfileFilter={setCompleteProfileFilter}
          numberOfGuestFilter={numberOfGuestFilter}
          setNumberOfGuestFilter={setNumberOfGuestFilter}
        />
        <div className={classes.mapContainer}>
          <MapWrapper
            map={map}
            results={data}
            selectedResult={selectedResult}
            locationResult={locationResult}
            setIsFiltersOpen={setIsFiltersOpen}
            setLocationResult={setLocationResult}
            setSelectedResult={setSelectedResult}
            isLoading={isLoading || isFetching}
            setWasSearchPerformed={setWasSearchPerformed}
            wasSearchPerformed={wasSearchPerformed}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
