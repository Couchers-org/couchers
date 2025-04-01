import { Alert, Box, styled, Typography } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
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
  width: "100%",
  padding: theme.spacing(2),
  height: "100%",
  ...(showTopSpace && { paddingTop: theme.spacing(10) }),
}));

const UserCardsWrapper = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fill, minmax(${DEFAULT_DRAWER_WIDTH - 50}px, 1fr))`, // Responsive columns
  gap: theme.spacing(2),
  justifyContent: "start",
  width: "100%",
  paddingBottom: theme.spacing(2),
}));

const StyledCardWrapper = styled("div")(({ theme }) => ({
  height: `${DEFAULT_DRAWER_WIDTH - 40}px`,
  display: "flex",
}));

const SearchResultListContent = ({
  showAlert,
  showTopSpace = false,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);

  const { selectedUserId } = useMapSearchState();

  return (
    <ListContentWrapper showTopSpace={showTopSpace}>
      {showAlert && (
        <Alert severity="info" sx={{ height: "fit-content", width: "100%" }}>
          {t("search:choose_search_criteria")}
        </Alert>
      )}
      {users?.length === 0 && (
        <Typography>
          {t("search:search_result.no_user_result_message")}
        </Typography>
      )}
      <UserCardsWrapper>
        {users?.map((user) => (
          <StyledCardWrapper
            key={user?.userId}
            id={`search-result-${user?.userId}`}
          >
            <SearchResultUserCard
              isHighlighted={selectedUserId === user.userId}
              user={user}
            />
          </StyledCardWrapper>
        ))}
      </UserCardsWrapper>
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
