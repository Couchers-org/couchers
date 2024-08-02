import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "react-query";
import { useCallback, useEffect, useRef, useState, createContext } from "react";
import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import maplibregl, { EventData, Map as MaplibreMap } from "maplibre-gl";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { selectedUserZoom } from "features/search/constants";
import SearchResultsList from "./SearchResultsList";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { UserSearchRes } from "proto/search_pb";
import HtmlMeta from "components/HtmlMeta";
import FilterDialog from "./FilterDialog";
import Button from "components/Button";
import { useTranslation } from "i18n";
import MapWrapper from "./MapWrapper";
import SearchBox from "./SearchBox";
import { User } from "proto/api_pb";
import { service } from "service";
import { Point } from "geojson";

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
 * Search page, queries the backend & obtains all the users to be shown on the map, creates all the state variables and sends them to the search page sub-components
 */
export default function SearchPage({
  locationName,
  bbox,
}: {
  locationName: string;
  bbox: [number, number, number, number];
}) {
  const {
    data: userData,
    error: errorUser,
    isLoading: isLoadingUser,
  } = useCurrentUser();
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const queryClient = new QueryClient();
  const classes = useStyles();
  const theme = useTheme();
  const map = useRef<MaplibreMap>();

  // State
  const [locationResult, setLocationResult] = useState({
    bbox: bbox,
    isRegion: false,
    location: { lng: undefined, lat: undefined },
    name: locationName,
    simplifiedName: locationName,
  });
  const [queryName, setQueryName] = useState(undefined);
  const [searchType, setSearchType] = useState("location");
  const [lastActiveFilter, setLastActiveFilter] = useState(0);
  const [hostingStatusFilter, setHostingStatusFilter] = useState(0);
  const [numberOfGuestFilter, setNumberOfGuestFilter] = useState(undefined);
  const [completeProfileFilter, setCompleteProfileFilter] = useState(true);
  const [selectedResult, setSelectedResult] = useState<
    Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
  >(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // TODO: Inject by props

  const SearchBoxComponent = (
    <SearchBox
      setIsFiltersOpen={setIsFiltersOpen}
      searchType={searchType}
      setSearchType={setSearchType}
      locationResult={locationResult}
      setLocationResult={setLocationResult}
      setQueryName={setQueryName}
      queryName={queryName}
    />
  );

  // Loads the list of users
  const { data, error, isLoading, fetchNextPage, isFetching, hasNextPage } =
    useInfiniteQuery<UserSearchRes.AsObject, Error>(
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
        const lastActiveComparation = parseInt(
          lastActiveFilter as unknown as string
        );
        const hostingStatusFilterComparation = parseInt(
          hostingStatusFilter as unknown as string
        );

        return service.search.userSearch(
          {
            query: queryName,
            bbox: locationResult.bbox,
            lastActive:
              lastActiveComparation === 0 ? undefined : lastActiveFilter,
            hostingStatusOptions:
              hostingStatusFilterComparation === 0
                ? undefined
                : [hostingStatusFilter],
            numGuests: numberOfGuestFilter,
            completeProfile:
              completeProfileFilter === false
                ? undefined
                : completeProfileFilter,
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
    map.current?.fitBounds(locationResult.bbox, {
      maxZoom: selectedUserZoom,
    });
  }, [locationResult.bbox]);

  // Initial bounding box
  useEffect(() => {
    if (isLoadingUser === false && userData && bbox.join() === "0,0,0,0") {
      map.current?.fitBounds(
        [userData.lng, userData.lat, userData.lng, userData.lat],
        {
          maxZoom: 4,
        }
      );

      map.current?.fitBounds(map.current?.getBounds());
    }
  }, [isLoadingUser]);

  let errorMessage = error?.message || undefined;
  if (errorUser) {
    errorMessage = `${errorMessage || ""} ${errorUser}`;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HtmlMeta title={t("global:nav.map_search")} />
      <div className={classes.container}>
        {/* Desktop */}
        <Hidden smDown>
          <SearchResultsList
            setIsFiltersOpen={setIsFiltersOpen}
            searchType={searchType}
            setSearchType={setSearchType}
            locationResult={locationResult}
            setLocationResult={setLocationResult}
            queryName={queryName}
            setQueryName={setQueryName}
            results={data}
            error={errorMessage}
            hasNext={hasNextPage}
            fetchNextPage={fetchNextPage}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            isLoading={isLoading || isLoadingUser || isFetching}
          />
        </Hidden>
        {/* Mobile */}
        <Hidden mdUp>
          <Collapse
            in={true}
            timeout={theme.transitions.duration.standard}
            className={classes.mobileCollapse}
          >
            <SearchResultsList
              setIsFiltersOpen={setIsFiltersOpen}
              searchType={searchType}
              setSearchType={setSearchType}
              locationResult={locationResult}
              setLocationResult={setLocationResult}
              queryName={queryName}
              setQueryName={setQueryName}
              results={data}
              error={errorMessage}
              hasNext={hasNextPage}
              fetchNextPage={fetchNextPage}
              selectedResult={selectedResult}
              setSelectedResult={setSelectedResult}
              isLoading={isLoading || isLoadingUser || isFetching}
            />
          </Collapse>
          <Button
            onClick={() => setIsFiltersOpen(true)}
            className={""} // TODO: initially was by props
            variant="contained"
            size="medium"
          >
            {t("search:filter_dialog.mobile_title")}
          </Button>
        </Hidden>
        <FilterDialog
          isOpen={isFiltersOpen}
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
            setLocationResult={setLocationResult}
            setSelectedResult={setSelectedResult}
            isLoading={isLoading || isLoadingUser || isFetching}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
