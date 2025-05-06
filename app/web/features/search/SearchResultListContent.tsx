import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  Alert,
  Box,
  IconButton,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { theme } from "theme";

import SearchResultUserCard from "./SeachResultUserCard";
import { useMapSearchState } from "./state/mapSearchContext";
import { MapViews } from "./utils/constants";

interface SearchResultListContentProps {
  error: RpcError | null;
  mapView: MapViews;
  numberOfTotal: number;
  onSetMapView: (view: MapViews) => void;
  onUserCardClick: (userId: number) => void;
  showAlert: boolean;
  showTopSpace?: boolean;
  totalItems: number | undefined;
  users: User.AsObject[] | undefined;
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
  },
}));

const StyledCardWrapper = styled("div")(({ theme }) => ({
  height: `${DEFAULT_DRAWER_WIDTH - 90}px`,
  display: "flex",

  [theme.breakpoints.down("md")]: {
    height: `${DEFAULT_DRAWER_WIDTH - 200}px`,
  },
}));

const CenteredRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: theme.spacing(1, 0),
}));

const SearchResultListContent = ({
  error,
  mapView,
  numberOfTotal,
  onSetMapView,
  onUserCardClick,
  showAlert,
  showTopSpace = false,
  totalItems,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { selectedUserId } = useMapSearchState();

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
            {t("search:search_result.people_found_message", {
              numberOfTotal,
              totalItems,
            })}
          </Typography>
        )}

        {isMobile && (
          <IconButton
            onClick={() => {
              if (mapView === MapViews.LIST_ONLY) {
                onSetMapView(MapViews.MAP_AND_LIST);
              } else {
                onSetMapView(MapViews.LIST_ONLY);
              }
            }}
            aria-label={t(
              `global:${mapView === MapViews.LIST_ONLY ? "retract" : "expand"}`,
            )}
            sx={{
              fontSize: "24px",
              backgroundColor: theme.palette.common.white,
              border: `1px solid ${theme.palette.divider}`,
              height: "25px",
              width: "25px",
              position: "absolute",
              top: theme.spacing(1),
              right: theme.spacing(2),
              zIndex: 10,

              "&:hover": {
                backgroundColor: theme.palette.common.white,
              },
            }}
          >
            {mapView === MapViews.LIST_ONLY ? (
              <KeyboardArrowDown />
            ) : (
              <KeyboardArrowUp />
            )}
          </IconButton>
        )}
      </CenteredRow>
      <UserCardsWrapper>
        {users?.map((user) => (
          <StyledCardWrapper
            key={user?.userId}
            id={`search-result-${user?.userId}`}
          >
            <SearchResultUserCard
              isHighlighted={selectedUserId === user.userId}
              onUserCardClick={onUserCardClick}
              user={user}
            />
          </StyledCardWrapper>
        ))}
      </UserCardsWrapper>
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
