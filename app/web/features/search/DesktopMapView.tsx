import { styled, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import FloatingSearchControls from "./FloatingSearchControls";
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

const Wrapper = styled("div")(({ theme }) => ({
  height: "100%",
  width: "100%",
  overflow: "hidden",
  display: "flex",
}));

const DrawerContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    display: "flex",
    width: `${drawerWidth}px`,
    height: "100%",
    overflow: "hidden",
    position: "relative",
  }),
);

const MapContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    width: `calc(100% - ${drawerWidth}px)`,
    height: "100%",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
  }),
);

const MapControlsWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  left: "50%",
  zIndex: 10,
}));

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
    <Wrapper>
      <DrawerContainer drawerWidth={drawerWidth}>
        <ResizeableDrawer onDrawerWidthChange={handleDrawerWidthChange}>
          <>
            {isLoading ? (
              <CenteredSpinner />
            ) : (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    marginTop: theme.spacing(2),
                    display: "flex",
                    justifyContent: "center",
                  }}
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
          </>
        </ResizeableDrawer>
      </DrawerContainer>
      <MapContainer drawerWidth={drawerWidth}>
        <MapControlsWrapper>
          <FloatingSearchControls
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onClearLocation={onClearLocation}
            onSetFilters={onSetFilters}
            query={query}
          />
        </MapControlsWrapper>
        <MapView
          flyToLocation={flyToLocation}
          isLoading={isLoading}
          mapRef={mapRef}
          onSetFilters={onSetFilters}
          onSelectedUserIdClick={onSelectedUserIdClick}
          selectedUserIds={selectedUserIds}
          users={users}
        />
      </MapContainer>
    </Wrapper>
  );
};

export default DesktopMapView;
