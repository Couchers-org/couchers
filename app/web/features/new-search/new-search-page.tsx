import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import { addClusteredUsersToMap, layers, filterData } from "../search/users";
import { QueryClient, QueryClientProvider } from "react-query";
import { selectedUserZoom } from "features/search/constants";
import { filterUsers } from "features/search/users";
import { searchQueryKey } from "features/queryKeys";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { UserSearchRes } from "proto/search_pb";
import { useInfiniteQuery } from "react-query";
import NewSearchList from "./new-search-list";
import NewMapWrapper from "./new-map-wrapper";
import NewSearchBox from "./new-search-box";
import HtmlMeta from "components/HtmlMeta";
import { usePrevious } from "utils/hooks";
import { useTranslation } from "i18n";
import { createContext } from "react";
import { User } from "proto/api_pb";
import { Point } from "geojson";
import { service } from "service";

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
 * Here will contain the context and all the business logic of the search map page, then all the components will use the context from this controller
 * also the functions which call the API will be defined here, among other things, at the end will render the newSearchPage component 
 */
export default function NewSearchPage() {

  const theme = useTheme();
  const classes = useStyles();
  const map = useRef<MaplibreMap>();
  const { t } = useTranslation([GLOBAL, SEARCH]);

  // query
  const queryClient = new QueryClient()

  // Context
  // TODO: get this values from the API endpoint
  const [locationResult, setLocationResult] = useState<any>({
    bbox: [-3.5179163, 40.6437293, -3.8889539, 40.3119774],
    isRegion: false,
    location: { lng: -3.7035825, lat: 40.4167047 },
    name: "",
    simplifiedName: ""
  });
  const [queryName, setQueryName] = useState(undefined);
  const [searchType, setSearchType] = useState('location');
  const [extraTags, setExtraTags] = useState("");
  const [lastActiveFilter, setLastActiveFilter] = useState(0);
  const [hostingStatusFilter, setHostingStatusFilter] = useState([0]);
  const [numberOfGuestsFilter, setNumberOfGuestFilter] = useState(undefined);
  const [selectedResult, setSelectedResult] = useState<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>(undefined);

  const handleMapUserClick = useCallback(
    (
      ev: maplibregl.MapMouseEvent & {
        features?: maplibregl.MapboxGeoJSONFeature[] | undefined;
      } & EventData
    ) => {
      ev.preventDefault();

      const props = ev.features?.[0].properties;
      const geom = ev.features?.[0].geometry as Point;

      if (!props || !geom) return;

      const username = props.username;
      const userId = props.id;

      const [lng, lat] = geom.coordinates;
      setSelectedResult({ username, userId, lng, lat });
    },
    []
  );

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery<UserSearchRes.AsObject, Error>(
    [
      'userSearch',
      queryName,
      locationResult?.bbox,
    ],
    ({ pageParam }) => {
      return service.search.userSearch(
        {
          query: queryName,
          lat: locationResult?.location?.lat,
          lng: locationResult?.location?.lng,
          radius: 50000, // TODO: bbox here
          lastActive: lastActiveFilter === 0 ? undefined : lastActiveFilter,
          hostingStatusOptions: hostingStatusFilter[0] === 0 ? undefined : hostingStatusFilter,
          numGuests: numberOfGuestsFilter,
        },
        pageParam
      );
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  );

  useEffect(() => {
    map.current?.fitBounds(locationResult.bbox, {
      maxZoom: selectedUserZoom,
    });
  }, [locationResult.bbox]);

  useEffect(() => {
    if (map.current) {
      map.current?.stop();

      if (data) {
        const resultUsers = filterData(data);

        if (map.current?.loaded()) {
          filterUsers(
            map.current,
            resultUsers,
            handleMapUserClick
          );
        }
      }
    }
  }, [data])

  // const [selectedResult, setSelectedResult] = useState<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>(undefined);

  const previousResult = usePrevious(selectedResult);

  const [areClustersLoaded, setAreClustersLoaded] = useState(false);

  const showResults = useRef(false);
  // const searchFilters = useRouteWithSearchFilters(searchRoute);

  /*
  useEffect(() => {
    if (showResults.current !== searchFilters.any) {
      showResults.current = searchFilters.any;
      setTimeout(() => {
        map.current?.resize();
      }, theme.transitions.duration.standard);
    }
  }, [searchFilters.any, selectedResult, theme.transitions.duration.standard]);
  */

  const flyToUser = () => { alert("pending to implement :)") };

  return (
    <mapContext.Provider value={{ searchType, setSearchType, locationResult, setLocationResult, queryName, setQueryName, setExtraTags, lastActiveFilter, setLastActiveFilter, hostingStatusFilter, setHostingStatusFilter, numberOfGuestsFilter, setNumberOfGuestFilter }}>
      <QueryClientProvider client={queryClient}>
        <HtmlMeta title={t("global:nav.map_search")} />
        <div className={classes.container}>
          {/* Desktop */}
          <Hidden smDown>
            <NewSearchList isLoading={isLoading} results={data as any} />
          </Hidden>
          {/* Mobile */}
          <Hidden mdUp>
            <Collapse
              in={true}
              timeout={theme.transitions.duration.standard}
              className={classes.mobileCollapse}
            >
              <NewSearchList isLoading={isLoading} results={data as any} />
            </Collapse>
            <NewSearchBox />
          </Hidden>
          <div className={classes.mapContainer}>
            <NewMapWrapper map={map} setSelectedResult={setSelectedResult} selectedResult={selectedResult} handleMapUserClick={handleMapUserClick} />
          </div>
        </div>
      </QueryClientProvider>
    </mapContext.Provider>
  );
}
