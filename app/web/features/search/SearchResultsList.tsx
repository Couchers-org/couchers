import { Alert, Box, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";

import SearchResultUserCard from "./SeachResultUserCard";

interface SearchResultsListProps {
  isLoading?: boolean;
  meetsSearchCriteria: boolean;
  selectedUserIds?: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: "100%",
}));

const StyledCardWrapper = styled(Box)(({ theme }) => ({
  // 3 columns by default
  flex: `1 1 calc(33% - ${theme.spacing(2)})`,
}));

const SearchResultsList = ({
  meetsSearchCriteria,
  isLoading,
  selectedUserIds,
  users,
}: SearchResultsListProps) => {
  const { t } = useTranslation([SEARCH]);

  if (!users && meetsSearchCriteria) {
    return null;
  }

  return (
    <StyledContainer>
      {!meetsSearchCriteria && (
        <Alert severity="info" sx={{ height: "fit-content", width: "100%" }}>
          {t("search:choose_search_criteria")}
        </Alert>
      )}

      {isLoading && <CenteredSpinner />}

      {!isLoading &&
        meetsSearchCriteria &&
        users?.map((user) => (
          <StyledCardWrapper
            key={user?.userId}
            id={`search-result-${user?.userId}`}
          >
            <SearchResultUserCard
              isHighlighted={
                !selectedUserIds ? false : selectedUserIds.includes(user.userId)
              }
              user={user}
            />
          </StyledCardWrapper>
        ))}
    </StyledContainer>
  );
};

export default SearchResultsList;
