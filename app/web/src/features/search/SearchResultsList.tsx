import { Hidden, makeStyles, Paper } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import { NO_USER_RESULTS, selectedUserZoom } from "features/search/constants";
import SearchBox from "features/search/SearchBox";
import SearchResult from "features/search/SearchResult";
import { filterUsers } from "features/search/users";
import useSearchFilters from "features/search/useSearchFilters";
import { useUser } from "features/userQueries/useUsers";
import { Error } from "grpc-web";
import maplibregl, { LngLatBounds, Map as MaplibreMap } from "maplibre-gl";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { searchQueryKey } from "queryKeys";
import { MutableRefObject, useRef } from "react";
import { useInfiniteQuery } from "react-query";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

const useStyles = makeStyles((theme) => ({
  mapResults: {
    height: "17rem",
    overflowY: "auto",
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up("md")]: {
      height: "auto",
      width: "30rem",
      padding: theme.spacing(3),
    },
  },
  baseMargin: {
    margin: theme.spacing(2),
  },
  scroller: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      marginTop: 0,
    },
  },
  singleResult: {
    maxWidth: "100%",
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(2),
    },
  },
  searchResult: {
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 0 4px rgba(0,0,0,0.25)",
    marginBottom: theme.spacing(3),
    "&:last-child": {
      marginBottom: 0,
    },
    "& .MuiCardContent-root": {
      padding: theme.spacing(3),
    },
    [theme.breakpoints.down("sm")]: {
      padding: 0,
      overflow: "hidden",
      flexShrink: 0,
      width: "85vw",
      maxWidth: "33rem",
      height: "100%",
      margin: theme.spacing(0, 2, 0, 0),
      scrollSnapAlign: "start",
      "&:last-child": {
        marginRight: 0,
      },
      "& .MuiCardActionArea-root": {
        height: "100%",
      },
      "& .MuiCardContent-root": {
        height: "100%",
        padding: theme.spacing(2),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      },
    },
  },
}));

interface SearchResultsListProps {
  handleResultClick(user: User.AsObject): void;
  handleMapUserClick(ev: {
    features?: maplibregl.MapboxGeoJSONFeature[];
  }): void;
  map: MutableRefObject<MaplibreMap | undefined>;
  selectedResult?: number;
  searchFilters: ReturnType<typeof useSearchFilters>;
}

export default function SearchResultsList({
  handleResultClick,
  handleMapUserClick,
  map,
  selectedResult,
  searchFilters,
}: SearchResultsListProps) {
  const classes = useStyles();

  const selectedUser = useUser(selectedResult);

  const { query, lat, lng, lastActive, hostingStatusOptions, numGuests } =
    searchFilters.active;
  const radius = 50000;

  const isFirstQuery = useRef(true);
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
          map.current &&
            filterUsers(
              map.current,
              Object.keys(searchFilters.active).length > 0
                ? resultUsers.map((user) => user.userId)
                : null,
              handleMapUserClick
            );

          //don't zoom to map results for the very first query
          //this allows people to press back and be in the right place
          if (!isFirstQuery.current) {
            //create a bounds that encompasses only the first user
            const firstResult = resultUsers[0];
            if (!firstResult) return;
            if (firstResult.lat === 0 && firstResult.lng === 0) return;
            const newBounds = new LngLatBounds([
              [firstResult.lng, firstResult.lat],
              [firstResult.lng, firstResult.lat],
            ]);

            resultUsers.forEach((user) => {
              //skip if the user is already in the bounds or location is 0,0
              if (newBounds.contains([user.lng, user.lat])) return;
              if (user.lat === 0 && user.lng === 0) return;
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
            isFirstQuery.current = false;
          }
        };

        if (map.current?.loaded()) {
          setFilter();
        } else {
          map.current?.once("load", setFilter);
        }
      },
    }
  );
  const isSearching = Object.keys(searchFilters.active).length !== 0;

  return (
    <Paper className={classes.mapResults}>
      {error && <Alert severity="error">{error.message}</Alert>}
      <Hidden smDown>
        <SearchBox searchFilters={searchFilters} />
      </Hidden>
      {isSearching ? (
        isLoading ? (
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
                    onSelect={handleResultClick}
                    highlight={result.user.userId === selectedResult}
                  />
                ) : null
              )}
          </HorizontalScroller>
        ) : (
          <TextBody className={classes.baseMargin}>{NO_USER_RESULTS}</TextBody>
        )
      ) : (
        selectedResult && (
          <>
            {selectedUser.error && (
              <Alert severity="error">{selectedUser.error}</Alert>
            )}
            {selectedUser.isLoading && (
              <CircularProgress className={classes.baseMargin} />
            )}
            {selectedUser.data && (
              <HorizontalScroller breakpoint="sm" className={classes.scroller}>
                <SearchResult
                  id={`search-result-${selectedUser.data.userId}`}
                  className={classes.singleResult}
                  key={selectedUser.data.userId}
                  user={selectedUser.data}
                  onSelect={handleResultClick}
                  highlight={selectedUser.data.userId === selectedResult}
                />
              </HorizontalScroller>
            )}
          </>
        )
      )}
    </Paper>
  );
}
