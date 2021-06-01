import { Hidden, makeStyles, Paper } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import { NO_USER_RESULTS, selectedUserZoom } from "features/search/constants";
import SearchBox from "features/search/SearchBox";
import SearchResult from "features/search/SearchResult";
import { useUser } from "features/userQueries/useUsers";
import { Error } from "grpc-web";
import { LngLatBounds, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import { UserSearchRes } from "pb/search_pb";
import { searchQueryKey } from "queryKeys";
import React, { MutableRefObject } from "react";
import { useInfiniteQuery } from "react-query";
import { useLocation } from "react-router-dom";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

const useStyles = makeStyles((theme) => ({
  mapResults: {
    height: "15rem",
    zIndex: 3,
    overflowY: "auto",
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up("md")]: {
      height: "auto",
      width: "30rem",
      padding: theme.spacing(3),
    }
  },
  baseMargin: { margin: theme.spacing(2) },
  searchDesktop: {
    "& > div > *": {
      flexShrink: 0,
      width: "100%",
    },
  },
  scroller: {
    marginTop: theme.spacing(3),
    alignItems: "flex-start",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      marginTop: theme.spacing(1),
    },

  },
  singleResult: {
    maxWidth: "100%",
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(2),
    },
  },
  searchResult: {
    marginBottom: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.primary.contrastText,
    boxShadow: "0 0 4px rgba(0,0,0,0.25)"
  },
}));

interface SearchResultsListProps {
  handleResultClick(user: User.AsObject): void;
  map: MutableRefObject<MaplibreMap | undefined>;
  selectedResult?: number;
}

export default function SearchResultsList({
  handleResultClick,
  map,
  selectedResult,
}: SearchResultsListProps) {
  const classes = useStyles();

  const selectedUser = useUser(selectedResult);

  const location = useLocation();

  const rawSearchParams = new URLSearchParams(location.search);
  const searchParams = Object.fromEntries(rawSearchParams);
  const query = searchParams.query;
  const lat = Number.parseFloat(searchParams.lat) || undefined;
  const lng = Number.parseFloat(searchParams.lng) || undefined;
  const radius = 50000;
  const lastActive = Number.parseInt(searchParams.lastActive);
  const hostingStatusOptions = rawSearchParams
    .getAll("hostingStatus")
    .map((o) => Number.parseInt(o));
  const numGuests = Number.parseInt(searchParams.numGuests) || undefined;

  const {
    data: results,
    error,
    isLoading,
    fetchNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery<UserSearchRes.AsObject, Error>(
    searchQueryKey(query || ""),
    ({ pageParam }) => {
      return service.search.userSearch(
        {
          lat,
          lng,
          radius,
          query,
          lastActive,
          hostingStatusOptions,
          numGuests,
        },
        pageParam
      );
    },
    {
      enabled: !!(Object.keys(searchParams).length > 0),
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
            Object.keys(searchParams).length > 0
              ? [
                  "in",
                  ["get", "id"],
                  ["literal", resultUsers.map((user) => user.userId)],
                ]
              : null
          );

          //create a bounds that encompasses only the first user
          const firstResult = resultUsers[0];
          if (!firstResult) return;
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
          map.current?.fitBounds(newBounds, {
            padding: 64,
            maxZoom: selectedUserZoom,
          });
        };

        if (map.current?.loaded()) {
          setFilter();
        } else {
          map.current?.once("load", setFilter);
        }
      },
    }
  );

  return (
    <Paper className={classes.mapResults}>
      {error && <Alert severity="error">{error.message}</Alert>}
      <Hidden smDown>
        <SearchBox className={classes.searchDesktop} />
      </Hidden>
      {isLoading ? (
        <CircularProgress className={classes.baseMargin} />
      ) : hasAtLeastOnePage(results, "resultsList") ? (
        <HorizontalScroller
          breakpoint="sm"
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
      ) : selectedResult ? (
        selectedUser.data ? (
          <HorizontalScroller breakpoint="sm" className={classes.scroller}>
            <SearchResult
              id={`search-result-${selectedUser.data.userId}`}
              className={classes.singleResult}
              key={selectedUser.data.userId}
              user={selectedUser.data}
              onClick={handleResultClick}
              highlight={selectedUser.data.userId === selectedResult}
            />
          </HorizontalScroller>
        ) : (
          <CircularProgress className={classes.baseMargin} />
        )
      ) : (
        Object.keys(searchParams).length > 0 && (
          <TextBody className={classes.baseMargin}>{NO_USER_RESULTS}</TextBody>
        )
      )}
    </Paper>
  );
}
