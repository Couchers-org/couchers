import { styled } from "@mui/material";
import { MapRef } from "react-map-gl/maplibre";

import FloatingSearchControls from "./FloatingSearchControls";
import MapViewToggle from "./MapViewToggle";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface DesktopSearchControlsProps {
  drawerWidth: number;
  mapView: MapViewOptions;
  mapRef: React.RefObject<MapRef>;
  onOpenFilters: () => void;
  onSetMapView: (view: MapViewOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
}

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

const DesktopSearchControls = ({
  drawerWidth,
  mapView,
  mapRef,
  // onClearFilters,
  // onClearSearchInputValue,
  onOpenFilters,
  onSetMapView,
  // onSetSearch,
  onSetSearchType,
  searchType,
}: DesktopSearchControlsProps) => {
  const handleMapViewChange = (view: MapViewOptions) => {
    onSetMapView(view);
  };

  return (
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
          mapRef={mapRef}
          onOpenFilters={onOpenFilters}
          onSetSearchType={onSetSearchType}
          searchType={searchType}
        />
      </CenterAligner>
    </MapControlsWrapper>
  );
};

export default DesktopSearchControls;
