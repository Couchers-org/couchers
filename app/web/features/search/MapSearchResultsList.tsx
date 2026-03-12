import { styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { SearchUser } from "proto/search_pb";
import useIsMobile from "utils/useIsMobile";

import PreviousNextPagination from "./PreviousNextPagination";
import SearchResultListContent from "./SearchResultListContent";
import { useMapSearchState } from "./state/mapSearchContext";
import { MapViews } from "./utils/constants";

interface MapSearchResultsListProps {
  error: RpcError | null;
  drawerWidth: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
  mapView: MapViews;
  currentRange: string;
  onDrawerWidthChange: (width: number) => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  onSetMapView: (view: MapViews) => void;
  onUserCardClick: (userId: number) => void;
  totalItems?: number;
  users: SearchUser.AsObject[] | undefined;
}

const DrawerContainer = styled("div")(({ theme }) => ({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
}));

const SpinnerWrapper = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(8),
}));

const MapSearchResultsList = ({
  error,
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  mapView,
  currentRange,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  onSetMapView,
  onUserCardClick,
  totalItems,
  users,
}: MapSearchResultsListProps) => {
  const isMobile = useIsMobile();

  const {
    hasActiveFilters,
    search: { bbox, query },
    shouldSearchByUserId,
  } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters ||
    bbox !== undefined ||
    query !== undefined ||
    shouldSearchByUserId;

  return (
    <DrawerContainer>
      <ResizeableDrawer
        onDrawerWidthChange={onDrawerWidthChange}
        showDragger={!isMobile && mapView !== MapViews.LIST_ONLY}
        nonScrollableChildren={
          <PreviousNextPagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPreviousClick={onLoadPreviousPage}
            onNextClick={onLoadNextPage}
          />
        }
      >
        {isLoading ? (
          <SpinnerWrapper>
            <CenteredSpinner />
          </SpinnerWrapper>
        ) : (
          <SearchResultListContent
            error={error}
            mapView={mapView}
            currentRange={currentRange}
            onSetMapView={onSetMapView}
            onUserCardClick={onUserCardClick}
            showAlert={!isLoading && !meetsSearchCriteria}
            showTopSpace={
              !isMobile &&
              (mapView === MapViews.LIST_ONLY ||
                (mapView === MapViews.MAP_AND_LIST &&
                  drawerWidth > window.innerWidth / 2))
            }
            totalItems={totalItems}
            users={users}
          />
        )}
      </ResizeableDrawer>
    </DrawerContainer>
  );
};

export default MapSearchResultsList;
