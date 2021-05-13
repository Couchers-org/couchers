import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import Map from "components/Map";
import SearchBox from "features/search/SearchBox";
import { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser } from "routes";

import { selectedUserZoom } from "./constants";
import SearchResultsList from "./SearchResultsList";
import { addUsersToMap, layers } from "./users";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    alignContent: "stretch",
    flexDirection: "column-reverse",
    height: "100%",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
    },
  },
  mapContainer: {
    flexGrow: 1,
    height: "100%",
    position: "relative",
  },
  searchMobile: {
    margin: theme.spacing(0, 2),
    position: "absolute",
    top: theme.spacing(1),
    left: theme.spacing(1),
    right: 36,
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: theme.shape.borderRadius,
  },
}));

export default function SearchPage() {
  const classes = useStyles();
  const theme = useTheme();

  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] = useState<number | undefined>(
    undefined
  );

  const { query } = useParams<{ query?: string }>();

  const showResults = useRef(false);
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

  const history = useHistory();
  /*const location = useLocation();

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
    map.current?.flyTo({
      center: [user.lng, user.lat],
      zoom: selectedUserZoom,
    });
  }, []);

  const handleResultClick = useCallback(
    (user?: Pick<User.AsObject, "username" | "userId" | "lng" | "lat">) => {
      //if undefined, unset
      if (!user) {
        if (selectedResult) {
          //unset the old feature selection on the map for styling
          map.current?.setFeatureState(
            { source: "all-objects", id: selectedResult },
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
            { source: "all-objects", id: selectedResult },
            { selected: false }
          );
        }
        //set the new selection
        map.current?.setFeatureState(
          { source: "all-objects", id: user.userId },
          { selected: true }
        );
        setSelectedResult(user.userId);
        flyToUser(user);
        document
          .getElementById(`search-result-${user.userId}`)
          ?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      //if it hasn't changed, the user has been selected again, so go to profile
      history.push(routeToUser(user.username));
    },
    [selectedResult, flyToUser, history]
  );

  useEffect(() => {
    const handleMapUserClick = (ev: any) => {
      ev.preventDefault();
      const username = ev.features[0].properties.username;
      const userId = ev.features[0].properties.id;
      const [lng, lat] = ev.features[0].geometry.coordinates;
      handleResultClick({ username, userId, lng, lat });
    };

    const handleMapClickAway = (e: EventData) => {
      if (!e.defaultPrevented) {
        handleResultClick(undefined);
      }
    };

    map.current!.on("click", handleMapClickAway);
    map.current!.on("click", layers.users.id, handleMapUserClick);

    return () => {
      map.current!.off("click", handleMapClickAway);
      map.current!.off("click", layers.users.id, handleMapUserClick);
    };
  }, [selectedResult, handleResultClick]);

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      if (process.env.REACT_APP_IS_COMMUNITIES_ENABLED === "true") {
        //addCommunitiesToMap(newMap);
        //addPlacesToMap(newMap);
        //addGuidesToMap(newMap);
      }
      addUsersToMap(newMap);
    });
  };

  return (
    <>
      <div className={classes.container}>
        <Hidden smDown>
          <SearchResultsList
            handleResultClick={handleResultClick}
            map={map}
            selectedResult={selectedResult}
          />
        </Hidden>
        <Hidden mdUp>
          <Collapse
            in={!!query || !!selectedResult}
            timeout={theme.transitions.duration.standard}
          >
            <SearchResultsList
              handleResultClick={handleResultClick}
              map={map}
              selectedResult={selectedResult}
            />
          </Collapse>
        </Hidden>
        <div className={classes.mapContainer}>
          <Map
            grow
            initialCenter={new LngLat(0, 0)}
            initialZoom={1}
            postMapInitialize={initializeMap}
          />
          <Hidden mdUp>
            <SearchBox className={classes.searchMobile} />
          </Hidden>
        </div>
      </div>
    </>
  );
}
