import { styled } from "@mui/material";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import MobileSearchControls from "./MobileSearchControls";
import SearchResultsList from "./SearchResultsList";
import { MapSearchTypes } from "./utils/constants";

interface MobileMapViewProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading?: boolean;
  // onClearSearchInputValue: () => void;
  mapRef: React.RefObject<MapRef>;
  onOpenFilters: () => void;
  onLoadNextPage: () => void;
  onLoadPreviousPage: () => void;
  // onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users: User.AsObject[];
}

const StyledWrapper = styled("div")({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const StyledResultsWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexDirection: "column",
  overflowY: "auto",
  padding: theme.spacing(0, 2, 4, 2),
}));

const MobileMapView = ({
  hasNextPage,
  hasPreviousPage,
  // onClearSearchInputValue,
  mapRef,
  onLoadNextPage,
  onLoadPreviousPage,
  onOpenFilters,
  // onSetSearch,
  onSetSearchType,
  searchType,
  isLoading,
  totalItems,
  users,
}: MobileMapViewProps) => {
  return (
    <StyledWrapper id="styled-wrapper">
      <MobileSearchControls
        mapRef={mapRef}
        // onClearSearchInputValue={onClearSearchInputValue}
        onOpenFilters={onOpenFilters}
        // onSetSearch={onSetSearch}
        onSetSearchType={onSetSearchType}
        searchType={searchType}
        totalItems={totalItems}
        users={users}
      />
      <StyledResultsWrapper>
        <SearchResultsList
          isLoading={isLoading}
          users={users}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          onLoadPreviousPage={onLoadPreviousPage}
          onLoadNextPage={onLoadNextPage}
          totalItems={totalItems}
        />
      </StyledResultsWrapper>
    </StyledWrapper>
  );
};

export default MobileMapView;
