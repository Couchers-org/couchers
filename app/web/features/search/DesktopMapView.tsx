import { styled } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import DesktopSearchControls from "./DesktopSearchControls";
import MapSearchSidebar from "./MapSearchSidebar";
import MapView from "./MapView";
import { InitialSearchLocation, SearchOptions } from "./SearchPage";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface DesktopMapViewProps {
  hasActiveFilters: boolean;
  hasSearchInputValue: boolean;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  initialLocation: InitialSearchLocation;
  isLoading: boolean;
  meetsSearchCriteria: boolean;
  mapRef: React.RefObject<MapRef>;
  onClearFilters: () => void;
  onClearSearchInputValue: () => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  onOpenFilters: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  onSetZoom: (zoom: number) => void;
  onSelectedUserIdClick: (userId: number) => void;
  searchType: MapSearchTypes;
  selectedUserIds: User.AsObject["userId"][];
  totalItems: number;
  users: User.AsObject[] | undefined;
  zoom: number;
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

const DesktopMapView = ({
  hasActiveFilters,
  hasPreviousPage,
  hasNextPage,
  hasSearchInputValue,
  initialLocation,
  isLoading,
  meetsSearchCriteria,
  onClearFilters,
  onClearSearchInputValue,
  onLoadPreviousPage,
  onLoadNextPage,
  onOpenFilters,
  onSetSearch,
  onSetSearchType,
  onSelectedUserIdClick,
  onSetZoom,
  mapRef,
  searchType,
  selectedUserIds,
  totalItems,
  users,
  zoom,
}: DesktopMapViewProps) => {
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
  };

  return (
    <Wrapper>
      <DesktopSearchControls
        drawerWidth={drawerWidth}
        hasActiveFilters={hasActiveFilters}
        locationName={initialLocation.locationName}
        mapView={mapView}
        onClearFilters={onClearFilters}
        onClearSearchInputValue={onClearSearchInputValue}
        onOpenFilters={onOpenFilters}
        onSetMapView={setMapView}
        onSetSearch={onSetSearch}
        onSetSearchType={onSetSearchType}
        searchType={searchType}
      />

      <MapSearchSidebar
        drawerWidth={drawerWidth}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        mapView={mapView}
        meetsSearchCriteria={meetsSearchCriteria}
        onDrawerWidthChange={handleDrawerWidthChange}
        onLoadPreviousPage={onLoadPreviousPage}
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
            onSetZoom={onSetZoom}
            selectedUserIds={selectedUserIds}
            users={users}
            zoom={zoom}
          />
        </MapContainer>
      )}
    </Wrapper>
  );
};

export default DesktopMapView;
