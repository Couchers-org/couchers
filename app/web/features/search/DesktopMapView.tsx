import { styled, Typography } from "@mui/material";
import ResizeableDrawer, {
  DEFAULT_DRAWER_WIDTH,
} from "components/ResizeableDrawer";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import FloatingSearchControls from "./FloatingSearchControls";
import MapView from "./MapView";
import MapViewToggle from "./MapViewToggle";
import { FilterOptions, SearchQueryOptions } from "./SearchPage";
import SearchResultsList from "./SearchResultsList";

export enum MapViews {
  MAP_AND_LIST = "MAP_AND_LIST",
  LIST_ONLY = "LIST_ONLY",
}

export type MapViewOptions = MapViews.MAP_AND_LIST | MapViews.LIST_ONLY;
interface DesktopMapViewProps {
  hasActiveFilters: boolean;
  hasSearchQuery: boolean;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearFilters: () => void;
  onClearSearchQuery: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  onSetSearchQuery: (searchQuery: SearchQueryOptions) => void;
  onSelectedUserIdClick: (userId: number) => void;
  searchQuery: string | undefined;
  selectedUserIds: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const Wrapper = styled("div")(({ theme }) => ({
  height: "100%",
  width: "100%",
  overflow: "hidden",
  display: "flex",
  position: "relative",
}));

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

  ...(showTopSpace && { paddingTop: theme.spacing(6) }),
}));

const MapContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "drawerWidth",
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  width: `calc(100% - ${drawerWidth}px)`,
  height: "100%",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  alignItems: "center",
}));

const MapControlsWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "isDualView" && prop !== "drawerWidth",
})<{ drawerWidth: number; isDualView: boolean }>(
  ({ theme, drawerWidth, isDualView }) => ({
    position: "absolute",
    top: theme.spacing(2),
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    width: "100%",
    right: 0, // Ensure it stays within bounds

    ...(isDualView && {
      ...(drawerWidth > window.innerWidth / 2
        ? { left: 0, width: `${drawerWidth}px` }
        : { right: 0, width: `calc(100% - ${drawerWidth}px)` }),
    }),
  }),
);

const CenterAligner = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(1),
  justifyContent: "center",
}));

const DesktopMapView = ({
  hasActiveFilters,
  hasSearchQuery,
  isLoading,
  onClearFilters,
  onClearSearchQuery,
  onSetFilters,
  onSetSearchQuery,
  onSelectedUserIdClick,
  searchQuery,
  mapRef,
  selectedUserIds,
  users,
}: DesktopMapViewProps) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);
  const zoom = mapRef.current?.getZoom() || 1;

  const hasSearchCriteria = hasActiveFilters || hasSearchQuery || zoom >= 5;

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
  };

  const handleMapViewChange = (view: MapViewOptions) => {
    setMapView(view);
  };

  return (
    <Wrapper>
      <MapControlsWrapper
        drawerWidth={drawerWidth}
        isDualView={mapView === MapViews.MAP_AND_LIST}
        onClick={(e) => e.stopPropagation()}
      >
        <CenterAligner>
          <MapViewToggle
            mapView={mapView}
            onMapViewChange={handleMapViewChange}
          />
          <FloatingSearchControls
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onClearSearchQuery={onClearSearchQuery}
            onSetFilters={onSetFilters}
            onSetSearchQuery={onSetSearchQuery}
            searchQuery={searchQuery}
          />
        </CenterAligner>
      </MapControlsWrapper>
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
              <Typography
                variant="caption"
                sx={{
                  marginTop: theme.spacing(2),
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {!hasSearchCriteria
                  ? null
                  : !users
                    ? t("search:search_result.no_user_result_message")
                    : t("search:search_result.users_found_message", {
                        count: users.length,
                      })}
              </Typography>
              <SearchResultsList
                isLoading={isLoading}
                selectedUserIds={selectedUserIds}
                users={users}
                hasSearchCriteria={hasSearchCriteria}
              />
            </ListContentWrapper>
          </>
        </ResizeableDrawer>
      </DrawerContainer>
      {mapView !== MapViews.LIST_ONLY && (
        <MapContainer drawerWidth={drawerWidth}>
          <MapView
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            mapRef={mapRef}
            onClearSearchQuery={onClearSearchQuery}
            onSetSearchQuery={onSetSearchQuery}
            onSelectedUserIdClick={onSelectedUserIdClick}
            selectedUserIds={selectedUserIds}
            users={users}
          />
        </MapContainer>
      )}
    </Wrapper>
  );
};

export default DesktopMapView;
