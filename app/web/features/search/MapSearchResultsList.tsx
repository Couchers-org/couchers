import { styled, useMediaQuery } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { User } from "proto/api_pb";
import { theme } from "theme";

import PreviousNextPagination from "./PreviousNextPagination";
import SearchResultListContent from "./SearchResultListContent";
import { useMapSearchState } from "./state/mapSearchContext";
import { MapViews } from "./utils/constants";

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

  const {
    hasActiveFilters,
    hasSearchInputValue,
    search: { bbox },
  } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters || hasSearchInputValue || bbox !== undefined;

  return (
    <DrawerContainer>
      <ResizeableDrawer
        onDrawerWidthChange={onDrawerWidthChange}
        showDragger={!isMobile && mapView !== MapViews.LIST_ONLY}
        nonScrollableChildren={
          <PreviousNextPagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            meetsSearchCriteria={meetsSearchCriteria}
            onPreviousClick={onLoadPreviousPage}
            onNextClick={onLoadNextPage}
            totalItems={totalItems}
          />
        }
      >
        {isLoading ? (
          <CenteredSpinner />
        ) : (
          <SearchResultListContent
            showAlert={!isLoading && !meetsSearchCriteria}
            showTopSpace={
              !isMobile &&
              (mapView === MapViews.LIST_ONLY ||
                (mapView === MapViews.MAP_AND_LIST &&
                  drawerWidth > window.innerWidth / 2))
            }
            users={users}
          />
        )}
      </ResizeableDrawer>
    </DrawerContainer>
  );
};

export default MapSearchResultsList;
