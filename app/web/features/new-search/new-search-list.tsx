import { Hidden, makeStyles, Paper } from "@material-ui/core";
import { useContext, useState } from "react";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import SearchResult from "features/search/SearchResult";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import NewSearchBox from "./new-search-box";
import { useEffect } from "react";

import { mapContext } from "./new-search-page-controller";

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

export default function NewSearchList({ }) {
  // out of the context
  const {isLoading, results} = useContext(mapContext);

  // const [results, setResults] = useContext(mapContext);
  const { t } = useTranslation(SEARCH);
  const classes = useStyles();
  const hasAtLeastOnePageResults = true;
  const selectedResult = undefined;

  /*
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

          if (bbox && bbox.join() !== "0,0,0,0") {
            map.current?.fitBounds(bbox, {
              maxZoom: selectedUserZoom,
            });
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
  */

  const error = {
    message: ""
  };

  return (
    <Paper className={classes.mapResults}>
      {error && <Alert severity="error">{error.message}</Alert>}
      <Hidden smDown>
        <NewSearchBox />
      </Hidden>
      <>
        {isLoading && <CircularProgress className={classes.baseMargin} />}

        {!isLoading && !hasAtLeastOnePageResults &&
          <TextBody className={classes.baseMargin}>
            {t("search_result.no_user_result_message")}
          </TextBody>
        }

        {!isLoading && hasAtLeastOnePageResults &&
          <HorizontalScroller
            breakpoint="sm"
            className={classes.scroller}
            isFetching={isLoading}
            fetchNext={() => { }}
            hasMore={false}
          >
            {!!results && results.length && results.map((result: any) => {
              return <SearchResult
                id={`search-result-${result.userId}`}
                className={classes.searchResult}
                key={result.userId}
                user={result}
                onSelect={() => { alert("selected :)") }}
                highlight={result.userId === selectedResult}
              />
            }
            )}
          </HorizontalScroller>
        }
      </>
    </Paper>
  );
}
