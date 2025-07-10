import { styled, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { LngLatLike, MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import FilterDialog from "./FilterDialog";
import FloatingSearchControls from "./FloatingSearchControls";
import MapViewToggle from "./MapViewToggle";
import SearchModeToggle from "./SearchModeToggle";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { useSearchFilters } from "./state/useSearchFilters";
import {
  MapSearchTypes,
  MapViewOptions,
  MapViews,
  SearchModeOptions,
} from "./utils/constants";

interface SearchControlsProps {
  drawerWidth: number;
  mapView: MapViewOptions;
  mapRef: React.RefObject<MapRef>;
  onSetMapView: (view: MapViewOptions) => void;
  onZoomIn: (newZoom: number, center?: LngLatLike) => void;
}

const MapControlsWrapper = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "drawerWidth" && prop !== "isDualView" && prop !== "isMobile",
})<{
  drawerWidth: number;
  isDualView: boolean;
  isMobile: boolean;
}>(({ theme, drawerWidth, isDualView, isMobile }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  marginTop: theme.spacing(2),
  flexDirection: "column",
  gap: theme.spacing(1),

  [theme.breakpoints.down("md")]: {
    marginTop: theme.spacing(1),
    gap: theme.spacing(0.15),
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
}));

const CenterAligner = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(4),
}));

const ToggleContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.25),

  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(0.5),
    width: "100%",
  },
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

  const mapSearchState = useMapSearchState();
  const { setSearchMode } = useMapSearchActions();
  const { filters, resetFilters, updateFilter } = useSearchFilters();

  const handleMapViewChange = (view: MapViewOptions) => {
    onSetMapView(view);
  };

  const handleSearchModeChange = (searchMode: SearchModeOptions) => {
    setSearchMode(searchMode);
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

  const handleResetFilters = () => {
    resetFilters();
  };

  return (
    <>
      <MapControlsWrapper
        drawerWidth={drawerWidth}
        isDualView={mapView === MapViews.MAP_AND_LIST}
        isMobile={isMobile}
        onClick={(e) => e.stopPropagation()}
      >
        <FloatingSearchControls
          mapRef={mapRef}
          onClearFilters={resetFilters}
          onOpenFilters={handleOpenFiltersDialog}
          onSetSearchType={handleSetSearchType}
          searchType={searchType}
          onZoomIn={onZoomIn}
        />
        <CenterAligner>
          {!isMobile && (
            <>
              <MapViewToggle
                mapView={mapView}
                onMapViewChange={handleMapViewChange}
              />
              <SearchModeToggle
                searchMode={mapSearchState.searchMode}
                onSearchModeChange={handleSearchModeChange}
              />
            </>
          )}
        </CenterAligner>
      </MapControlsWrapper>
      {isMobile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.2)",
            zIndex: 1,
            padding: "0 8px",
            gap: "0px",
          }}
        >
          <SearchTypeRadioGroup
            onChange={handleSetSearchType}
            searchType={searchType}
          />
          <SearchModeToggle
            searchMode={mapSearchState.searchMode}
            onSearchModeChange={handleSearchModeChange}
          />
        </div>
      )}
      <FilterDialog
        filters={filters}
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseFiltersDialog}
        updateFilter={updateFilter}
        resetFilters={handleResetFilters}
      />
    </>
  );
};

export default SearchControls;
