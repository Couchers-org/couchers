import { useMediaQuery } from "@mui/material";
import { User } from "proto/api_pb";
import { useState } from "react";
import { theme } from "theme";

import DesktopSearchControls from "./DesktopSearchControls";
import MobileSearchControls from "./MobileSearchControls";
import { SearchOptions } from "./SearchPage";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface SearchControlsProps {
  drawerWidth: number;
  hasActiveFilters: boolean;
  locationName: string | undefined;
  meetsSearchCriteria: boolean;
  onClearFilters: () => void;
  onClearSearchInputValue: () => void;
  onOpenFilters: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users: User.AsObject[];
}

const SearchControls = ({
  drawerWidth,
  hasActiveFilters,
  locationName,
  meetsSearchCriteria,
  onClearFilters,
  onClearSearchInputValue,
  onOpenFilters,
  onSetSearch,
  onSetSearchType,
  searchType,
  totalItems,
  users,
}: SearchControlsProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mapView, setMapView] = useState<MapViewOptions>(MapViews.MAP_AND_LIST);



  return isMobile ? (
    <MobileSearchControls
      hasActiveFilters={hasActiveFilters}
      locationName={locationName}
      meetsSearchCriteria={meetsSearchCriteria}
      onClearSearchInputValue={onClearSearchInputValue}
      onOpenFilters={onOpenFilters}
      onSetSearch={onSetSearch}
      onSetSearchType={onSetSearchType}
      searchType={searchType}
      totalItems={totalItems}
      users={users}
    />
  ) : (
    <DesktopSearchControls
      drawerWidth={drawerWidth}
      hasActiveFilters={hasActiveFilters}
      locationName={locationName}
      mapView={mapView}
      onClearFilters={onClearFilters}
      onClearSearchInputValue={onClearSearchInputValue}
      onOpenFilters={onOpenFilters}
      onSetMapView={setMapView}
      onSetSearch={onSetSearch}
      onSetSearchType={onSetSearchType}
      searchType={searchType}
    />
  );
};

export default SearchControls;
