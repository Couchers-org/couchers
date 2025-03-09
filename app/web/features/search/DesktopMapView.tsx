import { styled } from "@mui/material";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import MapSearchSidebar from "./MapSearchSidebar";
import MapView from "./MapView";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface DesktopMapViewProps {
  drawerWidth: number;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  mapView: MapViewOptions;
  onDrawerWidthChange: (width: number) => void;
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
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  mapRef,
  mapView,
  totalItems,
  users,
}: DesktopMapViewProps) => {
  return (
    <Wrapper>
      <MapSearchSidebar
        drawerWidth={drawerWidth}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        mapView={mapView}
        onDrawerWidthChange={onDrawerWidthChange}
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
