import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import { Coordinates } from "features/search/constants";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { GeocodeResult } from "utils/hooks";

import FilterDialog from "./FilterDialog";
import MapWrapper from "./MapWrapper";
import SearchResultsList from "./SearchResultsList";
import { useMapSearch } from "./hooks";

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
  const [hostingStatusFilter, setHostingStatusFilter] = useState(0);
  const [numberOfGuestFilter, setNumberOfGuestFilter] = useState(0);
  const [completeProfileFilter, setCompleteProfileFilter] = useState(false);
  const [selectedResult, setSelectedResult] = useState<
    Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
  >();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Loads the list of users
  const { data, error, isLoading, isFetching, hasNextPage } = useMapSearch({queryName, locationResult, lastActiveFilter, hostingStatusFilter, numberOfGuestFilter, completeProfileFilter })  

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
        hostingStatusFilter !== 0 ||
        numberOfGuestFilter !== 0 ||
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
            locationResult={locationResult}
            queryName={queryName}
            results={data}
            error={errorMessage}
            hasNext={hasNextPage}
            selectedResult={selectedResult}
            isLoading={isLoading || isFetching}
            setSearchType={setSearchType}
            setLocationResult={setLocationResult}
            setQueryName={setQueryName}
            setSelectedResult={(selectedResultParam) => setSelectedResult(selectedResultParam)}
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
              locationResult={locationResult}
              queryName={queryName}
              results={data}
              error={errorMessage}
              hasNext={hasNextPage}
              selectedResult={selectedResult}
              isLoading={isLoading || isFetching}
              setSearchType={setSearchType}
              setLocationResult={setLocationResult}
              setQueryName={setQueryName}
              setSelectedResult={(selectedResultParam) => setSelectedResult(selectedResultParam)}
            />
          </Collapse>
        </Hidden>
        <FilterDialog
          isOpen={isFiltersOpen}
          queryName={queryName}
          lastActiveFilter={lastActiveFilter}
          hostingStatusFilter={hostingStatusFilter}
          completeProfileFilter={completeProfileFilter}
          numberOfGuestFilter={numberOfGuestFilter}
          setQueryName={(queryNameParam) => setQueryName(queryNameParam)}
          onClose={() => setIsFiltersOpen(false)}
          setLocationResult={(locationResultParam) => setLocationResult(locationResultParam)}
          setLastActiveFilter={(lastActiveParam) => setLastActiveFilter(lastActiveParam)}
          setHostingStatusFilter={(hostingStatusParam) => setHostingStatusFilter(hostingStatusParam)}
          setCompleteProfileFilter={(completeProfilesParam) => setCompleteProfileFilter(completeProfilesParam)}
          setNumberOfGuestFilter={(numberOfGuestsParam) => setNumberOfGuestFilter(numberOfGuestsParam)}
        />
        <div className={classes.mapContainer}>
          <MapWrapper
            map={map}
            results={data}
            selectedResult={selectedResult}
            locationResult={locationResult}
            isLoading={isLoading || isFetching}
            wasSearchPerformed={wasSearchPerformed}
            setIsFiltersOpen={() => setIsFiltersOpen(true)}
            setLocationResult={(locationResultParam) => setLocationResult(locationResultParam)}
            setSelectedResult={(selectedResultParam) => setSelectedResult(selectedResultParam)}
            setWasSearchPerformed={() => setWasSearchPerformed(true)}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
