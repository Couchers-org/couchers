import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import Map from "components/Map";
import SearchBox from "features/search/SearchBox";
import useSearchFilters from "features/search/useSearchFilters";
import { Point } from "geojson";
import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "proto/api_pb";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchRoute } from "routes";
import { usePrevious } from "utils/hooks";

import { MAP_SEARCH } from "../../constants";
import SearchResultsList from "./SearchResultsList";
import { addClusteredUsersToMap, layers } from "./users";

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
    left: theme.spacing(1.5),
    right: 52,
    display: "flex",
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  },
}));

export default function SearchPage() {
  const classes = useStyles();
  const theme = useTheme();

  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] = useState<
    Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
  >(undefined);

  const previousResult = usePrevious(selectedResult);

  const [areClustersLoaded, setAreClustersLoaded] = useState(false);

  const showResults = useRef(false);

  const searchFilters = useSearchFilters(searchRoute);

  useEffect(() => {
    if (showResults.current !== searchFilters.any) {
      showResults.current = searchFilters.any;
      setTimeout(
        () => map.current?.resize(),
        theme.transitions.duration.standard
      );
    }
  }, [searchFilters.any, selectedResult, theme.transitions.duration.standard]);

  const flyToUser = useCallback((user: Pick<User.AsObject, "lng" | "lat">) => {
    map.current?.stop();
    map.current?.easeTo({
      center: [user.lng, user.lat],
    });
  }, []);

  useEffect(() => {
    if (previousResult) {
      //unset the old feature selection on the map for styling
      areClustersLoaded &&
        map.current?.setFeatureState(
          { source: "clustered-users", id: previousResult.userId },
          { selected: false }
        );
    }

    if (selectedResult) {
      //update the map
      flyToUser(selectedResult);
      areClustersLoaded &&
        map.current?.setFeatureState(
          { source: "clustered-users", id: selectedResult.userId },
          { selected: true }
        );

      //update result list
      document
        .getElementById(`search-result-${selectedResult.userId}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedResult, areClustersLoaded, previousResult, flyToUser]);

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

  //detect when map data has been initially loaded
  const handleMapSourceData = useCallback(() => {
    if (
      map.current &&
      map.current.getSource("clustered-users") &&
      map.current.isSourceLoaded("clustered-users")
    ) {
      setAreClustersLoaded(true);

      // unbind the event
      map.current.off("sourcedata", handleMapSourceData);
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const handleMapClickAway = (e: EventData) => {
      //defaultPrevented is true when a map feature has been clicked
      if (!e.defaultPrevented) {
        setSelectedResult(undefined);
      }
    };

    //bind event handlers for map events (order matters!)
    map.current.on(
      "click",
      layers.unclusteredPointLayer.id,
      handleMapUserClick
    );
    map.current.on("click", handleMapClickAway);

    map.current.on("sourcedata", handleMapSourceData);

    return () => {
      if (!map.current) return;

      //unbind event handlers for map events
      map.current.off("sourcedata", handleMapSourceData);
      map.current.off("click", handleMapClickAway);
      map.current.off(
        "click",
        layers.unclusteredPointLayer.id,
        handleMapUserClick
      );
    };
  }, [handleMapUserClick, handleMapSourceData]);

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      addClusteredUsersToMap(newMap);
    });
  };

  return (
    <>
      <HtmlMeta title={MAP_SEARCH} />
      <div className={classes.container}>
        <Hidden smDown>
          <SearchResultsList
            handleResultClick={setSelectedResult}
            handleMapUserClick={handleMapUserClick}
            map={map}
            selectedResult={selectedResult?.userId}
            searchFilters={searchFilters}
          />
        </Hidden>
        <Hidden mdUp>
          <Collapse
            in={searchFilters.any || !!selectedResult}
            timeout={theme.transitions.duration.standard}
            className={classes.mobileCollapse}
          >
            <SearchResultsList
              handleResultClick={setSelectedResult}
              handleMapUserClick={handleMapUserClick}
              map={map}
              selectedResult={selectedResult?.userId}
              searchFilters={searchFilters}
            />
          </Collapse>
        </Hidden>
        <div className={classes.mapContainer}>
          <Map
            grow
            initialCenter={new LngLat(0, 0)}
            initialZoom={1}
            postMapInitialize={initializeMap}
            hash
          />
          <Hidden mdUp>
            <SearchBox
              className={classes.searchMobile}
              searchFilters={searchFilters}
            />
          </Hidden>
        </div>
      </div>
    </>
  );
}
