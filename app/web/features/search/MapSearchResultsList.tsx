import { styled, useMediaQuery } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { User } from "proto/api_pb";
import { theme } from "theme";

import PreviousNextPagination from "./PreviousNextPagination";
import SearchResultListContent from "./SearchResultListContent";
import { useMapSearchState } from "./state/mapSearchContext";
import { MapViews, MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "./utils/constants";

interface MapSearchResultsListProps {
  drawerWidth: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
  mapView: MapViews;
  onDrawerWidthChange: (width: number) => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  totalItems?: number;
  users: User.AsObject[] | undefined;
}

const DrawerContainer = styled("div")(({ theme }) => ({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
}));

const MapSearchResultsList = ({
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  mapView,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  totalItems,
  users,
}: MapSearchResultsListProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { hasActiveFilters, hasSearchInputValue, zoom } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters ||
    hasSearchInputValue ||
    zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

  return (
    <DrawerContainer>
      {isLoading && <CenteredSpinner />}

      <ResizeableDrawer
        onDrawerWidthChange={onDrawerWidthChange}
        showDragger={!isMobile && mapView !== MapViews.LIST_ONLY}
      >
        <SearchResultListContent
          showAlert={!isLoading && !meetsSearchCriteria}
          showTopSpace={
            !isMobile &&
            mapView === MapViews.MAP_AND_LIST &&
            drawerWidth > window.innerWidth / 2
          }
          users={users}
        />
        {(hasPreviousPage || hasNextPage) && (
          <PreviousNextPagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            meetsSearchCriteria={meetsSearchCriteria}
            onPreviousClick={onLoadPreviousPage}
            onNextClick={onLoadNextPage}
            totalItems={totalItems}
          />
        )}
      </ResizeableDrawer>
    </DrawerContainer>
  );
};

export default MapSearchResultsList;
