import { styled, useMediaQuery } from "@mui/material";
import { User } from "proto/api_pb";
import { MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";

import MapSearchResultsList from "./MapSearchResultsList";
import MapView from "./MapView";
import { MapSearchTypes, MapViewOptions, MapViews } from "./utils/constants";

interface MapSearchContentProps {
  drawerWidth: number;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  mapRef: React.RefObject<MapRef>;
  mapView: MapViewOptions;
  onDrawerWidthChange: (width: number) => void;
  onLoadPreviousPage: () => void;
  onLoadNextPage: () => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
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

    [theme.breakpoints.down("md")]: {
      width: "100%",
    },
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
}));

const MapSearchContent = ({
  drawerWidth,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  onDrawerWidthChange,
  onLoadPreviousPage,
  onLoadNextPage,
  mapRef,
  mapView,
  totalItems,
  users,
}: MapSearchContentProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Wrapper>
      <SearchResultsContainer
        drawerWidth={drawerWidth}
        isListOnlyView={mapView === MapViews.LIST_ONLY}
      >
        <MapSearchResultsList
          drawerWidth={drawerWidth}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          mapView={mapView}
          onDrawerWidthChange={onDrawerWidthChange}
          onLoadPreviousPage={onLoadPreviousPage}
          onLoadNextPage={onLoadNextPage}
          totalItems={totalItems}
          users={users}
        />
      </SearchResultsContainer>
      {!isMobile && mapView !== MapViews.LIST_ONLY && (
        <MapContainer drawerWidth={drawerWidth}>
          <MapView isLoading={isLoading} mapRef={mapRef} users={users} />
        </MapContainer>
      )}
    </Wrapper>
  );
};

export default MapSearchContent;
