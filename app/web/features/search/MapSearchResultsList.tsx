import { styled, useMediaQuery } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ResizeableDrawer from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { SearchUser } from "proto/search_pb";
import { useRef } from "react";
import { theme } from "theme";

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

const DrawerContainer = styled("div")({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

const SpinnerWrapper = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(8),
}));

const MobileSheet = styled("div")({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--mui-palette-background-paper)",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  boxShadow: "0px -2px 8px rgba(0,0,0,0.15)",
  overflow: "hidden",
});

const MobileSheetHeader = styled("div")({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 16px 4px",
  cursor: "pointer",
  flexShrink: 0,
  width: "100%",
  boxSizing: "border-box" as const,
  userSelect: "none" as const,
});

const PullerPill = styled("div")({
  width: 30,
  height: 6,
  backgroundColor: "var(--mui-palette-grey-300)",
  borderRadius: 3,
});

const MobileScrollable = styled("div")({
  overflowY: "auto",
  flexGrow: 1,
  WebkitOverflowScrolling: "touch",
});

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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const touchStartY = useRef<number>(0);

  const listContent = isLoading ? (
    <SpinnerWrapper>
      <CenteredSpinner />
    </SpinnerWrapper>
  ) : (
    <SearchResultListContent
      error={error}
      currentRange={currentRange}
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
  );

  if (isMobile) {
    const isExpanded = mapView === MapViews.LIST_ONLY;

    return (
      <MobileSheet>
        <MobileSheetHeader
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const deltaY = touchStartY.current - e.changedTouches[0].clientY;
            if (deltaY > 50 && !isExpanded) {
              onSetMapView(MapViews.LIST_ONLY);
            } else if (deltaY < -50 && isExpanded) {
              onSetMapView(MapViews.MAP_AND_LIST);
            }
          }}
          onClick={() =>
            onSetMapView(
              isExpanded ? MapViews.MAP_AND_LIST : MapViews.LIST_ONLY,
            )
          }
        >
          <PullerPill />
        </MobileSheetHeader>
        <MobileScrollable>{listContent}</MobileScrollable>
        <PreviousNextPagination
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          onPreviousClick={onLoadPreviousPage}
          onNextClick={onLoadNextPage}
        />
      </MobileSheet>
    );
  }

  return (
    <DrawerContainer>
      <ResizeableDrawer
        onDrawerWidthChange={onDrawerWidthChange}
        showDragger={mapView !== MapViews.LIST_ONLY}
        nonScrollableChildren={
          <PreviousNextPagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPreviousClick={onLoadPreviousPage}
            onNextClick={onLoadNextPage}
          />
        }
      >
        {listContent}
      </ResizeableDrawer>
    </DrawerContainer>
  );
};

export default MapSearchResultsList;
