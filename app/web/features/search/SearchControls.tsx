import { useMediaQuery } from "@mui/material";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import DesktopSearchControls from "./DesktopSearchControls";
import MobileSearchControls from "./MobileSearchControls";
import { MapSearchTypes, MapViewOptions } from "./utils/constants";

interface SearchControlsProps {
  drawerWidth: number;
  mapRef: React.RefObject<MapRef>;
  mapView: MapViewOptions;
  onMapViewChange: (view: MapViewOptions) => void;
  onOpenFilters: () => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users: User.AsObject[];
}

const SearchControls = ({
  drawerWidth,
  mapRef,
  mapView,
  onMapViewChange,
  onOpenFilters,
  onSetSearchType,
  searchType,
  totalItems,
  users,
}: SearchControlsProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return isMobile ? (
    <MobileSearchControls
      mapRef={mapRef}
      onOpenFilters={onOpenFilters}
      onSetSearchType={onSetSearchType}
      searchType={searchType}
      totalItems={totalItems}
      users={users}
    />
  ) : (
    <DesktopSearchControls
      drawerWidth={drawerWidth}
      mapRef={mapRef}
      mapView={mapView}
      onOpenFilters={onOpenFilters}
      onSetMapView={onMapViewChange}
      onSetSearchType={onSetSearchType}
      searchType={searchType}
    />
  );
};

export default SearchControls;
