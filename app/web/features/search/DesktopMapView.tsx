import { styled } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { User } from "proto/api_pb";
import { useState } from "react";
import { MapRef } from "react-map-gl/maplibre";

import DesktopSearchControls from "./DesktopSearchControls";
import MapSearchSidebar from "./MapSearchSidebar";
import MapView from "./MapView";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface DesktopMapViewProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  onOpenFilters: () => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
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

const DesktopMapView = ({
  hasPreviousPage,
  hasNextPage,
  isLoading,
  onLoadPreviousPage,
  onLoadNextPage,
  onOpenFilters,
  onSetSearchType,
  mapRef,
  searchType,
  totalItems,
  users,
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
        mapView={mapView}
        mapRef={mapRef}
        onOpenFilters={onOpenFilters}
        onSetMapView={setMapView}
        onSetSearchType={onSetSearchType}
        searchType={searchType}
      />

      <MapSearchSidebar
        drawerWidth={drawerWidth}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        mapView={mapView}
        onDrawerWidthChange={handleDrawerWidthChange}
        onLoadPreviousPage={onLoadPreviousPage}
        onLoadNextPage={onLoadNextPage}
        totalItems={totalItems}
        users={users}
      />

      {mapView !== MapViews.LIST_ONLY && (
        <MapContainer drawerWidth={drawerWidth}>
          <MapView isLoading={isLoading} mapRef={mapRef} users={users} />
        </MapContainer>
      )}
    </Wrapper>
  );
};

export default DesktopMapView;
