import { Alert, Box, Button, styled, Typography } from "@mui/material";
import BetaFlag from "components/BetaFlag";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { SearchUser } from "proto/search_pb";
import { theme } from "theme";

import SearchResultUserCard from "./SeachResultUserCard";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";

interface SearchResultListContentProps {
  error: RpcError | null;
  currentRange: string;
  onUserCardClick: (userId: number) => void;
  showAlert: boolean;
  showTopSpace?: boolean;
  totalItems: number | undefined;
  users: SearchUser.AsObject[] | undefined;
}

const ListContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showTopSpace",
})<{ showTopSpace: boolean }>(({ showTopSpace }) => ({
  width: "100%",
  padding: theme.spacing(0.5, 2),
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

  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
}));

const StyledCardWrapper = styled("div")(({ theme }) => ({
  height: `${DEFAULT_DRAWER_WIDTH - 75}px`,
  display: "flex",

  [theme.breakpoints.down("md")]: {
    height: "auto",
  },
}));

const CenteredRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: theme.spacing(1, 0),

  [theme.breakpoints.down("md")]: {
    paddingTop: theme.spacing(0.5),
  },
}));

const SearchResultListContent = ({
  error,
  currentRange,
  onUserCardClick,
  showAlert,
  showTopSpace = false,
  totalItems,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);

  const { filters, selectedUserId } = useMapSearchState();

  const { setSearchFilters } = useMapSearchActions();

  const shouldShowSuggestion =
    !showAlert &&
    totalItems !== undefined &&
    filters.showEmptyProfile === false &&
    selectedUserId === undefined;

  const handleIncludeEmptyProfilesClick = () => {
    setSearchFilters({
      ...filters,
      hostingStatus: undefined,
      showEmptyProfile: true,
    });
  };

  return (
    <ListContentWrapper showTopSpace={showTopSpace}>
      {error && (
        <Alert
          severity="error"
          sx={{
            height: "fit-content",
            width: "100%",
            marginBottom: theme.spacing(2),
          }}
        >
          {t("search:error_loading_users")}
        </Alert>
      )}
      {showAlert && (
        <Alert
          severity="info"
          sx={{
            height: "fit-content",
            width: "100%",
            marginTop: theme.spacing(1),
          }}
        >
          {t("search:choose_search_criteria")}
        </Alert>
      )}
      <CenteredRow>
        {users?.length === 0 && (
          <Typography>
            {t("search:search_result.no_user_result_message")}
          </Typography>
        )}
        {(users ?? []).length > 0 && (
          <Typography variant="body2">
            {t("search:search_result.people_range_message", {
              currentRange: currentRange,
              count: totalItems, // "count" name enables plurals
            })}
          </Typography>
        )}
      </CenteredRow>
      {shouldShowSuggestion && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: theme.spacing(1),
            padding: theme.spacing(1, 0),
            marginBottom: theme.spacing(2),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <BetaFlag />
            <Typography variant="body2">
              {t("search:search_result.few_results_suggestion")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleIncludeEmptyProfilesClick}
          >
            {t("search:search_result.include_empty_profiles_button")}
          </Button>
        </Box>
      )}
      <UserCardsWrapper>
        {users?.map((user, index) => (
          <StyledCardWrapper
            key={user?.userId}
            id={`search-result-${user?.userId}`}
          >
            <SearchResultUserCard
              isHighlighted={selectedUserId === user.userId}
              onUserCardClick={onUserCardClick}
              position={index}
              user={user}
            />
          </StyledCardWrapper>
        ))}
      </UserCardsWrapper>
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
