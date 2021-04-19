import { makeStyles, Paper } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import Map from "components/Map";
import TextBody from "components/TextBody";
import { addUsersToMap } from "features/map/users";
import { SearchQuery } from "features/search/constants";
import SearchResult from "features/search/SearchResult";
import { Point } from "geojson";
import { Error } from "grpc-web";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import { UserSearchRes } from "pb/search_pb";
import { searchQueryKey } from "queryKeys";
import React, { useRef, useState } from "react";
import { useInfiniteQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser } from "routes";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

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
    },
  },
  scroller: {
    "&&": { alignItems: "flex-start" },
  },
  searchResult: {
    [theme.breakpoints.down("sm")]: {
      maxWidth: "80%",
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
        const resultIds = results.pages
          .flatMap((page) => page.resultsList)
          .map((result) => {
            return result.user?.userId;
          })
          //only return defined users
          .filter((userId): userId is number => !!userId);

        const setFilter = () => {
          map.current?.setFilter(
            "users",
            resultIds.length > 0
              ? ["in", ["get", "id"], ["literal", resultIds]]
              : null
          );
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

  const flyToId = (userId: number) => {
    const features = map.current?.querySourceFeatures("all-objects", {
      filter: ["==", ["get", "id"], userId],
    });
    if (!features || features.length < 1) return;
    const coords = (features[0].geometry as Point).coordinates as [
      number,
      number
    ];
    map.current?.flyTo({ center: coords, zoom: 13 });
  };

  const handleMapUserClick = (ev: any) => {
    const username = ev.features[0].properties.username;
    const id = ev.features[0].properties.id;
    handleResultClick({ username, userId: id });
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
    user: Pick<User.AsObject, "username" | "userId">
  ) => {
    if (selectedResult !== user.userId) {
      setSelectedResult(user.userId);
      flyToId(user.userId);
      document.getElementById(`search-result-${user.userId}`)?.scrollIntoView();
      return;
    }
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
