import { Paper, styled, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import SearchResult from "features/search/SearchResult";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { Dispatch, SetStateAction, useState } from "react";
import { InfiniteData } from "react-query";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import SearchBox from "./SearchBox";
import SearchResultsMobileVerticalList from "./SearchResultsMobileVerticalList";

const StyledMapResults = styled(Paper)(({ theme }) => ({
  height: "17rem",
  overflowY: "auto",
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up("md")]: {
    height: "auto",
    width: "30rem",
    padding: theme.spacing(3),
  },
}));

const StyledTextBody = styled(TextBody)(({ theme }) => ({
  margin: theme.spacing(2),
}));

const StyledHorizontalScroller = styled(HorizontalScroller)(({ theme }) => ({
  boxShadow: "none",
  marginTop: theme.spacing(3),
  [theme.breakpoints.down("md")]: {
    marginTop: 0,
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  boxShadow: "none",
}));

const StyledSearchResult = styled(SearchResult)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 0 4px rgba(0,0,0,0.25)",
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(3),
    "&:last-child": {
      marginBottom: 0,
    },
  },
  "& .MuiCardContent-root": {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.down("md")]: {
    padding: 0,
    overflow: "hidden",
    flexShrink: 0,
    width: "90%",
    maxWidth: "33rem",
    height: "100%",
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
}));

interface mapWrapperProps {
  isLoading: boolean;
  results: InfiniteData<UserSearchRes.AsObject> | undefined;
  error?: string | undefined;
  hasNext?: boolean | undefined;
  selectedResult: Pick<User.AsObject, "userId" | "lng" | "lat"> | undefined;
  setSelectedResult: Dispatch<
    SetStateAction<Pick<User.AsObject, "userId" | "lng" | "lat"> | undefined>
  >;
  searchType: "location" | "keyword";
  setSearchType: Dispatch<SetStateAction<"location" | "keyword">>;
  locationResult: GeocodeResult;
  setLocationResult: Dispatch<SetStateAction<GeocodeResult>>;
  setQueryName: Dispatch<SetStateAction<string>>;
  queryName: string;
  wasSearchPerformed: boolean;
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
  wasSearchPerformed,
}: mapWrapperProps) {
  const [open, setOpen] = useState(false);
  const selectedUserData = useUser(selectedResult?.userId);
  const { t } = useTranslation(SEARCH);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const hasAtLeastOnePageResults =
    results && results?.pages[0]?.resultsList?.length !== 0;

  let resultsList = results?.pages
    .flatMap((page) => page.resultsList)
    .filter((result) => result.user);

  if (isMobile && !wasSearchPerformed) {
    resultsList = [];
  }

  const wasResultFound =
    resultsList?.find(
      (value) => value.user?.userId === selectedResult?.userId
    ) !== undefined;

  if (!wasResultFound && selectedUserData.data) {
    resultsList = [{ user: selectedUserData.data, rank: 0, snippet: "" }];
  }

  const resultsSnippet =
    resultsList &&
    resultsList.map((result) => (
      <StyledSearchResult
        id={`search-result-${result.user!.userId}`}
        key={result.user!.userId}
        user={result.user!}
        onSelect={() => {
          setOpen(false);
          setSelectedResult({
            userId: result.user!.userId,
            lng: result.user!.lng,
            lat: result.user!.lat,
          });
        }}
        highlight={
          selectedResult && selectedResult.userId === result.user!.userId
        }
      />
    ));

  const isLoadingState = isLoading || selectedUserData.isLoading;

  return (
    <>
      {/* Mobile */}
      {isMobile && resultsSnippet && resultsSnippet?.length > 0 && (
        <>
          <SearchResultsMobileVerticalList open={open} setOpen={setOpen} resultsSnippet={resultsSnippet} />
          {error && <Alert severity="error">{error}</Alert>}
        </>
      )}

      {/* Desktop */}
      {
        !isMobile && hasAtLeastOnePageResults && (
          <StyledMapResults>
            <SearchBox
              searchType={searchType}
              setSearchType={setSearchType}
              locationResult={locationResult}
              setLocationResult={setLocationResult}
              setQueryName={setQueryName}
              queryName={queryName}
            />

            <StyledPaper>
              {isLoadingState && <CenteredSpinner />}

              {error && <Alert severity="error">{error}</Alert>}

              {!isLoading && !hasAtLeastOnePageResults && (
                <StyledTextBody>
                  {t("search_result.no_user_result_message")}
                </StyledTextBody>
              )}

              {hasAtLeastOnePageResults && (
                <StyledHorizontalScroller
                  breakpoint="md"
                  isFetching={isLoading}
                  hasMore={hasNext}
                >
                  {resultsSnippet}
                </StyledHorizontalScroller>
              )}
            </StyledPaper>
          </StyledMapResults>
        )
      }
    </>
  );
}
