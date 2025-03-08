import { styled, Typography } from "@mui/material";
import ResizeableDrawer from "components/ResizeableDrawer";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useTranslation } from "react-i18next";
import { theme } from "theme";

import SearchResultsList from "./SearchResultsList";
import { useMapSearchState } from "./state/mapSearchContext";
import { MapViews, MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";

interface MapSearchSidebarProps {
  drawerWidth: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
  mapView: MapViews;
  onDrawerWidthChange: (width: number) => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  totalItems?: number;
  users: User.AsObject[] | undefined;
}

const DrawerContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "drawerWidth" && prop !== "isDualView",
})<{ drawerWidth: number; isDualView: boolean }>(
  ({ theme, drawerWidth, isDualView }) => ({
    display: "flex",
    width: isDualView ? `${drawerWidth}px` : "100%",
    height: "100%",
    position: "relative",
  }),
);

const ListContentWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "showTopSpace",
})<{ showTopSpace: boolean }>(({ theme, showTopSpace }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",

  ...(showTopSpace && { paddingTop: theme.spacing(6) }),
}));

const UpperBox = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

const MapSearchSidebar = ({
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  mapView,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  totalItems,
  users,
}: MapSearchSidebarProps) => {
  const { t } = useTranslation([SEARCH]);

  const { hasActiveFilters, hasSearchInputValue, zoom } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters ||
    hasSearchInputValue ||
    zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

  const handleDrawerWidthChange = (width: number) => {
    onDrawerWidthChange(width);
  };
  return (
    <DrawerContainer
      drawerWidth={drawerWidth}
      isDualView={mapView === MapViews.MAP_AND_LIST}
    >
      <ResizeableDrawer
        onDrawerWidthChange={handleDrawerWidthChange}
        showDragger={mapView !== MapViews.LIST_ONLY}
      >
        <>
          <ListContentWrapper
            showTopSpace={
              mapView === MapViews.LIST_ONLY ||
              drawerWidth > window.innerWidth / 2
            }
          >
            <UpperBox>
              <Typography
                variant="caption"
                sx={{
                  marginTop: theme.spacing(2),
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {!meetsSearchCriteria
                  ? null
                  : !users
                    ? t("search:search_result.no_user_result_message")
                    : t("search:search_result.users_found_message", {
                        count: users.length,
                        totalItems,
                      })}
              </Typography>
              <SearchResultsList
                isLoading={isLoading}
                users={users}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                onLoadPreviousPage={onLoadPreviousPage}
                onLoadNextPage={onLoadNextPage}
                totalItems={totalItems}
              />
            </UpperBox>
          </ListContentWrapper>
        </>
      </ResizeableDrawer>
    </DrawerContainer>
  );
};

export default MapSearchSidebar;
