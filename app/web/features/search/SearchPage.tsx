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
import { useTranslation } from "i18n";
import MapWrapper from "./MapWrapper";
import SearchBox from "./SearchBox";
import { User } from "proto/api_pb";
import { service } from "service";
import { Point } from "geojson";

/**
 * Context which will be queried by the childs components
 */
export const mapContext = createContext({} as any);

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
 * Here will contain the context and all the business logic of the search map page, then all the components will use this context,
 * also the functions which call the API will be defined here, among other things, at the end will render the newSearchPage component
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

  // Context
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
  const [numberOfGuestsFilter, setNumberOfGuestFilter] = useState(undefined);
  const [completeProfileFilter, setCompleteProfileFilter] = useState(true);
  const [selectedResult, setSelectedResult] = useState<
    Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
  >(undefined);

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
        numberOfGuestsFilter,
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
            numGuests: numberOfGuestsFilter,
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
    <mapContext.Provider
      value={{
        searchType,
        setSearchType,
        completeProfileFilter,
        setCompleteProfileFilter,
        locationResult,
        selectedResult,
        setSelectedResult,
        setLocationResult,
        queryName,
        setQueryName,
        lastActiveFilter,
        setLastActiveFilter,
        hostingStatusFilter,
        setHostingStatusFilter,
        numberOfGuestsFilter,
        setNumberOfGuestFilter,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <HtmlMeta title={t("global:nav.map_search")} />
        <div className={classes.container}>
          {/* Desktop */}
          <Hidden smDown>
            <SearchResultsList
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
                results={data}
                error={errorMessage}
                hasNext={hasNextPage}
                fetchNextPage={fetchNextPage}
                selectedResult={selectedResult}
                setSelectedResult={setSelectedResult}
                isLoading={isLoading || isLoadingUser || isFetching}
              />
            </Collapse>
            <SearchBox
              searchType={searchType}
              setSearchType={setSearchType}
              locationResult={locationResult}
              setLocationResult={setLocationResult}
              setQueryName={setQueryName}
              queryName={queryName}
             />
          </Hidden>
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
    </mapContext.Provider>
  );
}
