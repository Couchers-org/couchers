import { styled } from "@mui/material";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";

import SearchResultsList from "./SearchResultsList";
import { MapSearchTypes } from "./utils/constants";

interface MobileMapViewProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading?: boolean;
  mapRef: React.RefObject<MapRef>;
  onOpenFilters: () => void;
  onLoadNextPage: () => void;
  onLoadPreviousPage: () => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users: User.AsObject[];
}

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
  onLoadNextPage,
  onLoadPreviousPage,
  isLoading,
  totalItems,
  users,
}: MobileMapViewProps) => {
  return (
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
  );
};

export default MobileMapView;
