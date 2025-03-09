import { Alert, Box, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { theme } from "theme";

import SearchResultUserCard from "./SeachResultUserCard";
import { useMapSearchState } from "./state/mapSearchContext";

interface SearchResultListContentProps {
  showAlert: boolean;
  showTopSpace?: boolean;
  users: User.AsObject[] | undefined;
}

const ListContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showTopSpace",
})<{ showTopSpace: boolean }>(({ showTopSpace }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: "100%",
  padding: theme.spacing(0, 2),
  overflowY: "auto", // Allow scrolling if content overflows
  ...(showTopSpace && { paddingTop: theme.spacing(6) }),
}));

const StyledCardWrapper = styled(Box)(({ theme }) => ({
  // 3 columns by default
  flex: `1 1 calc(33% - ${theme.spacing(2)})`,

  [theme.breakpoints.down("sm")]: {
    flex: "1 1 100%", // Make it a single column on mobile
  },
}));

const SearchResultListContent = ({
  showAlert,
  showTopSpace = false,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);

  const { selectedUserIds } = useMapSearchState();

  return (
    <ListContentWrapper showTopSpace={showTopSpace}>
      {showAlert && (
        <Alert severity="info" sx={{ height: "fit-content", width: "100%" }}>
          {t("search:choose_search_criteria")}
        </Alert>
      )}
      {users?.map((user) => (
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
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
