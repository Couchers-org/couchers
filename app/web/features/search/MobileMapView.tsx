import { styled } from "@mui/styles";
import SearchResultsList from "./SearchResultsList";
import FloatingSearchControls from "./FloatingSearchControls";
import { FilterOptions, SearchOptions } from "./SearchPage";

interface MobileMapViewProps {
  hasActiveFilters: boolean;
  isLoading?: boolean;
  locationName: string | undefined;
  onClearFilters: () => void;
  onClearSearchInputValue: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  onSetSearch: (search: SearchOptions) => void;
  selectedUserIds: number[];
  users: any[] | undefined;
}

const StyledWrapper = styled("div")({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const MobileMapView = ({
  hasActiveFilters,
  locationName,
  onClearFilters,
  onClearSearchInputValue,
  onSetFilters,
  onSetSearch,
  isLoading,
  selectedUserIds,
  users,
}: MobileMapViewProps) => {
  return (
    <StyledWrapper>
      <SearchResultsList
        isLoading={isLoading}
        selectedUserIds={selectedUserIds}
        users={users}
        meetsSearchCriteria={true}
      />
    </StyledWrapper>
  );
};

export default MobileMapView;
