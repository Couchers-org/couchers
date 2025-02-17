import { styled, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import MapView from "./MapView";
import { FilterOptions, FlyToLocationProps } from "./SearchPage";
import SearchResultsList from "./SearchResultsList";

const DEFAULT_DRAWER_WIDTH = 400;

export enum MapViews {
  MAP_AND_LIST = "MAP_AND_LIST",
  LIST_ONLY = "LIST_ONLY",
  MAP_ONLY = "MAP_ONLY",
}

export type MapViewOptions =
  | MapViews.MAP_AND_LIST
  | MapViews.LIST_ONLY
  | MapViews.MAP_ONLY;

interface DesktopMapViewProps {
  flyToLocation: (location: FlyToLocationProps) => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearFilters: () => void;
  onClearLocation: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  onSelectedUserIdClick: (userId: number) => void;
  query: string | undefined;
  selectedUserIds: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const StyledMapContainer = styled("div")(({ theme }) => () => ({
  display: "flex",
  position: "fixed",
  top: theme.shape.navPaddingXs,
  left: 0,
  bottom: 0,
  right: 0,
  height: "100%",
  width: "100%",

  [theme.breakpoints.up("sm")]: {
    top: theme.shape.navPaddingSmUp,
  },
}));

const CenteredContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

const DrawerContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    display: "flex",
    width: `${drawerWidth}px`,
    height: "100%",
  }),
);

const MapContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    display: "flex",
    width: `calc(100% - ${drawerWidth}px)`,
    position: "relative",
  }),
);

const DesktopMapView = ({
  flyToLocation,
  hasActiveFilters,
  isLoading,
  onClearFilters,
  onClearLocation,
  onSetFilters,
  onSelectedUserIdClick,
  query,
  mapRef,
  selectedUserIds,
  users,
}: DesktopMapViewProps) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
  };

  return (
    <>
      <StyledMapContainer>
        <DrawerContainer drawerWidth={drawerWidth}>
          <ResizeableDrawer
            drawerWidth={drawerWidth}
            onDrawerWidthChange={handleDrawerWidthChange}
          >
            <CenteredContainer>
              {isLoading ? (
                <CenteredSpinner />
              ) : (
                <>
                  <Typography
                    variant="caption"
                    sx={{ marginTop: theme.spacing(2) }}
                  >
                    {!users
                      ? t("search:search_result.no_user_result_message")
                      : t("search:search_result.users_found_message", {
                          count: users.length,
                        })}
                  </Typography>
                  <SearchResultsList
                    selectedUserIds={selectedUserIds}
                    users={users}
                  />
                </>
              )}
            </CenteredContainer>
          </ResizeableDrawer>
        </DrawerContainer>
        <MapContainer drawerWidth={drawerWidth}>
          <MapView
            flyToLocation={flyToLocation}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            mapRef={mapRef}
            onClearFilters={onClearFilters}
            onClearLocation={onClearLocation}
            onSetFilters={onSetFilters}
            onSelectedUserIdClick={onSelectedUserIdClick}
            query={query}
            selectedUserIds={selectedUserIds}
            users={users}
          />
        </MapContainer>
      </StyledMapContainer>
    </>
  );
};

export default DesktopMapView;
