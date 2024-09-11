import { Hidden, makeStyles, Paper } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import SearchResult from "features/search/SearchResult";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { Dispatch, SetStateAction } from "react";
import { InfiniteData } from "react-query";

import SearchBox from "./SearchBox";

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

interface mapWrapperProps {
  isLoading: boolean;
  results: InfiniteData<UserSearchRes.AsObject> | undefined;
  error?: string | undefined;
  hasNext?: boolean | undefined;
  selectedResult:
  | Pick<User.AsObject, "username" | "userId" | "lng" | "lat">
  | undefined;
  setSelectedResult: Dispatch<
    SetStateAction<
      Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
    >
  >;
  searchType: string;
  locationResult: any;
  setSearchType: Dispatch<SetStateAction<string>>;
  setLocationResult: Dispatch<SetStateAction<any>>;
  setQueryName: Dispatch<SetStateAction<undefined | string>>;
  queryName: undefined | string;
}

export default function SearchResultsList({
  isLoading,
  results,
  error,
  hasNext,
  selectedResult,
  setSelectedResult,
  searchType,
  setSearchType,
  locationResult,
  setLocationResult,
  setQueryName,
  queryName,
}: mapWrapperProps) {
  const selectedUserData = useUser(selectedResult?.userId);
  const { t } = useTranslation(SEARCH);
  const classes = useStyles();
  const hasAtLeastOnePageResults =
    results && results?.pages[0]?.resultsList?.length !== 0;

  let resultsList: any = results?.pages
    .flatMap((page) => page.resultsList)
    .filter((result) => result.user);

  let wasResultFound = false;
  resultsList?.map((value :any) => {
    if (value.user?.userId === selectedResult?.userId) {
      wasResultFound = true;
    }
  })

  if (!wasResultFound && selectedUserData.data) {
    resultsList = [{user: selectedUserData.data}];
  }

  return (
    <Paper className={classes.mapResults}>
      {error && <Alert severity="error">{error}</Alert>}

      <Hidden smDown>
        <SearchBox
          searchType={searchType}
          setSearchType={setSearchType}
          locationResult={locationResult}
          setLocationResult={setLocationResult}
          setQueryName={setQueryName}
          queryName={queryName}
        />
      </Hidden>

      <>
        {isLoading || selectedUserData.isLoading && <CircularProgress className={classes.baseMargin} />}

        {!isLoading && !hasAtLeastOnePageResults && (
          <TextBody className={classes.baseMargin}>
            {t("search_result.no_user_result_message")}
          </TextBody>
        )}

        {!isLoading && hasAtLeastOnePageResults && (
          <HorizontalScroller
            breakpoint="sm"
            className={classes.scroller}
            isFetching={isLoading}
            // fetchNext={fetchNextPage} // TODO: disabled for now (until pagination)
            hasMore={hasNext}
          >
            {resultsList && resultsList.map((result: any) => (
              <SearchResult
                id={`search-result-${result.user!.userId}`}
                className={classes.searchResult}
                key={result.user!.userId}
                user={result.user!}
                onSelect={() => {
                  setSelectedResult({
                    username: result.user!.username,
                    userId: result.user!.userId,
                    lng: result.user!.lng,
                    lat: result.user!.lat,
                  });
                }}
                highlight={
                  selectedResult &&
                  selectedResult.userId === result.user!.userId 
                }
              />
            ))}
          </HorizontalScroller>
        )}


      </>
    </Paper>
  );
}
