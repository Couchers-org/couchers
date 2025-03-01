import { styled } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import FloatingSearchControls from "./FloatingSearchControls";
import MapSearchSidebar from "./MapSearchSidebar";
import MapView from "./MapView";
import MapViewToggle from "./MapViewToggle";
import { InitialSearchLocation, SearchOptions } from "./SearchPage";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface DesktopMapViewProps {
  hasActiveFilters: boolean;
  hasSearchInputValue: boolean;
  hasNextPage: boolean | undefined;
  initialLocation: InitialSearchLocation;
  isLoading: boolean;
  meetsSearchCriteria: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearFilters: () => void;
  onClearSearchInputValue: () => void;
  onLoadNextPage: () => void;
  onOpenFilters: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  onSelectedUserIdClick: (userId: number) => void;
  searchType: MapSearchTypes;
  selectedUserIds: User.AsObject["userId"][];
  totalItems: number;
  users: User.AsObject[] | undefined;
}

const Wrapper = styled("div")(({ theme }) => ({
  height: "100%",
  width: "100%",
  overflow: "hidden",
  display: "flex",
  position: "relative",
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
  hasNextPage,
  hasSearchInputValue,
  initialLocation,
  isLoading,
  meetsSearchCriteria,
  onClearFilters,
  onClearSearchInputValue,
  onLoadNextPage,
  onOpenFilters,
  onSetSearch,
  onSetSearchType,
  onSelectedUserIdClick,
  mapRef,
  searchType,
  selectedUserIds,
  totalItems,
  users,
}: DesktopMapViewProps) => {
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);

  const handleMapViewChange = (view: MapViewOptions) => {
    setMapView(view);
  };

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
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
            onClearSearchInputValue={onClearSearchInputValue}
            onOpenFilters={onOpenFilters}
            onSetSearch={onSetSearch}
            onSetSearchType={onSetSearchType}
            locationName={initialLocation.locationName}
            searchType={searchType}
          />
        </CenterAligner>
      </MapControlsWrapper>
      <MapSearchSidebar
        drawerWidth={drawerWidth}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        mapView={mapView}
        meetsSearchCriteria={meetsSearchCriteria}
        onDrawerWidthChange={handleDrawerWidthChange}
        onLoadNextPage={onLoadNextPage}
        selectedUserIds={selectedUserIds}
        totalItems={totalItems}
        users={users}
      />
      {mapView !== MapViews.LIST_ONLY && (
        <MapContainer drawerWidth={drawerWidth}>
          <MapView
            hasActiveFilters={hasActiveFilters}
            hasSearchInputValue={hasSearchInputValue}
            initialBbox={initialLocation.bbox}
            isLoading={isLoading}
            mapRef={mapRef}
            onClearSearchInputValue={onClearSearchInputValue}
            onSetSearch={onSetSearch}
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
