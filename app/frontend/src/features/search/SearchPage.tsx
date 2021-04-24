import { makeStyles, Paper } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import Map from "components/Map";
import TextBody from "components/TextBody";
import { addUsersToMap } from "features/map/users";
import SearchResult from "features/search/SearchResult";
import { Error } from "grpc-web";
import { LngLat, Map as MaplibreMap, LngLatBounds } from "maplibre-gl";
import { User } from "pb/api_pb";
import { UserSearchRes } from "pb/search_pb";
import { searchQueryKey } from "queryKeys";
import React, { useCallback, useRef, useState } from "react";
import { useInfiniteQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser } from "routes";
import { service } from "service";
import smoothscroll from "smoothscroll-polyfill";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SearchQuery, selectedUserZoom } from "./constants";

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
  },
  mapResults: {
    height: "8rem",
    zIndex: 3,
    overflow: "hidden",
    [theme.breakpoints.up("md")]: {
      height: "auto",
      width: "35%",
      overflow: "auto",
    },
  },
  scroller: {
    "&&": { alignItems: "flex-start" },
  },
  searchResult: {
    [theme.breakpoints.down("sm")]: {
      maxWidth: "80%",
    },
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(2),
    },
  },
}));

export default function SearchPage() {
  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] = useState<number | undefined>(
    undefined
  );

  const { query } = useParams<SearchQuery>();

  const {
    data: results,
    error,
    isLoading,
    fetchNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery<UserSearchRes.AsObject, Error>(
    searchQueryKey(query),
    ({ pageParam }) => service.search.userSearch(query, pageParam),
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
      onSuccess(results) {
        map.current?.stop();
        const resultUsers = results.pages
          .flatMap((page) => page.resultsList)
          .map((result) => {
            return result.user;
          })
          //only return defined users
          .filter((user): user is User.AsObject => !!user);

        const setFilter = () => {
          map.current?.setFilter(
            "users",
            resultUsers.length > 0
              ? [
                  "in",
                  ["get", "id"],
                  ["literal", resultUsers.map((user) => user.userId)],
                ]
              : null
          );

          //create a bounds that encompasses only the first user
          const firstResult = resultUsers[0];
          const newBounds = new LngLatBounds([
            [firstResult.lng, firstResult.lat],
            [firstResult.lng, firstResult.lat],
          ]);

          resultUsers.forEach((user) => {
            //skip if the user is already in the bounds
            if (newBounds.contains([user.lng, user.lat])) return;
            //otherwise extend the bounds
            newBounds.setSouthWest([
              Math.min(user.lng, newBounds.getWest()),
              Math.min(user.lat, newBounds.getSouth()),
            ]);
            newBounds.setNorthEast([
              Math.max(user.lng, newBounds.getEast()),
              Math.max(user.lat, newBounds.getNorth()),
            ]);
          });
          map.current?.fitBounds(newBounds);
        };

        if (map.current?.loaded()) {
          setFilter();
        } else {
          map.current?.once("load", setFilter);
        }
      },
    }
  );

  const classes = useStyles();
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
    const coords = ev.features[0].geometry.coordinates;
    handleResultClick({ username, userId: id, lng: coords[0], lat: coords[1] });
  };

  const initializeMap = useCallback((newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      if (process.env.REACT_APP_IS_COMMUNITIES_ENABLED === "true") {
        //addCommunitiesToMap(newMap);
        //addPlacesToMap(newMap, handlePlaceClick);
        //addGuidesToMap(newMap, handleGuideClick);
      }
      addUsersToMap(newMap, handleMapUserClick);
    });
  }, []);

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
    history.push(routeToUser(user.username));
  };

  return (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      <div className={classes.container}>
        <Paper className={classes.mapResults}>
          {isLoading ? (
            <CircularProgress />
          ) : hasAtLeastOnePage(results, "resultsList") ? (
            <HorizontalScroller
              className={classes.scroller}
              isFetching={isFetching}
              fetchNext={fetchNextPage}
              hasMore={hasNextPage}
            >
              {results.pages
                .flatMap((page) => page.resultsList)
                .map((result) =>
                  result.user ? (
                    <SearchResult
                      id={`search-result-${result.user.userId}`}
                      className={classes.searchResult}
                      key={result.user.userId}
                      user={result.user}
                      onClick={handleResultClick}
                      highlight={result.user.userId === selectedResult}
                    />
                  ) : null
                )}
            </HorizontalScroller>
          ) : (
            <TextBody>No users found.</TextBody>
          )}
        </Paper>
        <div className={classes.mapContainer}>
          <Map
            grow
            initialCenter={new LngLat(0, 0)}
            initialZoom={1}
            postMapInitialize={initializeMap}
          />
        </div>
      </div>
    </>
  );
}
