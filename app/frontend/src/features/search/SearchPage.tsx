import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import Map from "components/Map";
import SearchBox from "features/search/SearchBox";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import React, { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { routeToUser } from "routes";
import smoothscroll from "smoothscroll-polyfill";

import { selectedUserZoom } from "./constants";
import SearchResultsList from "./SearchResultsList";
import { addUsersToMap } from "./users";

smoothscroll.polyfill();

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    alignContent: "stretch",
    flexDirection: "column-reverse",
    height: `calc(100vh - ${theme.shape.navPaddingMobile})`,
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
    },
  },
  mapContainer: {
    flexGrow: 1,
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

  //callbacks provided to the map need a ref, or they won't get the latest value of selectedResult
  const selectedResultRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    selectedResultRef.current = selectedResult;
  }, [selectedResult]);

  const showResults = useRef(false);

  const location = useLocation();
  const searchParams = Object.fromEntries(new URLSearchParams(location.search));
  const query = searchParams.query;

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

  const flyToUser = (user: Pick<User.AsObject, "lng" | "lat">) => {
    map.current?.stop();
    map.current?.flyTo({
      center: [user.lng, user.lat],
      zoom: selectedUserZoom,
    });
  };

  const handleMapUserClick = (ev: any) => {
    ev.preventDefault();
    const username = ev.features[0].properties.username;
    const id = ev.features[0].properties.id;
    const [lng, lat] = ev.features[0].geometry.coordinates;
    handleResultClick({ username, userId: id, lng, lat });
  };

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      if (process.env.REACT_APP_IS_COMMUNITIES_ENABLED === "true") {
        //addCommunitiesToMap(newMap);
        //addPlacesToMap(newMap, handlePlaceClick);
        //addGuidesToMap(newMap, handleGuideClick);
      }
      addUsersToMap(newMap, handleMapUserClick);
    });
    newMap.on("click", (e) => {
      if (!e.defaultPrevented) {
        handleResultClick(undefined);
      }
    });
  };
  const handleResultClick = (
    user?: Pick<User.AsObject, "username" | "userId" | "lng" | "lat">
  ) => {
    //if undefined, unset
    if (!user) {
      if (selectedResultRef.current) {
        //unset the old feature selection on the map for styling
        map.current?.setFeatureState(
          { source: "all-objects", id: selectedResultRef.current },
          { selected: false }
        );
        setSelectedResult(undefined);
      }
      return;
    }

    //make a new selection if it has changed
    if (selectedResultRef.current !== user.userId) {
      if (selectedResultRef.current) {
        //unset the old feature selection on the map for styling
        map.current?.setFeatureState(
          { source: "all-objects", id: selectedResultRef.current },
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
            hash
          />
          <Hidden mdUp>
            <SearchBox className={classes.searchMobile} />
          </Hidden>
        </div>
      </div>
    </>
  );
}
