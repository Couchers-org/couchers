import { styled } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { User } from "proto/api_pb";
import { LngLatLike, MapRef } from "react-map-gl/maplibre";

import MapSearchResultsList from "./MapSearchResultsList";
import MapView from "./MapView";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { MapViewOptions, MapViews, MAX_ZOOM_LEVEL } from "./utils/constants";
import { clearMapFeatureState, setMapFeatureState } from "./utils/mapUtils";

interface MapSearchContentProps {
  error: RpcError | null;
  drawerWidth: number;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  mapView: MapViewOptions;
  numberOfTotal: number;
  onDrawerWidthChange: (width: number) => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  onSetMapView: (view: MapViewOptions) => void;
  onZoomIn: (newZoom: number, center?: LngLatLike) => void;
  onZoomOut: (newZoom: number) => void;
  totalItems: number;
  users: User.AsObject[] | undefined;
}

const Wrapper = styled("div")({
  display: "flex",
  height: "100%",
  width: "100%",
  overflow: "hidden",
});

const SearchResultsContainer = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "drawerWidth" && prop !== "isListOnlyView",
})<{ drawerWidth: number; isListOnlyView: boolean }>(
  ({ theme, drawerWidth, isListOnlyView }) => ({
    display: "flex",
    height: "100%",
    width: isListOnlyView ? "100%" : `${drawerWidth}px`,

    ...(!isListOnlyView && {
      [theme.breakpoints.down("md")]: {
        position: "fixed",
        width: "100%",
        height: `calc(45% - 54px)`,
        bottom: 0,
        boxShadow: "0px -2px 4px rgba(0,0,0,0.1)",
        zIndex: theme.zIndex.drawer + 1,
      },
    }),
  }),
);

const MapContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "drawerWidth",
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  width: `calc(100% - ${drawerWidth}px)`,
  height: "100%",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  alignItems: "center",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: `calc(55% - 18px)`,
  },
}));

const MapSearchContent = ({
  error,
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  mapRef,
  mapView,
  numberOfTotal,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  onSetMapView,
  onZoomIn,
  onZoomOut,
  totalItems,
  users,
}: MapSearchContentProps) => {
  const { setSelectedUserId } = useMapSearchActions();
  const { selectedUserId } = useMapSearchState();

  const handleUserCardClick = (userId: number) => {
    if (mapView === MapViews.LIST_ONLY) {
      return;
    }

    if (userId === selectedUserId) {
      clearMapFeatureState(mapRef);
      setSelectedUserId(undefined);
      return;
    }

    clearMapFeatureState(mapRef);
    setSelectedUserId(userId);

    if (mapRef.current) {
      const user = users?.find((user) => user.userId === userId);
      setMapFeatureState(mapRef, userId.toString(), true);
      onZoomIn(MAX_ZOOM_LEVEL, [user?.lng || 0, user?.lat || 0]);
    }
  };

  return (
    <Wrapper>
      <SearchResultsContainer
        drawerWidth={drawerWidth}
        isListOnlyView={mapView === MapViews.LIST_ONLY}
      >
        <MapSearchResultsList
          error={error}
          drawerWidth={drawerWidth}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          mapView={mapView}
          numberOfTotal={numberOfTotal}
          onDrawerWidthChange={onDrawerWidthChange}
          onLoadPreviousPage={onLoadPreviousPage}
          onLoadNextPage={onLoadNextPage}
          onSetMapView={onSetMapView}
          onUserCardClick={handleUserCardClick}
          totalItems={totalItems}
          users={users}
        />
      </SearchResultsContainer>
      {mapView !== MapViews.LIST_ONLY && (
        <MapContainer drawerWidth={drawerWidth}>
          <MapView
            isDrawerExpanded={drawerWidth > DEFAULT_DRAWER_WIDTH}
            isLoading={isLoading}
            mapRef={mapRef}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            users={users}
          />
        </MapContainer>
      )}
    </Wrapper>
  );
};

export default MapSearchContent;
