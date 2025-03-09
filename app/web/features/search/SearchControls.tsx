import { styled, useMediaQuery } from "@mui/material";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import FloatingSearchControls from "./FloatingSearchControls";
import MapViewToggle from "./MapViewToggle";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface SearchControlsProps {
  drawerWidth: number;
  mapView: MapViewOptions;
  mapRef: React.RefObject<MapRef>;
  onOpenFilters: () => void;
  onSetMapView: (view: MapViewOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
}

const MapControlsWrapper = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "isDualView" && prop !== "drawerWidth" && prop !== "isMobile",
})<{ drawerWidth: number; isDualView: boolean; isMobile: boolean }>(
  ({ theme, drawerWidth, isDualView, isMobile }) => ({
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginTop: theme.spacing(2),

    ...(!isMobile && {
      position: "absolute",
      top: theme.spacing(8),
      zIndex: 2,
      right: 0, // Ensure it stays within bounds
    }),

    ...(!isMobile &&
      isDualView && {
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

const SearchControls = ({
  drawerWidth,
  mapView,
  mapRef,
  onOpenFilters,
  onSetMapView,
  onSetSearchType,
  searchType,
}: SearchControlsProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleMapViewChange = (view: MapViewOptions) => {
    onSetMapView(view);
  };

  return (
    <>
      <MapControlsWrapper
        drawerWidth={drawerWidth}
        isDualView={mapView === MapViews.MAP_AND_LIST}
        isMobile={isMobile}
        onClick={(e) => e.stopPropagation()}
      >
        <CenterAligner>
          {!isMobile && (
            <MapViewToggle
              mapView={mapView}
              onMapViewChange={handleMapViewChange}
            />
          )}
          <FloatingSearchControls
            mapRef={mapRef}
            onOpenFilters={onOpenFilters}
            onSetSearchType={onSetSearchType}
            searchType={searchType}
          />
        </CenterAligner>
      </MapControlsWrapper>
      {isMobile && (
        <SearchTypeRadioGroup
          onChange={onSetSearchType}
          searchType={searchType}
        />
      )}
    </>
  );
};

export default SearchControls;
