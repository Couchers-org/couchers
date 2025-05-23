import { styled, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { LngLatLike, MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import FilterDialog from "./FilterDialog";
import FloatingSearchControls from "./FloatingSearchControls";
import MapViewToggle from "./MapViewToggle";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { useSearchFilters } from "./state/useSearchFilters";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface SearchControlsProps {
  drawerWidth: number;
  mapView: MapViewOptions;
  mapRef: React.RefObject<MapRef>;
  onSetMapView: (view: MapViewOptions) => void;
  onZoomIn: (newZoom: number, center?: LngLatLike) => void;
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
    flexDirection: "column",
    gap: theme.spacing(2),

    [theme.breakpoints.down("md")]: {
      marginTop: theme.spacing(1),
    },

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
  onSetMapView,
  onZoomIn,
}: SearchControlsProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<MapSearchTypes>("location");

  const { filters, resetFilters, updateFilter } = useSearchFilters();

  const handleMapViewChange = (view: MapViewOptions) => {
    onSetMapView(view);
  };

  const handleOpenFiltersDialog = () => {
    setIsFiltersOpen(true);
  };

  const handleCloseFiltersDialog = () => {
    setIsFiltersOpen(false);
  };

  const handleSetSearchType = (type: MapSearchTypes) => {
    setSearchType(type);
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
            onClearFilters={resetFilters}
            onOpenFilters={handleOpenFiltersDialog}
            onSetSearchType={handleSetSearchType}
            searchType={searchType}
            onZoomIn={onZoomIn}
          />
        </CenterAligner>
      </MapControlsWrapper>
      {isMobile && (
        <SearchTypeRadioGroup
          onChange={handleSetSearchType}
          searchType={searchType}
        />
      )}
      <FilterDialog
        filters={filters}
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseFiltersDialog}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
      />
    </>
  );
};

export default SearchControls;
