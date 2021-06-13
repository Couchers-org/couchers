import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import Map from "components/Map";
import SearchBox from "features/search/SearchBox";
import useSearchFilters from "features/search/useSearchFilters";
import { Point } from "geojson";
import { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "proto/api_pb";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { searchRoute } from "routes";

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
    justifyContent: "center",
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  },
}));

export default function SearchPage() {
  const classes = useStyles();
  const theme = useTheme();

  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] =
    useState<number | undefined>(undefined);

  const showResults = useRef(false);

  const searchFilters = useSearchFilters(searchRoute);
  const query = searchFilters.active.query;

  useEffect(() => {
    const shouldShowResults = !!query || !!selectedResult;
    if (showResults.current !== shouldShowResults) {
      showResults.current = shouldShowResults;
      setTimeout(
        () => map.current?.resize(),
        theme.transitions.duration.standard
      );
    }
  }, [query, selectedResult, theme.transitions.duration.standard]);

  /*

  const handlePlaceClick = (ev: any) => {
    const properties = ev.features[0].properties as {
      id: number;
      slug: string;
    };
    history.push(routeToPlace(properties.id, properties.slug), location.state);
  };

  const handleGuideClick = (ev: any) => {
    const properties = ev.features[0].properties as {
      id: number;
      slug: string;
    };
    history.push(routeToGuide(properties.id, properties.slug), location.state);
  };*/

  const flyToUser = useCallback((user: Pick<User.AsObject, "lng" | "lat">) => {
    map.current?.stop();
    map.current?.easeTo({
      center: [user.lng, user.lat],
    });
  }, []);

  const handleResultClick = useCallback(
    (user?: Pick<User.AsObject, "username" | "userId" | "lng" | "lat">) => {
      //if undefined, unset
      if (!user) {
        if (selectedResult) {
          //unset the old feature selection on the map for styling
          map.current?.setFeatureState(
            { source: "clustered-users", id: selectedResult },
            { selected: false }
          );
          setSelectedResult(undefined);
        }
        return;
      }

      //make a new selection if it has changed
      if (selectedResult !== user.userId) {
        if (selectedResult) {
          //unset the old feature selection on the map for styling
          map.current?.setFeatureState(
            { source: "clustered-users", id: selectedResult },
            { selected: false }
          );
        }
        //set the new selection
        map.current?.setFeatureState(
          { source: "clustered-users", id: user.userId },
          { selected: true }
        );
        setSelectedResult(user.userId);
        flyToUser(user);
        document
          .getElementById(`search-result-${user.userId}`)
          ?.scrollIntoView({ behavior: "smooth" });
        return;
      }
    },
    [selectedResult, flyToUser]
  );

  const handleMapUserClick = useCallback(
    (
      ev: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
      } & EventData
    ) => {
      ev.preventDefault();
      const props = ev.features?.[0].properties;
      const geom = ev.features?.[0].geometry as Point;
      if (!props || !geom) return;
      const username = props.username;
      const userId = props.id;
      const [lng, lat] = geom.coordinates;
      handleResultClick({ username, userId, lng, lat });
    },
    [handleResultClick]
  );

  useEffect(() => {
    if (!map.current) return;
    const handleMapClickAway = (e: EventData) => {
      if (!e.defaultPrevented) {
        handleResultClick(undefined);
      }
    };

    map.current.on("click", handleMapClickAway);
    map.current.on(
      "click",
      layers.unclusteredPointLayer.id,
      handleMapUserClick
    );

    return () => {
      if (!map.current) return;
      map.current.off("click", handleMapClickAway);
      map.current.off(
        "click",
        layers.unclusteredPointLayer.id,
        handleMapUserClick
      );
    };
  }, [selectedResult, handleResultClick, handleMapUserClick]);

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      if (process.env.REACT_APP_IS_COMMUNITIES_ENABLED === "true") {
        //addCommunitiesToMap(newMap);
        //addPlacesToMap(newMap);
        //addGuidesToMap(newMap);
      }
      //addUsersToMap(newMap);
      addClusteredUsersToMap(newMap);
    });
  };

  return (
    <>
      <div className={classes.container}>
        <Hidden smDown>
          <SearchResultsList
            handleResultClick={handleResultClick}
            handleMapUserClick={handleMapUserClick}
            map={map}
            selectedResult={selectedResult}
            searchFilters={searchFilters}
          />
        </Hidden>
        <Hidden mdUp>
          <Collapse
            in={!!query || !!selectedResult}
            timeout={theme.transitions.duration.standard}
            className={classes.mobileCollapse}
          >
            <SearchResultsList
              handleResultClick={handleResultClick}
              handleMapUserClick={handleMapUserClick}
              map={map}
              selectedResult={selectedResult}
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
