import { Alert, Box, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { User } from "proto/api_pb";

import SearchResultUserCard from "./SeachResultUserCard";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";

interface SearchResultsListProps {
  hasSearchCriteria: boolean;
  isLoading?: boolean;
  selectedUserIds: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: "100%",
  height: "100%",
}));

const StyledCardWrapper = styled(Box)(({ theme }) => ({
  // 3 columns by default
  flex: `1 1 calc(33% - ${theme.spacing(2)})`,
}));

const SearchResultsList = ({
  hasSearchCriteria,
  isLoading,
  selectedUserIds,
  users,
}: SearchResultsListProps) => {
  const { t } = useTranslation([SEARCH]);

  if (!users && hasSearchCriteria) {
    return null;
  }

  if (isLoading) {
    <CenteredSpinner />;
  }

  return (
    <StyledContainer>
      {!hasSearchCriteria && (
        <Alert severity="info" sx={{ height: "fit-content" }}>
          {t("search:choose_search_criteria")}
        </Alert>
      )}
      {hasSearchCriteria &&
        users?.map((user) => (
          <StyledCardWrapper
            key={user?.userId}
            id={`search-result-${user?.userId}`}
          >
            <SearchResultUserCard
              isHighlighted={selectedUserIds.includes(user.userId)}
              user={user}
            />
          </StyledCardWrapper>
        ))}
    </StyledContainer>
  );
};

export default SearchResultsList;
