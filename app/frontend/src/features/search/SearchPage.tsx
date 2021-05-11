import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import Map from "components/Map";
import SearchBox from "features/search/SearchBox";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import React, { useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
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
    marginTop: theme.shape.navPaddingMobile,
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
      marginTop: theme.shape.navPaddingDesktop,
    },
  },
  mapContainer: {
    flexGrow: 1,
    position: "relative",
  },
  mapResults: {
    height: "14rem",
    overflow: "hidden",
    [theme.breakpoints.up("md")]: {
      height: "auto",
      width: "35%",
      overflow: "auto",
    },
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
  useEffect(() => {
    setTimeout(
      () => map.current?.resize(),
      theme.transitions.duration.standard
    );
  }, [query, theme.transitions.duration.standard]);

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

  const flyToUser = (user: Pick<User.AsObject, "lng" | "lat">) => {
    map.current?.stop();
    map.current?.flyTo({
      center: [user.lng, user.lat],
      zoom: selectedUserZoom,
    });
  };

  const handleMapUserClick = (ev: any) => {
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
  };
  const handleResultClick = (
    user: Pick<User.AsObject, "username" | "userId" | "lng" | "lat">
  ) => {
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
    history.push(
      routeToUser({
        username: user.username,
      })
    );
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
          <Collapse in={!!query} timeout={theme.transitions.duration.standard}>
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
